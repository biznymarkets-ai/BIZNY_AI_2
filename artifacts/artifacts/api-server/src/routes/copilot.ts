import { Router, type IRouter } from "express";
import { db, copilotConversationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { randomUUID } from "node:crypto";
import {
  ChatWithCopilotBody,
  ChatWithCopilotResponse,
  GetCopilotHistoryResponse,
} from "@workspace/api-zod";
import { getUserFromToken } from "./auth";
import { buildBiznyContext, formatContextPrompt } from "../lib/copilot-context";
import { COPILOT_TOOL_DECLARATIONS, executeCopilotTool } from "../lib/copilot-tools";

const router: IRouter = Router();

function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey: apiKey || undefined });
}

const SYSTEM_PROMPT_BASE = `You are Bizny AI-Assist — Productivity Advocate and Industrial Success Partner.

USER RECOGNITION & CONTEXT:
1. When the prompt provides an authenticated USER PROFILE, you are conversing directly with that authenticated user.
2. Address them naturally (e.g. by name), reference their registered business, active venture, and location when relevant.
3. NEVER claim the user is a guest when their USER PROFILE is provided in the prompt context.

STRICT GROUNDING & VERIFICATION POLICY:
1. Bizny database is the sole authoritative source of truth for Bizny-specific entities (suppliers, buyers, templates, opportunities, listings, verification status, and coach tasks).
2. If the user asks for or needs Bizny marketplace listings, suppliers, buyers, blueprints/templates, funding opportunities, or verification status, you MUST invoke the appropriate Bizny tool.
3. NEVER fabricate a Bizny record. If a tool returns 0 matches, clearly state that no matching record exists in the Bizny database.
4. Distinguish between VERIFIED_BY_FIELD_AGENT, COMMUNITY_UNVERIFIED, and GENERAL_KNOWLEDGE.
5. When the user asks you to create a task, invoke 'create_coach_task'.`;

function extractResponseText(response: any): string {
  if (response?.text) return response.text;
  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const textParts = parts.filter((p: any) => typeof p.text === "string").map((p: any) => p.text);
    if (textParts.length > 0) return textParts.join("\n");
  }
  return "";
}

router.post(["/copilot", "/copilot/chat"], async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);

  const parsed = ChatWithCopilotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const sessionId = randomUUID();

  // 1. Build server-side authenticated context
  const biznyContext = await buildBiznyContext(userId);
  console.log(`[CopilotChat] Authenticated UserId: ${userId}, UserName: ${biznyContext.user?.name}, Venture: ${biznyContext.venture?.title}`);
  const contextString = formatContextPrompt(biznyContext);
  const fullSystemInstruction = `${SYSTEM_PROMPT_BASE}\n\n${contextString}`;

  // 2. Load conversation history
  const historyRows = userId
    ? await db
        .select()
        .from(copilotConversationsTable)
        .where(eq(copilotConversationsTable.userId, userId))
        .orderBy(copilotConversationsTable.createdAt)
    : [];

  const recentHistory = historyRows.slice(-10);

  const geminiContents: any[] = [];
  for (const r of recentHistory) {
    const userText = typeof r.message === "string" ? r.message.trim() : "";
    const modelText = typeof r.reply === "string" ? r.reply.trim() : "";
    if (userText) {
      geminiContents.push({ role: "user", parts: [{ text: userText }] });
    }
    if (modelText) {
      geminiContents.push({ role: "model", parts: [{ text: modelText }] });
    }
  }

  const currentMsg = typeof parsed.data.message === "string" && parsed.data.message.trim() ? parsed.data.message.trim() : "Hello";
  geminiContents.push({ role: "user", parts: [{ text: currentMsg }] });

  // Ensure first turn is user
  if (geminiContents[0]?.role !== "user") {
    geminiContents.unshift({ role: "user", parts: [{ text: "Hello" }] });
  }

  let reply = "";
  const collectedActions: string[] = [];

  try {
    const ai = getGeminiAI();

    const MODELS_TO_TRY = ["gemini-3.1-flash-lite", "gemini-3.7-flash", "gemini-3.6-flash"];
    let lastError: any = null;

    for (const modelName of MODELS_TO_TRY) {
      try {
        const initialResponse = await ai.models.generateContent({
          model: modelName,
          contents: geminiContents,
          config: {
            systemInstruction: fullSystemInstruction,
            tools: [{ functionDeclarations: COPILOT_TOOL_DECLARATIONS }],
          },
        });

        const functionCalls = initialResponse.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
          const toolResults: any[] = [];
          for (const call of functionCalls) {
            const execution = await executeCopilotTool(call.name, call.args, userId);
            toolResults.push({
              callName: call.name,
              callId: call.id,
              result: execution.result,
            });
            if (execution.actionCard?.title) {
              collectedActions.push(execution.actionCard.title);
            }
          }

          let candidateContent = initialResponse.candidates?.[0]?.content;
          if (!candidateContent || !candidateContent.parts || candidateContent.parts.length === 0) {
            candidateContent = {
              role: "model",
              parts: functionCalls.map((call) => ({
                functionCall: {
                  name: call.name,
                  args: call.args || {},
                  ...(call.id ? { id: call.id } : {}),
                },
              })),
            };
          }

          const currentContents = [...geminiContents, candidateContent];

          const responseParts = toolResults.map((tr) => {
            const fr: any = {
              name: tr.callName,
              response: { result: tr.result !== undefined ? tr.result : null },
            };
            if (tr.callId) fr.id = tr.callId;
            return { functionResponse: fr };
          });

          currentContents.push({
            role: "user",
            parts: responseParts,
          });

          const followUp = await ai.models.generateContent({
            model: modelName,
            contents: currentContents,
            config: {
              systemInstruction: fullSystemInstruction,
            },
          });

          reply = extractResponseText(followUp) || "I've analyzed the platform records for you. How would you like to proceed?";
          break;
        } else {
          reply = extractResponseText(initialResponse) || "I'm here to help you navigate Bizny's industrial opportunities. What would you like to explore?";
          break;
        }
      } catch (modelErr: any) {
        console.warn(`[CopilotChat] Model ${modelName} attempt failed:`, modelErr?.status, modelErr?.message);
        lastError = modelErr;
      }
    }

    if (!reply && lastError) {
      throw lastError;
    }
  } catch (err: any) {
    console.error("[CopilotChat] Detailed Error:", err?.status, err?.message, err?.stack || err);
    reply = "I'm here to help you discover industries, build ventures, and coordinate productive work across Africa. What would you like to explore today?";
  }

  const suggestedActions = collectedActions.length > 0
    ? collectedActions
    : ["Browse Repository Templates", "Explore Live Opportunities", "View Marketplace Listings", "Check Coach Execution Plan"];

  if (userId) {
    await db.insert(copilotConversationsTable).values({
      userId,
      sessionId,
      message: parsed.data.message,
      reply,
    });
  }

  res.json(ChatWithCopilotResponse.parse({ reply, sessionId, suggestedActions }));
});

router.get("/copilot/history", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.json(GetCopilotHistoryResponse.parse([]));
    return;
  }

  const history = await db.select().from(copilotConversationsTable)
    .where(eq(copilotConversationsTable.userId, userId))
    .orderBy(copilotConversationsTable.createdAt);

  res.json(GetCopilotHistoryResponse.parse(history));
});

export default router;

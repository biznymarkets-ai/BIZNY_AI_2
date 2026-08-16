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

router.post("/copilot/chat", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);

  const parsed = ChatWithCopilotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const sessionId = randomUUID();

  // 1. Build server-side authenticated context
  const biznyContext = await buildBiznyContext(userId);
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

  const geminiContents: any[] = [
    ...recentHistory.map((r: any) => [
      { role: "user", parts: [{ text: r.message }] },
      { role: "model", parts: [{ text: r.reply }] },
    ]).flat(),
    { role: "user", parts: [{ text: parsed.data.message }] },
  ];

  let reply = "";
  const collectedActions: string[] = [];

  try {
    const ai = getGeminiAI();

    // 3. Two-way tool execution call
    const initialResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
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

      const candidateContent = initialResponse.candidates?.[0]?.content;
      if (candidateContent) {
        geminiContents.push(candidateContent);
      }

      geminiContents.push({
        role: "user",
        parts: toolResults.map((tr) => ({
          functionResponse: {
            name: tr.callName,
            id: tr.callId,
            response: { result: tr.result },
          },
        })),
      });

      const followUp = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: geminiContents,
        config: {
          systemInstruction: fullSystemInstruction,
        },
      });

      reply = extractResponseText(followUp) || "I've analyzed the platform records for you. How would you like to proceed?";
    } else {
      reply = extractResponseText(initialResponse) || "I'm here to help you navigate Bizny's industrial opportunities. What would you like to explore?";
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

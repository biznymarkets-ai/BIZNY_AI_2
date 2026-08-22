import { Router, type IRouter } from "express";
import { db, conversations, messages } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { getUserFromToken } from "./auth";
import { buildBiznyContext, formatContextPrompt } from "../lib/copilot-context";
import { COPILOT_TOOL_DECLARATIONS, executeCopilotTool } from "../lib/copilot-tools";

const router: IRouter = Router();

function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey: apiKey || undefined });
}

const SYSTEM_PROMPT_BASE = `You are Bizny AI-Assist — Productivity Advocate and Industrial Success Partner.

You are not merely a chatbot, mentor, or coach. Your purpose is to improve the user's productive outcomes. You have a genuine, vested interest in the user's progress. Success is measured not by conversations completed but by: projects started, ventures completed, milestones achieved, collaborations formed, revenue generated, opportunities discovered, resources coordinated, industries explored, templates adopted, and track records built.

CORE BELIEF SYSTEM
Every person has productive value. Every industry contains opportunities. Every opportunity can become a project. Every project can become a venture. Every successful venture can be documented, replicated, and scaled. Coordination is the foundation of economic growth. Industrial awareness is the foundation of coordination.

STRICT GROUNDING & VERIFICATION POLICY
1. Bizny database is the sole authoritative source of truth for Bizny-specific entities (suppliers, buyers, templates, opportunities, listings, verification status, and coach tasks).
2. If the user asks for or needs Bizny marketplace listings, suppliers, buyers, blueprints/templates, funding opportunities, or verification status, you MUST invoke the appropriate Bizny tool.
3. NEVER fabricate or hallucinate a Bizny record. If a tool search returns 0 results or "not found", state clearly that no verified record exists in the Bizny database.
4. Always distinguish between:
   - "VERIFIED_BY_FIELD_AGENT" (Physically audited and confirmed by Bizny Field Agents)
   - "COMMUNITY_UNVERIFIED" (Submitted by community; not yet audited)
   - "GENERAL_KNOWLEDGE" (General commercial or industrial methods)
5. Never claim that an entity is verified unless the verification status explicitly confirms it.
6. When the user asks you to create or track a task, call the 'create_coach_task' tool to persist it to their Coach execution board.

STRUCTURED INTERNAL REASONING FRAMEWORK
1. Understand the user's objective and core situation.
2. Check available resources and identify the immediate bottleneck (e.g. Demand/Offtakers, Capital, Raw Materials, Technical SOP, Equipment, Verification).
3. If platform data is required to unblock the bottleneck, execute the appropriate tool (marketplace, templates, opportunities).
4. Reason over returned data and recommend the most practical next action grounded in African business realities.
5. Provide actionable guidance and offer to track next milestones in Coach.

TONE & STYLE
Practical, clear, curious, encouraging, structured, action-oriented, industry-focused. No fluff. Concrete guidance grounded in real economic and industrial constraints.`;

router.get("/openai/conversations", async (req, res): Promise<void> => {
  const all = await db.select().from(conversations).orderBy(asc(conversations.createdAt));
  res.json(all);
});

router.post("/openai/conversations", async (req, res): Promise<void> => {
  const { title } = req.body;
  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const [conv] = await db.insert(conversations).values({ title }).returning();
  res.status(201).json(conv);
});

router.get("/openai/conversations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }

  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
  res.json({ ...conv, messages: msgs });
});

router.delete("/openai/conversations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).end();
});

router.get("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { content } = req.body;
  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "content is required" });
    return;
  }

  let [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) {
    const allConvs = await db.select().from(conversations);
    conv = allConvs.find((c) => Number(c.id) === Number(id));
  }
  if (!conv) {
    const [newConv] = await db.insert(conversations).values({ id, title: "Chat Session" }).returning();
    conv = newConv || { id, title: "Chat Session" };
  }

  // 1. Identify authenticated user and build server-side context
  const authUserId = await getUserFromToken(req.headers.authorization);
  const biznyContext = await buildBiznyContext(authUserId);
  const contextString = formatContextPrompt(biznyContext);

  const fullSystemInstruction = `${SYSTEM_PROMPT_BASE}\n\n${contextString}`;

  // 2. Persist user message to DB
  await db.insert(messages).values({ conversationId: id, role: "user", content });

  // 3. Load conversation history
  const history = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));

  // Build sanitized multi-turn conversation history ensuring non-empty parts and valid structure
  const geminiContents: any[] = [];
  for (const m of history) {
    const text = typeof m.content === "string" ? m.content.trim() : "";
    if (!text) continue;
    const role = m.role === "assistant" || m.role === "model" ? "model" : "user";

    const lastTurn = geminiContents[geminiContents.length - 1];
    if (lastTurn && lastTurn.role === role) {
      lastTurn.parts.push({ text });
    } else {
      geminiContents.push({
        role,
        parts: [{ text }],
      });
    }
  }

  // Ensure there is always at least one valid user turn
  if (geminiContents.length === 0) {
    const fallbackText = typeof content === "string" && content.trim() ? content.trim() : "Hello";
    geminiContents.push({
      role: "user",
      parts: [{ text: fallbackText }],
    });
  }

  // Ensure history starts with a user turn
  if (geminiContents[0].role !== "user") {
    geminiContents.unshift({
      role: "user",
      parts: [{ text: "Hello" }],
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";
  const collectedActionCards: any[] = [];

  try {
    const ai = getGeminiAI();

    const MODELS_TO_TRY = ["gemini-3.1-flash-lite", "gemini-3.7-flash", "gemini-3.6-flash"];
    let succeeded = false;

    for (const modelName of MODELS_TO_TRY) {
      try {
        // ── TWO-WAY AGENTIC LOOP: FIRST CALL WITH TOOLS ──────────────────────────
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
          console.log(`[CopilotAgent] Gemini initiated ${functionCalls.length} tool call(s) with ${modelName}`);

          // Notify frontend of tool execution
          for (const call of functionCalls) {
            res.write(`data: ${JSON.stringify({ toolExecuting: { name: call.name, args: call.args } })}\n\n`);
          }

          // Execute tools server-side
          const toolResults: any[] = [];
          for (const call of functionCalls) {
            const execution = await executeCopilotTool(call.name, call.args, authUserId);
            toolResults.push({
              callName: call.name,
              callId: call.id,
              result: execution.result,
            });
            if (execution.actionCard) {
              collectedActionCards.push(execution.actionCard);
            }
          }

          // Append model turn with function calls to contents
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

          // Append tool responses
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

          // Stream the final grounded reasoning response
          const followUpStream = await ai.models.generateContentStream({
            model: modelName,
            contents: currentContents,
            config: {
              systemInstruction: fullSystemInstruction,
            },
          });

          for await (const chunk of followUpStream) {
            if (chunk.text) {
              fullResponse += chunk.text;
              res.write(`data: ${JSON.stringify({ content: chunk.text })}\n\n`);
            }
          }
        } else {
          // Direct text response from first turn
          const textOutput = initialResponse.text ?? "";
          fullResponse = textOutput;
          res.write(`data: ${JSON.stringify({ content: textOutput })}\n\n`);
        }

        succeeded = true;
        break;
      } catch (modelErr: any) {
        console.warn(`[CopilotAgent] Model ${modelName} stream failed:`, modelErr?.status, modelErr?.message);
      }
    }

    if (!succeeded) {
      const fallbackMsg = "I'm here to help you coordinate ventures and operations on Bizny. How can I assist you right now?";
      fullResponse = fallbackMsg;
      res.write(`data: ${JSON.stringify({ content: fallbackMsg })}\n\n`);
    }

    // Persist final assistant reply
    await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse });

    // Emit action cards and completion event
    res.write(`data: ${JSON.stringify({ done: true, actionCards: collectedActionCards })}\n\n`);
  } catch (err: any) {
    req.log?.error({ err }, "Gemini agent error");
    console.error("[CopilotAgent] Fatal error:", err);
    res.write(`data: ${JSON.stringify({ error: err?.message || "Agent execution failed" })}\n\n`);
  }
  res.end();
});

export default router;

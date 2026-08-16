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

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  // 1. Identify authenticated user and build server-side context
  const authUserId = await getUserFromToken(req.headers.authorization);
  const biznyContext = await buildBiznyContext(authUserId);
  const contextString = formatContextPrompt(biznyContext);

  const fullSystemInstruction = `${SYSTEM_PROMPT_BASE}\n\n${contextString}`;

  // 2. Persist user message to DB
  await db.insert(messages).values({ conversationId: id, role: "user", content });

  // 3. Load conversation history
  const history = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));

  const geminiContents: any[] = history.map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";
  const collectedActionCards: any[] = [];

  try {
    const ai = getGeminiAI();

    // ── TWO-WAY AGENTIC LOOP: FIRST CALL WITH TOOLS ──────────────────────────
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
      console.log(`[CopilotAgent] Gemini initiated ${functionCalls.length} tool call(s)`);

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
      const candidateContent = initialResponse.candidates?.[0]?.content;
      if (candidateContent) {
        geminiContents.push(candidateContent);
      }

      // Append tool responses
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

      // Stream the final grounded reasoning response
      const followUpStream = await ai.models.generateContentStream({
        model: "gemini-3.1-flash-lite",
        contents: geminiContents,
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

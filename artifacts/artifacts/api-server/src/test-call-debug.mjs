import { GoogleGenAI, Type } from "@google/genai";
import { COPILOT_TOOL_DECLARATIONS, executeCopilotTool } from "./lib/copilot-tools.ts";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || undefined });

async function debugChat(message) {
  console.log(`\n--- Testing Message: "${message}" ---`);
  const geminiContents = [
    { role: "user", parts: [{ text: message }] }
  ];

  try {
    const res1 = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: geminiContents,
      config: {
        systemInstruction: "You are Bizny Co-Pilot. Search the database when needed.",
        tools: [{ functionDeclarations: COPILOT_TOOL_DECLARATIONS }],
      }
    });

    console.log("res1 text:", res1.text);
    console.log("res1 functionCalls:", res1.functionCalls);

    const functionCalls = res1.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const toolResults = [];
      for (const call of functionCalls) {
        const execution = await executeCopilotTool(call.name, call.args, 1);
        console.log("Executed tool result:", execution.result);
        toolResults.push({
          callName: call.name,
          callId: call.id,
          result: execution.result,
        });
      }

      const candidateContent = res1.candidates?.[0]?.content;
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
          }
        }))
      });

      console.log("Calling follow-up with contents:", JSON.stringify(geminiContents, null, 2));

      const res2 = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: geminiContents,
        config: {
          systemInstruction: "You are Bizny Co-Pilot. Search the database when needed.",
          tools: [{ functionDeclarations: COPILOT_TOOL_DECLARATIONS }],
        }
      });

      console.log("res2 text:\n", res2.text);
    }
  } catch (err) {
    console.error("DEBUG ERROR:", err);
  }
}

async function run() {
  await debugChat("Find me a relevant Bizny template or blueprint for solving my coconut nursery and commercialization bottleneck.");
  await debugChat("Create a high priority task for me to follow up with Niger Delta Agribusiness Offtakers in Uyo regarding my 8,000 seedlings.");
}

run();

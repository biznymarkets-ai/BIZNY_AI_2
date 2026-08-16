import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || undefined });

async function run() {
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [{ role: "user", parts: [{ text: "Hello! Say hi in 5 words." }] }],
      config: {
        tools: [{
          functionDeclarations: [{
            name: "test_tool",
            description: "A test tool",
            parameters: {
              type: "OBJECT",
              properties: {
                query: { type: "STRING", description: "Search query" }
              }
            }
          }]
        }]
      }
    });
    console.log("Response text:", res.text);
    console.log("Function calls:", res.functionCalls);
  } catch (err) {
    console.error("Gemini Error:", err);
  }
}
run();

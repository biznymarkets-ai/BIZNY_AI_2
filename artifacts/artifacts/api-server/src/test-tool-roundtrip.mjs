import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || undefined });

async function testModel(modelName) {
  console.log(`\nTesting ${modelName}...`);
  const getListingTool = {
    name: "get_listing",
    description: "Get listing by id",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER, description: "Listing ID" },
      },
      required: ["id"],
    },
  };

  const contents = [
    { role: "user", parts: [{ text: "Look up listing ID 42 and tell me its verification status." }] }
  ];

  try {
    const res1 = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        tools: [{ functionDeclarations: [getListingTool] }],
      }
    });

    console.log("Turn 1 functionCalls:", res1.functionCalls);
    const candidateContent = res1.candidates?.[0]?.content;
    const toolCalls = res1.functionCalls || [];

    contents.push(candidateContent);
    contents.push({
      role: "user",
      parts: toolCalls.map((tc) => ({
        functionResponse: {
          name: tc.name,
          id: tc.id,
          response: {
            result: { id: tc.args.id, title: "Coconut seedlings", status: "VERIFIED_BY_FIELD_AGENT" }
          }
        }
      }))
    });

    const res2 = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        tools: [{ functionDeclarations: [getListingTool] }],
      }
    });

    console.log("Turn 2 text:\n", res2.text);
    return true;
  } catch (err) {
    console.error(`Error on ${modelName}:`, err.message || err);
    return false;
  }
}

async function run() {
  await testModel("gemini-3.1-pro-preview");
  await testModel("gemini-3.1-flash-lite");
  await testModel("gemini-flash-latest");
}

run();

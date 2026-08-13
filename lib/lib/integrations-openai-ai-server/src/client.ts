import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

let _openai: OpenAI | null = null;
let _genai: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!_genai) {
    const apiKey = process.env.GEMINI_API_KEY;
    _genai = new GoogleGenAI({ apiKey: apiKey || undefined });
  }
  return _genai;
}

export function getOpenAI(): OpenAI {
  if (!_openai) {
    const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? "missing-key";
    _openai = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });
  }
  return _openai;
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getOpenAI();
    const value = Reflect.get(client, prop);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

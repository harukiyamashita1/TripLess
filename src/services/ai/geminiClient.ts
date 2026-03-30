import { GoogleGenAI } from "@google/genai";

export const getApiKey = () => {
  if (typeof process !== "undefined" && process.env) {
    if (
      process.env.API_KEY &&
      process.env.API_KEY !== "undefined" &&
      !process.env.API_KEY.includes("TODO")
    ) return process.env.API_KEY;

    if (
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== "undefined" &&
      !process.env.GEMINI_API_KEY.includes("TODO")
    ) return process.env.GEMINI_API_KEY;
  }

  if (typeof import.meta !== "undefined" && import.meta.env) {
    if (
      import.meta.env.VITE_API_KEY &&
      import.meta.env.VITE_API_KEY !== "undefined" &&
      !import.meta.env.VITE_API_KEY.includes("TODO")
    ) return import.meta.env.VITE_API_KEY;

    if (
      import.meta.env.VITE_GEMINI_API_KEY &&
      import.meta.env.VITE_GEMINI_API_KEY !== "undefined" &&
      !import.meta.env.VITE_GEMINI_API_KEY.includes("TODO")
    ) return import.meta.env.VITE_GEMINI_API_KEY;
  }

  try {
    // @ts-ignore
    if (typeof API_KEY !== "undefined" && API_KEY && API_KEY !== "undefined" && !API_KEY.includes("TODO")) return API_KEY;
    // @ts-ignore
    if (typeof GEMINI_API_KEY !== "undefined" && GEMINI_API_KEY && GEMINI_API_KEY !== "undefined" && !GEMINI_API_KEY.includes("TODO")) return GEMINI_API_KEY;
  } catch (e) {}

  return "";
};

let aiInstance: GoogleGenAI | null = null;

export const getAI = () => {
  if (aiInstance) return aiInstance;

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("Gemini API key is missing. AI features are disabled.");
    return null;
  }

  const maskedKey =
    apiKey.length > 8
      ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
      : "***";
  console.log(`Initializing Gemini client with key: ${maskedKey}`);

  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
};

export const isAIEnabled = () => !!getApiKey();

import { GoogleGenAI } from "@google/genai";

// Note: In a real production app, this would be on the server.
// For this MVP, we'll use it in the service layer which can be called from server or client.
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  return '';
};

const apiKey = getApiKey();

export const ai = new GoogleGenAI({ apiKey });

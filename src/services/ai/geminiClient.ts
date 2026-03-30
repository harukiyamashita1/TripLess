import { GoogleGenAI } from "@google/genai";

// Note: In a real production app, this would be on the server.
// For this MVP, we'll use it in the service layer which can be called from server or client.
export const getApiKey = () => {
  // Check process.env (server-side or build-time define)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.API_KEY && process.env.API_KEY !== 'undefined' && !process.env.API_KEY.includes('TODO')) return process.env.API_KEY;
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'undefined' && !process.env.GEMINI_API_KEY.includes('TODO')) return process.env.GEMINI_API_KEY;
  }
  
  // Check import.meta.env (client-side)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_API_KEY && import.meta.env.VITE_API_KEY !== 'undefined' && !import.meta.env.VITE_API_KEY.includes('TODO')) return import.meta.env.VITE_API_KEY;
    if (import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY !== 'undefined' && !import.meta.env.VITE_GEMINI_API_KEY.includes('TODO')) return import.meta.env.VITE_GEMINI_API_KEY;
  }

  // Check global variables
  try {
    // @ts-ignore
    if (typeof API_KEY !== 'undefined' && API_KEY && API_KEY !== 'undefined' && !API_KEY.includes('TODO')) return API_KEY;
    // @ts-ignore
    if (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY && GEMINI_API_KEY !== 'undefined' && !GEMINI_API_KEY.includes('TODO')) return GEMINI_API_KEY;
  } catch (e) {}
  
  return '';
};

export const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API Key is missing or invalid. Please select a key in AI Studio or provide it in environment variables.');
  }
  
  // Log sanitized key for debugging
  const maskedKey = apiKey.length > 8 
    ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
    : '***';
  console.log(`Initializing Gemini client with key: ${maskedKey}`);
  
  return new GoogleGenAI({ apiKey });
};

// For backward compatibility, but getAI() is preferred to avoid stale keys
export const ai = getAI();

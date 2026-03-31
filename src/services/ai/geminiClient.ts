import { GoogleGenAI } from "@google/genai";

// Note: In a real production app, this would be on the server.
// For this MVP, we'll use it in the service layer which can be called from server or client.
export const getApiKey = () => {
  return process.env.GEMINI_API_KEY || '';
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


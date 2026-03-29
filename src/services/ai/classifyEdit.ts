import { ai } from './geminiClient';
import { classificationSchema } from './schemas';
import { SYSTEM_PROMPTS } from './prompts';
import { Trip } from '../../types';

export async function classifyEditAI(
  currentTrip: Trip,
  userRequest: string
) {
  const hasApiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                   (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY);

  if (!hasApiKey) {
    return {
      edit_type: 'local',
      target_module: 'hotel',
      affected_days: [],
      requires_timeline_recalc: false,
      explanation: "Mock classification for local edit."
    };
  }
  const prompt = `Analyze the user's edit request for their current trip.
Current Trip JSON:
${JSON.stringify(currentTrip, null, 2)}

User Request: "${userRequest}"

${SYSTEM_PROMPTS.CLASSIFY_EDIT}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: classificationSchema,
      temperature: 0.1,
    },
  });

  return JSON.parse(response.text || "{}");
}

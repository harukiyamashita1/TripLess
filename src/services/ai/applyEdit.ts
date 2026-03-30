import { getAI, getApiKey } from './geminiClient';
import { patchSchema } from './schemas';
import { SYSTEM_PROMPTS } from './prompts';
import { Trip, ChangeSummary } from '../../types';
import { mockChangeSummary } from './mockFallback';

export async function applyEditAI(
  currentTrip: Trip,
  userRequest: string,
  classification: any
): Promise<{ updatedTrip: Trip; changeSummary: ChangeSummary }> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      updatedTrip: { ...currentTrip },
      changeSummary: mockChangeSummary
    };
  }

  const ai = getAI();

  if (!ai) {
    return {
      updatedTrip: { ...currentTrip },
      changeSummary: mockChangeSummary
    };
  }

  const prompt = `Apply the requested edit to the current trip.
Current Trip JSON:
${JSON.stringify(currentTrip, null, 2)}

User Request: "${userRequest}"

Classification:
${JSON.stringify(classification, null, 2)}

${SYSTEM_PROMPTS.APPLY_EDIT}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: patchSchema,
      temperature: 0.2,
    },
  });

  return JSON.parse(response.text || "{}") as { updatedTrip: Trip; changeSummary: ChangeSummary };
}

import { getAI, getApiKey } from './geminiClient';
import { tripSchema } from './schemas';
import { SYSTEM_PROMPTS } from './prompts';
import { Trip } from '../../types';
import { mockTrip } from './mockFallback';

export async function generateTripAI(
  destination: string,
  startDate: string,
  endDate: string,
  travelers: number,
  budgetStyle: string,
  pace: string,
  tripType: string,
  additionalNotes: string
): Promise<Trip> {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn('GEMINI_API_KEY is missing. Using mock data.');
    return {
      ...mockTrip,
      destination: destination || mockTrip.destination,
      startDate,
      endDate,
      travelers,
      budgetStyle: budgetStyle as any,
      pace: pace as any
    };
  }

  const ai = getAI();
  const destPrompt = destination 
    ? `for ${destination}` 
    : `for a highly recommended, amazing travel destination that fits the time of year, budget, and pace`;

  let prompt = `Create a realistic, highly curated travel itinerary ${destPrompt} from ${startDate} to ${endDate} for ${travelers} people.
Budget: ${budgetStyle}. Pace: ${pace}. Trip focus: ${tripType}.
${SYSTEM_PROMPTS.GENERATE_TRIP}
If no specific destination was provided, pick a fantastic destination and make sure to return its name in the 'destination' field.`;

  if (additionalNotes.trim()) {
    prompt += `\n\nUser's additional notes and specific requests:\n"${additionalNotes}"\nPlease heavily factor these notes into the itinerary and hotel selection.`;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: tripSchema,
      temperature: 0.7,
    },
  });

  return JSON.parse(response.text || "{}") as Trip;
}

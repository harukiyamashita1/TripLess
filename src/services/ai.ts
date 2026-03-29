import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Trip, ChangeSummary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const tripSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    destination: { type: Type.STRING },
    startDate: { type: Type.STRING },
    endDate: { type: Type.STRING },
    travelers: { type: Type.NUMBER },
    budgetStyle: { type: Type.STRING, enum: ['budget', 'balanced', 'premium'] },
    pace: { type: Type.STRING, enum: ['relaxed', 'medium', 'fast'] },
    summary: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        totalCostEstimate: { type: Type.NUMBER },
      },
      required: ['title', 'description', 'totalCostEstimate'],
    },
    stay: {
      type: Type.OBJECT,
      properties: {
        areaName: { type: Type.STRING },
        areaDescription: { type: Type.STRING },
        hotels: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              pricePerNight: { type: Type.NUMBER },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING },
            },
            required: ['id', 'name', 'pricePerNight', 'tags', 'description'],
          },
        },
      },
      required: ['areaName', 'areaDescription', 'hotels'],
    },
    itinerary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dayNumber: { type: Type.NUMBER },
          date: { type: Type.STRING },
          theme: { type: Type.STRING },
          modules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['activity', 'meal', 'transit'] },
                time: { type: Type.STRING },
                duration: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                costEstimate: { type: Type.NUMBER },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                location: { type: Type.STRING },
              },
              required: ['id', 'type', 'time', 'duration', 'title', 'description', 'costEstimate', 'tags'],
            },
          },
        },
        required: ['dayNumber', 'date', 'theme', 'modules'],
      },
    },
  },
  required: ['id', 'destination', 'startDate', 'endDate', 'travelers', 'budgetStyle', 'pace', 'summary', 'stay', 'itinerary'],
};

export async function generateTrip(
  destination: string,
  startDate: string,
  endDate: string,
  travelers: number,
  budgetStyle: string,
  pace: string,
  tripType: string,
  additionalNotes: string
): Promise<Trip> {
  const destPrompt = destination 
    ? `for ${destination}` 
    : `for a highly recommended, amazing travel destination that fits the time of year, budget, and pace`;

  let prompt = `Create a realistic, highly curated travel itinerary ${destPrompt} from ${startDate} to ${endDate} for ${travelers} people.
Budget: ${budgetStyle}. Pace: ${pace}. Trip focus: ${tripType}.
The trip should be modular. Provide a stay module with the best area and 3 hotel options.
Provide a day-by-day itinerary with activities, meals, and transit modules.
Ensure realistic timing and logical geographic grouping of activities. Avoid generic filler.
If no specific destination was provided, pick a fantastic destination and make sure to return its name in the 'destination' field.`;

  if (additionalNotes.trim()) {
    prompt += `\n\nUser's additional notes and specific requests:\n"${additionalNotes}"\nPlease heavily factor these notes into the itinerary and hotel selection.`;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: tripSchema,
      temperature: 0.7,
    },
  });

  return JSON.parse(response.text || "{}") as Trip;
}

export async function refineTrip(
  currentTrip: Trip,
  userRequest: string
): Promise<{ updatedTrip: Trip; changeSummary: ChangeSummary }> {
  const prompt = `You are an AI travel concierge. The user wants to refine their current trip.
Current Trip JSON:
${JSON.stringify(currentTrip, null, 2)}

User Request: "${userRequest}"

CRITICAL RULES:
1. Minimal-change editing: ONLY modify the relevant parts of the trip based on the request.
2. Preserve the rest of the itinerary exactly as it is.
3. If a location changes, recalculate transit and timing for adjacent items ONLY if necessary.
4. Provide a concise change summary explaining what changed and what stayed the same.

Return the updated trip and a change summary.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          updatedTrip: tripSchema,
          changeSummary: {
            type: Type.OBJECT,
            properties: {
              message: { type: Type.STRING, description: "Concise explanation of what changed and why, e.g., 'Updated hotel suggestions only. The rest of your trip stayed the same.'" },
              affectedDays: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "List of day numbers that were modified. Empty if only stay was modified." },
              changedModules: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of modules that were changed, e.g., ['Stay', 'Day 2 Dinner']" },
              unchangedModules: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of modules that were preserved, e.g., ['Day 1', 'Day 3']" },
              timingAdjusted: { type: Type.BOOLEAN, description: "Whether timing was adjusted due to the change" },
              explanation: { type: Type.STRING, description: "Detailed explanation of why nearby optimization happened, or what was preserved." }
            },
            required: ['message', 'affectedDays', 'changedModules', 'unchangedModules', 'timingAdjusted', 'explanation']
          }
        },
        required: ['updatedTrip', 'changeSummary']
      },
      temperature: 0.2, // Lower temperature for more deterministic, minimal changes
    },
  });

  return JSON.parse(response.text || "{}") as { updatedTrip: Trip; changeSummary: ChangeSummary };
}

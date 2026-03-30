import { Type, Schema } from "@google/genai";

export const tripSchema: Schema = {
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
        currencyCode: { type: Type.STRING },
      },
      required: ['title', 'description', 'totalCostEstimate', 'currencyCode'],
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

export const classificationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    edit_type: { type: Type.STRING, enum: ['local', 'dependent', 'global'] },
    target_module: { type: Type.STRING, enum: ['hotel', 'meal', 'activity', 'timing', 'full_trip'] },
    affected_days: { type: Type.ARRAY, items: { type: Type.NUMBER } },
    requires_timeline_recalc: { type: Type.BOOLEAN },
    explanation: { type: Type.STRING }
  },
  required: ['edit_type', 'target_module', 'affected_days', 'requires_timeline_recalc', 'explanation']
};

export const patchSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    updatedTrip: tripSchema,
    changeSummary: {
      type: Type.OBJECT,
      properties: {
        message: { type: Type.STRING },
        affectedDays: { type: Type.ARRAY, items: { type: Type.NUMBER } },
        changedModules: { type: Type.ARRAY, items: { type: Type.STRING } },
        unchangedModules: { type: Type.ARRAY, items: { type: Type.STRING } },
        timingAdjusted: { type: Type.BOOLEAN },
        explanation: { type: Type.STRING }
      },
      required: ['message', 'affectedDays', 'changedModules', 'unchangedModules', 'timingAdjusted', 'explanation']
    }
  },
  required: ['updatedTrip', 'changeSummary']
};

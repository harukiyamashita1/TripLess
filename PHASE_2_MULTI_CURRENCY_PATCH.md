# Phase 2: Multi-currency + conversion + UX polish patch

This patch contains the exact file contents to complete the full phase 2 implementation.

## 1) `src/lib/currency.ts`

```ts
import { Trip } from '../types';

const DEFAULT_CURRENCY_CODE = 'USD';

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', label: 'USD · US Dollar' },
  { code: 'JPY', label: 'JPY · Japanese Yen' },
  { code: 'EUR', label: 'EUR · Euro' },
  { code: 'GBP', label: 'GBP · British Pound' },
  { code: 'CAD', label: 'CAD · Canadian Dollar' },
  { code: 'AUD', label: 'AUD · Australian Dollar' },
  { code: 'CHF', label: 'CHF · Swiss Franc' },
] as const;

const APPROX_USD_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  JPY: 150,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
  CHF: 0.88,
};

const DESTINATION_CURRENCY_KEYWORDS: Array<{ currencyCode: string; keywords: string[] }> = [
  { currencyCode: 'JPY', keywords: ['japan', 'tokyo', 'kyoto', 'osaka', 'hokkaido', 'okinawa', 'nagoya', 'fukuoka'] },
  { currencyCode: 'EUR', keywords: ['france', 'paris', 'italy', 'rome', 'milan', 'florence', 'spain', 'madrid', 'barcelona', 'germany', 'berlin', 'munich', 'netherlands', 'amsterdam', 'portugal', 'lisbon', 'greece', 'athens', 'europe'] },
  { currencyCode: 'GBP', keywords: ['uk', 'united kingdom', 'england', 'london', 'scotland', 'edinburgh'] },
  { currencyCode: 'CAD', keywords: ['canada', 'toronto', 'vancouver', 'montreal', 'banff'] },
  { currencyCode: 'AUD', keywords: ['australia', 'sydney', 'melbourne', 'brisbane', 'perth'] },
  { currencyCode: 'CHF', keywords: ['switzerland', 'zurich', 'geneva', 'lucerne', 'interlaken'] },
  { currencyCode: 'USD', keywords: ['united states', 'usa', 'new york', 'hawaii', 'los angeles', 'las vegas', 'san francisco', 'miami', 'chicago'] },
];

export function normalizeCurrencyCode(currencyCode?: string): string {
  const normalized = currencyCode?.trim().toUpperCase();
  return normalized && APPROX_USD_EXCHANGE_RATES[normalized] ? normalized : DEFAULT_CURRENCY_CODE;
}

export function inferCurrencyCodeFromDestination(destination?: string): string {
  if (!destination?.trim()) return DEFAULT_CURRENCY_CODE;

  const normalizedDestination = destination.trim().toLowerCase();
  const match = DESTINATION_CURRENCY_KEYWORDS.find(({ keywords }) =>
    keywords.some(keyword => normalizedDestination.includes(keyword))
  );

  return match?.currencyCode || DEFAULT_CURRENCY_CODE;
}

export function getTripCurrencyCode(trip: Trip): string {
  return normalizeCurrencyCode(trip.summary.currencyCode || inferCurrencyCodeFromDestination(trip.destination));
}

export function convertCurrency(amount: number, fromCurrencyCode: string, toCurrencyCode: string): number {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const from = normalizeCurrencyCode(fromCurrencyCode);
  const to = normalizeCurrencyCode(toCurrencyCode);

  if (from === to) return safeAmount;

  const usdAmount = safeAmount / APPROX_USD_EXCHANGE_RATES[from];
  return usdAmount * APPROX_USD_EXCHANGE_RATES[to];
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const normalizedCurrencyCode = normalizeCurrencyCode(currencyCode);

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: normalizedCurrencyCode,
      maximumFractionDigits: normalizedCurrencyCode === 'JPY' || safeAmount >= 100 ? 0 : 2,
    }).format(safeAmount);
  } catch {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: DEFAULT_CURRENCY_CODE,
      maximumFractionDigits: safeAmount >= 100 ? 0 : 2,
    }).format(safeAmount);
  }
}

export function formatTripCurrency(amount: number, trip: Trip): string {
  return formatCurrency(amount, getTripCurrencyCode(trip));
}
```

## 2) `src/types.ts`

```ts
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Hotel {
  id: string;
  name: string;
  pricePerNight: number;
  tags: string[];
  description: string;
}

export interface StayModule {
  areaName: string;
  areaDescription: string;
  hotels: Hotel[];
}

export interface TripModule {
  id: string;
  type: 'activity' | 'meal' | 'transit';
  time: string;
  duration: string;
  title: string;
  description: string;
  costEstimate: number;
  tags: string[];
  location?: string;
}

export interface DayPlan {
  dayNumber: number;
  date: string;
  theme: string;
  modules: TripModule[];
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budgetStyle: 'budget' | 'balanced' | 'premium';
  pace: 'relaxed' | 'medium' | 'fast';
  summary: {
    title: string;
    description: string;
    totalCostEstimate: number;
    currencyCode?: string;
  };
  stay: StayModule;
  itinerary: DayPlan[];
}

export interface ChangeSummary {
  message: string;
  affectedDays: number[];
  changedModules: string[];
  unchangedModules: string[];
  timingAdjusted: boolean;
  explanation: string;
}
```

## 3) `src/services/ai/schemas.ts`

```ts
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
```

## 4) `src/services/ai/prompts.ts`

```ts
export const SYSTEM_PROMPTS = {
  GENERATE_TRIP: `You are an expert travel concierge. Create a realistic, highly curated travel itinerary.
The trip should be modular. Provide a stay module with the best area and 3 hotel options.
Provide a day-by-day itinerary with activities, meals, and transit modules.
Ensure realistic timing and logical geographic grouping of activities. Avoid generic filler.

CRITICAL CURRENCY RULES:
1. Use exactly one currency for the full response.
2. That currency must be the destination's local currency.
3. Include summary.currencyCode as a valid ISO 4217 code such as USD, JPY, EUR, or GBP.
4. stay.hotels.pricePerNight, itinerary.modules.costEstimate, and summary.totalCostEstimate must all use that same currency.
5. Do not mix currencies anywhere in the JSON response.` ,

  CLASSIFY_EDIT: `You are an AI travel concierge. Analyze the user's edit request for their current trip.
Classify the edit into one of these types:
- local: Only one specific module or item changes (e.g., "change this dinner").
- dependent: A change that affects nearby items (e.g., "move this activity to the morning" might affect lunch timing).
- global: A change that affects the whole trip (e.g., "make the whole trip more budget-friendly").
Identify the target module and affected days.`,

  APPLY_EDIT: `You are an AI travel concierge. Apply the requested edit to the current trip.
CRITICAL RULES:
1. Minimal-change editing: ONLY modify the relevant parts of the trip based on the request.
2. Preserve the rest of the itinerary exactly as it is.
3. If a location changes, recalculate transit and timing for adjacent items ONLY if necessary.
4. Preserve the existing trip currency and keep all returned monetary values in the same currency.
5. Provide a concise change summary explaining what changed and what stayed the same.`
};
```

## 5) `src/services/ai/generateTrip.ts`

```ts
import { getAI, getApiKey } from './geminiClient';
import { tripSchema } from './schemas';
import { SYSTEM_PROMPTS } from './prompts';
import { Trip } from '../../types';
import { mockTrip } from './mockFallback';
import {
  convertCurrency,
  formatCurrency,
  inferCurrencyCodeFromDestination,
  normalizeCurrencyCode,
} from '../../lib/currency';

function buildBudgetInstruction(destination: string, budgetStyle: string): string {
  const exactBudgetMatch = budgetStyle.match(/^Exact amount:\s*([\d,.]+)\s*([A-Z]{3})$/i);

  if (!exactBudgetMatch) {
    return `Budget preference: ${budgetStyle}.`;
  }

  const rawAmount = Number(exactBudgetMatch[1].replace(/,/g, ''));
  const sourceCurrencyCode = normalizeCurrencyCode(exactBudgetMatch[2]);

  if (!destination.trim()) {
    return `The user gave an exact total trip budget of ${formatCurrency(rawAmount, sourceCurrencyCode)} (${sourceCurrencyCode}). If you choose a destination with another local currency, convert that budget first and keep every returned monetary value in the chosen destination currency.`;
  }

  const destinationCurrencyCode = inferCurrencyCodeFromDestination(destination);
  const convertedBudget = convertCurrency(rawAmount, sourceCurrencyCode, destinationCurrencyCode);

  if (sourceCurrencyCode === destinationCurrencyCode) {
    return `The user gave an exact total trip budget of ${formatCurrency(rawAmount, sourceCurrencyCode)} (${sourceCurrencyCode}). Treat it as a hard ceiling for the full trip.`;
  }

  return `The user gave an exact total trip budget of ${formatCurrency(rawAmount, sourceCurrencyCode)} (${sourceCurrencyCode}). The approximate converted planning budget is ${formatCurrency(convertedBudget, destinationCurrencyCode)} (${destinationCurrencyCode}). Treat the converted destination-currency amount as a hard ceiling for the full trip.`;
}

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
  const inferredCurrencyCode = inferCurrencyCodeFromDestination(destination);

  if (!apiKey) {
    console.warn('GEMINI_API_KEY is missing. Using mock data.');
    return {
      ...mockTrip,
      destination: destination || mockTrip.destination,
      startDate,
      endDate,
      travelers,
      budgetStyle: budgetStyle as any,
      pace: pace as any,
      summary: {
        ...mockTrip.summary,
        currencyCode: destination ? inferredCurrencyCode : mockTrip.summary.currencyCode,
      },
    };
  }

  const ai = getAI();

  if (!ai) {
    console.warn('Gemini client unavailable. Using mock data.');
    return {
      ...mockTrip,
      destination: destination || mockTrip.destination,
      startDate,
      endDate,
      travelers,
      budgetStyle: budgetStyle as any,
      pace: pace as any,
      summary: {
        ...mockTrip.summary,
        currencyCode: destination ? inferredCurrencyCode : mockTrip.summary.currencyCode,
      },
    };
  }

  const destPrompt = destination
    ? `for ${destination}`
    : `for a highly recommended, amazing travel destination that fits the time of year, budget, and pace`;

  const currencyInstruction = destination
    ? `Return all monetary values in ${inferredCurrencyCode}, which is the destination's local currency. Set summary.currencyCode to ${inferredCurrencyCode}.`
    : `Pick the most appropriate local currency for the destination you choose. Then use that same currency consistently for summary.totalCostEstimate, all hotel pricePerNight values, and all module costEstimate values. Set summary.currencyCode to that ISO 4217 currency code.`;

  let prompt = `Create a realistic, highly curated travel itinerary ${destPrompt} from ${startDate} to ${endDate} for ${travelers} people.
${buildBudgetInstruction(destination, budgetStyle)} Pace: ${pace}. Trip focus: ${tripType}.
${currencyInstruction}
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
```

## 6) `src/services/ai/mockFallback.ts`

```ts
import { Trip, ChangeSummary } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { convertCurrency, inferCurrencyCodeFromDestination } from '../../lib/currency';

const mockDestination = "Tokyo, Japan";
const mockCurrencyCode = inferCurrencyCodeFromDestination(mockDestination);
const toMockCurrency = (amountInUsd: number) => convertCurrency(amountInUsd, 'USD', mockCurrencyCode);

export const mockTrip: Trip = {
  id: uuidv4(),
  destination: mockDestination,
  startDate: "2026-04-10",
  endDate: "2026-04-15",
  travelers: 2,
  budgetStyle: "balanced",
  pace: "medium",
  summary: {
    title: "The Ultimate Tokyo Experience",
    description: "A perfect blend of tradition and futurism in the heart of Japan.",
    totalCostEstimate: toMockCurrency(2500),
    currencyCode: mockCurrencyCode,
  },
  stay: {
    areaName: "Shinjuku",
    areaDescription: "The bustling heart of Tokyo with endless dining, shopping, and neon lights.",
    hotels: [
      {
        id: "h1",
        name: "Park Hyatt Tokyo",
        pricePerNight: toMockCurrency(500),
        tags: ["Luxury", "Iconic View", "Spa"],
        description: "Sophisticated luxury with breathtaking views of the city and Mount Fuji."
      },
      {
        id: "h2",
        name: "Hotel Gracery Shinjuku",
        pricePerNight: toMockCurrency(180),
        tags: ["Modern", "Great Location", "Godzilla"],
        description: "A modern hotel famous for its life-size Godzilla head and central location."
      },
      {
        id: "h3",
        name: "Keio Plaza Hotel",
        pricePerNight: toMockCurrency(220),
        tags: ["Classic", "Family Friendly", "Large"],
        description: "A well-established hotel offering a wide range of amenities and rooms."
      }
    ]
  },
  itinerary: [
    {
      dayNumber: 1,
      date: "2026-04-10",
      theme: "Neon & Nightlife",
      modules: [
        {
          id: "m1",
          type: "transit",
          time: "02:00 PM",
          duration: "1 hour",
          title: "Arrival at Narita Airport",
          description: "Pick up your JR Pass and take the Narita Express to Shinjuku Station.",
          costEstimate: toMockCurrency(30),
          tags: ["Transport", "N'EX"]
        },
        {
          id: "m2",
          type: "activity",
          time: "04:00 PM",
          duration: "2 hours",
          title: "Shinjuku Gyoen National Garden",
          description: "A large park and garden in Shinjuku and Shibuya. It was originally a residence of the Naitō family in the Edo period.",
          costEstimate: toMockCurrency(5),
          tags: ["Nature", "Garden", "Chill"]
        },
        {
          id: "m3",
          type: "meal",
          time: "07:00 PM",
          duration: "1.5 hours",
          title: "Dinner at Omoide Yokocho",
          description: "Also known as 'Piss Alley', this narrow street is packed with tiny yakitori stalls.",
          costEstimate: toMockCurrency(40),
          tags: ["Local", "Street Food", "Atmospheric"]
        }
      ]
    }
  ]
};

export const mockChangeSummary: ChangeSummary = {
  message: "Updated your hotel suggestions to be more budget-friendly as requested.",
  affectedDays: [],
  changedModules: ["Stay"],
  unchangedModules: ["Day 1", "Day 2", "Day 3"],
  timingAdjusted: false,
  explanation: "I found three highly-rated hotels in the same area that offer better value while maintaining great access to the city."
};
```

## 7) `src/pages/CreateTrip.tsx`

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { ArrowLeft, Sparkles, ChevronDown, ChevronUp, Coffee, Mountain, Landmark, Utensils, Music, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateTrip } from '../services/ai';
import { useTripStore } from '../store/TripContext';
import { OtterMascot } from '../components/OtterMascot';
import { SUPPORTED_CURRENCIES } from '../lib/currency';

const TRIP_TYPES = [
  { id: 'any', label: 'Any', icon: Map },
  { id: 'relaxation', label: 'Relax', icon: Coffee },
  { id: 'adventure', label: 'Adventure', icon: Mountain },
  { id: 'culture', label: 'Culture', icon: Landmark },
  { id: 'food & drink', label: 'Foodie', icon: Utensils },
  { id: 'party', label: 'Nightlife', icon: Music },
];

export default function CreateTrip() {
  const navigate = useNavigate();
  const { addTrip, user } = useTripStore();

  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [budgetMode, setBudgetMode] = useState<'style' | 'exact'>('style');
  const [budgetStyle, setBudgetStyle] = useState('balanced');
  const [exactBudget, setExactBudget] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState('USD');
  const [pace, setPace] = useState('medium');
  const [tripType, setTripType] = useState('any');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleCreate = async () => {
    if (!startDate || !endDate) return;

    setIsGenerating(true);
    navigate('/loading', { state: { destination } });

    try {
      const finalBudget = budgetMode === 'exact' && exactBudget
        ? `Exact amount: ${exactBudget} ${budgetCurrency}`
        : budgetStyle;

      const trip = await generateTrip(
        destination,
        startDate,
        endDate,
        travelers,
        finalBudget,
        pace,
        tripType,
        additionalNotes,
        user?.id
      );

      trip.id = uuidv4();
      addTrip(trip);
      navigate(`/trip/${trip.id}`);
    } catch (error) {
      console.error("Failed to generate trip:", error);
      alert("Failed to generate trip. Please try again.");
      navigate('/');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full min-h-screen bg-zinc-50"
    >
      <header className="px-6 py-4 bg-white border-b border-zinc-200 flex items-center sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center border border-brand/20">
            <OtterMascot className="w-5 h-5 drop-shadow-sm" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            New Trip
          </h1>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-8 md:py-12">
        <div className="bg-white rounded-[2rem] shadow-xl shadow-zinc-200/40 border border-zinc-100 overflow-hidden">
          <div className="p-8 sm:p-12 space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-6 bg-gradient-to-br from-brand/5 to-orange-500/5 p-6 rounded-3xl border border-brand/10"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-brand/10">
                <OtterMascot className="w-12 h-12 drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-1 text-zinc-900">Let's plan your trip</h2>
                <p className="text-zinc-600 leading-relaxed">
                  Tell me when you're going, and I'll handle the rest. Budget and itinerary costs will be shown in the destination's local currency.
                </p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 className="text-xl font-semibold tracking-tight mb-5 text-zinc-900">When are you going?</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 block">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    min={today}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate && e.target.value > endDate) {
                        setEndDate(e.target.value);
                      }
                    }}
                    className="h-14 rounded-xl bg-zinc-50 border-zinc-200 focus:bg-white transition-colors text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 block">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate || today}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-14 rounded-xl bg-zinc-50 border-zinc-200 focus:bg-white transition-colors text-lg"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="pt-8 border-t border-zinc-100"
            >
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full py-3 px-4 -mx-4 rounded-xl hover:bg-zinc-50 transition-colors group"
              >
                <span className="text-lg font-semibold text-zinc-800 group-hover:text-brand transition-colors">Optional Details</span>
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                  {showAdvanced ? <ChevronUp className="h-5 w-5 text-zinc-500 group-hover:text-brand" /> : <ChevronDown className="h-5 w-5 text-zinc-500 group-hover:text-brand" />}
                </div>
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-10 pt-6 pb-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 block">
                          Destination <span className="text-zinc-400 font-normal ml-1">(Optional)</span>
                        </label>
                        <Input
                          placeholder="e.g. Tokyo, Paris, or leave blank for a surprise"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className="h-14 rounded-xl bg-zinc-50 border-zinc-200 focus:bg-white transition-colors text-lg"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-zinc-700 block">Travelers</label>
                          <div className="flex items-center space-x-4 bg-zinc-50 p-2 rounded-2xl border border-zinc-200 w-fit">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm" onClick={() => setTravelers(Math.max(1, travelers - 1))}>-</Button>
                            <span className="text-xl font-semibold w-8 text-center text-zinc-900">{travelers}</span>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm" onClick={() => setTravelers(travelers + 1)}>+</Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-zinc-700">Budget</label>
                            <div className="flex bg-zinc-100 rounded-lg p-1">
                              <button
                                onClick={() => setBudgetMode('style')}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${budgetMode === 'style' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                              >
                                Style
                              </button>
                              <button
                                onClick={() => setBudgetMode('exact')}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${budgetMode === 'exact' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                              >
                                Exact
                              </button>
                            </div>
                          </div>

                          {budgetMode === 'style' ? (
                            <div className="flex space-x-2 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-200">
                              {['budget', 'balanced', 'premium'].map(style => (
                                <button
                                  key={style}
                                  onClick={() => setBudgetStyle(style)}
                                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                                    budgetStyle === style
                                      ? 'bg-white text-brand shadow-sm ring-1 ring-zinc-200/50'
                                      : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
                                  }`}
                                >
                                  {style}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="grid grid-cols-[1fr,160px] gap-3">
                                <div className="relative">
                                  <Input
                                    type="number"
                                    placeholder="e.g. 2000"
                                    value={exactBudget}
                                    onChange={(e) => setExactBudget(e.target.value)}
                                    className="h-14 rounded-xl bg-zinc-50 border-zinc-200 focus:bg-white transition-colors text-lg font-medium"
                                  />
                                </div>
                                <select
                                  value={budgetCurrency}
                                  onChange={(e) => setBudgetCurrency(e.target.value)}
                                  className="h-14 rounded-xl bg-zinc-50 border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand/20"
                                >
                                  {SUPPORTED_CURRENCIES.map(currency => (
                                    <option key={currency.code} value={currency.code}>{currency.label}</option>
                                  ))}
                                </select>
                              </div>
                              <p className="text-sm text-zinc-500">
                                Enter your total trip budget in your preferred currency. TripLess will plan and display prices in the destination's local currency.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-zinc-700 block">Trip Focus</label>
                        <div className="flex flex-wrap gap-3">
                          {TRIP_TYPES.map(type => {
                            const Icon = type.icon;
                            const isSelected = tripType === type.id;
                            return (
                              <button
                                key={type.id}
                                onClick={() => setTripType(type.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-brand text-white shadow-md shadow-brand/20 ring-2 ring-brand ring-offset-2'
                                    : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300'
                                }`}
                              >
                                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
                                {type.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-zinc-700 block">Pace</label>
                        <div className="flex space-x-3 bg-zinc-50 p-2 rounded-2xl border border-zinc-200">
                          {['relaxed', 'medium', 'fast'].map(p => (
                            <button
                              key={p}
                              onClick={() => setPace(p)}
                              className={`flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition-all ${
                                pace === p
                                  ? 'bg-white text-brand shadow-sm ring-1 ring-zinc-200/50'
                                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 block">
                          Additional Notes <span className="text-zinc-400 font-normal ml-1">(Optional)</span>
                        </label>
                        <Textarea
                          placeholder="e.g. I have a peanut allergy, prefer boutique hotels, want to visit the Ghibli Museum..."
                          value={additionalNotes}
                          onChange={(e) => setAdditionalNotes(e.target.value)}
                          className="min-h-[120px] rounded-2xl bg-zinc-50 border-zinc-200 focus:bg-white transition-colors text-base p-4 resize-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="p-8 sm:px-12 sm:py-8 bg-zinc-50/80 border-t border-zinc-100 backdrop-blur-sm">
            <Button
              className="w-full h-16 text-xl font-semibold rounded-2xl shadow-xl shadow-brand/20 bg-brand hover:bg-brand-hover text-white transition-all hover:-translate-y-0.5"
              disabled={!startDate || !endDate || isGenerating}
              onClick={handleCreate}
            >
              {isGenerating ? (
                <span className="flex items-center">
                  <Sparkles className="mr-3 h-6 w-6 animate-pulse" />
                  Building Your Journey...
                </span>
              ) : (
                <span className="flex items-center">
                  <Sparkles className="mr-3 h-6 w-6" />
                  Generate Itinerary
                </span>
              )}
            </Button>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
```

## 8) `src/pages/tabs/OverviewTab.tsx`

```tsx
import React from 'react';
import { Trip } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { motion } from 'motion/react';
import { Users, Wallet, Activity, MapPin, Calendar, Compass } from 'lucide-react';
import { formatTripCurrency, getTripCurrencyCode } from '../../lib/currency';

export default function OverviewTab({ trip }: { trip: Trip }) {
  const heroImage = `https://picsum.photos/seed/${trip.destination.replace(/\s+/g, '')}/1200/400`;
  const currencyCode = getTripCurrencyCode(trip);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      <div className="relative h-64 md:h-80 w-full rounded-3xl overflow-hidden shadow-lg group">
        <div className="absolute inset-0 bg-zinc-900/40 group-hover:bg-zinc-900/30 transition-colors z-10" />
        <img
          src={heroImage}
          alt={trip.destination}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-0 left-0 p-6 md:p-8 z-20 text-white w-full bg-gradient-to-t from-zinc-900/90 via-zinc-900/40 to-transparent">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md mb-3">
            {trip.summary.title}
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-2 drop-shadow-md">{trip.destination}</h2>
          <div className="flex items-center text-white/90 text-sm md:text-base font-medium drop-shadow-sm gap-4 flex-wrap">
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {trip.startDate} - {trip.endDate}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs uppercase tracking-wider">
              Prices in {currencyCode}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 flex items-center">
              <Compass className="w-5 h-5 mr-2 text-brand" />
              Trip Summary
            </h3>
            <p className="text-zinc-600 leading-relaxed text-lg">{trip.summary.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <Wallet className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Total Est.</p>
                <p className="text-2xl font-bold text-zinc-900">{formatTripCurrency(trip.summary.totalCostEstimate, trip)}</p>
                {trip.travelers > 1 && (
                  <p className="text-sm text-zinc-400 mt-1">
                    ~{formatTripCurrency(trip.summary.totalCostEstimate / trip.travelers, trip)} / person
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Pace</p>
                <p className="text-2xl font-bold text-zinc-900 capitalize">{trip.pace}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-brand to-brand-hover text-white border-none shadow-md overflow-hidden relative">
            <div className="absolute -top-4 -right-4 p-4 opacity-10 transform rotate-12">
              <MapPin className="h-32 w-32" />
            </div>
            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="text-sm font-medium text-white/80 uppercase tracking-wider">Recommended Area</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-2xl font-bold mb-3">{trip.stay.areaName}</p>
              <p className="text-sm text-white/90 leading-relaxed">{trip.stay.areaDescription}</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-100 shadow-sm relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-5">
              <Compass className="w-40 h-40" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Price Display</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-3xl font-bold text-zinc-900">{currencyCode}</span>
              </div>
              <p className="text-sm text-zinc-600">All hotel, itinerary, and total trip prices are shown in the destination's local currency.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-100">
        <h3 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wider">Trip Profile</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="px-4 py-2 text-sm bg-zinc-100 text-zinc-700 rounded-xl">
            <Users className="w-4 h-4 mr-2" />
            {trip.travelers} Travelers
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm bg-zinc-100 text-zinc-700 capitalize rounded-xl">
            <Wallet className="w-4 h-4 mr-2" />
            {trip.budgetStyle} Budget
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm bg-zinc-100 text-zinc-700 rounded-xl">
            Prices in {currencyCode}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}
```

## 9) `src/pages/tabs/StayTab.tsx`

```tsx
import React from 'react';
import { Trip } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { motion } from 'motion/react';
import { MapPin, DollarSign } from 'lucide-react';
import { formatTripCurrency, getTripCurrencyCode } from '../../lib/currency';

export default function StayTab({ trip }: { trip: Trip }) {
  const currencyCode = getTripCurrencyCode(trip);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      <div className="bg-zinc-50 rounded-3xl p-6 md:p-8 border border-zinc-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Where to Stay</h2>
          <Badge variant="secondary" className="bg-white border border-zinc-200 text-zinc-700 px-4 py-2 rounded-xl">
            Prices in {currencyCode}
          </Badge>
        </div>
        <p className="text-zinc-600 leading-relaxed mb-6 text-lg max-w-3xl">
          Based on your <span className="font-semibold text-zinc-900 capitalize">{trip.pace}</span> pace and <span className="font-semibold text-zinc-900 capitalize">{trip.budgetStyle}</span> budget, we recommend staying in <strong className="text-brand">{trip.stay.areaName}</strong>.
        </p>
        <div className="bg-white rounded-2xl p-5 flex items-start shadow-sm border border-zinc-100">
          <div className="bg-brand/10 p-2 rounded-full mr-4 shrink-0">
            <MapPin className="h-6 w-6 text-brand" />
          </div>
          <p className="text-zinc-700 leading-relaxed">{trip.stay.areaDescription}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight">Top Hotel Picks</h3>
          <span className="text-sm font-medium text-zinc-500">{trip.stay.hotels.length} options</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {trip.stay.hotels.map((hotel, index) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group h-full"
            >
              <Card className="overflow-hidden border-zinc-200 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col rounded-2xl">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={`https://picsum.photos/seed/${hotel.name.replace(/\s+/g, '')}/600/400`}
                    alt={hotel.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm flex items-center font-bold text-zinc-900">
                    <DollarSign className="w-4 h-4 text-emerald-600 mr-0.5" />
                    {formatTripCurrency(hotel.pricePerNight, trip)}
                    <span className="text-xs text-zinc-500 font-medium ml-1">/ night</span>
                  </div>
                </div>

                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl font-bold leading-tight group-hover:text-brand transition-colors">{hotel.name}</CardTitle>
                  </div>

                  <p className="text-sm text-zinc-600 mb-6 line-clamp-3 leading-relaxed flex-1">{hotel.description}</p>

                  <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-zinc-100">
                    {hotel.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs px-2.5 py-1 bg-zinc-100 text-zinc-700 font-medium rounded-lg">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
```

## 10) `src/pages/tabs/ItineraryTab.tsx`

```tsx
import React, { useState } from 'react';
import { Trip } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, MapPin, Utensils, Navigation, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { formatTripCurrency, getTripCurrencyCode } from '../../lib/currency';

export default function ItineraryTab({ trip }: { trip: Trip }) {
  const [expandedDays, setExpandedDays] = useState<number[]>([1]);
  const currencyCode = getTripCurrencyCode(trip);

  const toggleDay = (dayNumber: number) => {
    setExpandedDays(prev =>
      prev.includes(dayNumber)
        ? prev.filter(d => d !== dayNumber)
        : [...prev, dayNumber]
    );
  };

  const expandAll = () => setExpandedDays(trip.itinerary.map(d => d.dayNumber));
  const collapseAll = () => setExpandedDays([]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'meal': return <Utensils className="h-5 w-5 text-orange-500" />;
      case 'transit': return <Navigation className="h-5 w-5 text-blue-500" />;
      default: return <MapPin className="h-5 w-5 text-emerald-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Your Itinerary</h2>
          <p className="text-zinc-500 flex items-center gap-3 flex-wrap">
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {trip.itinerary.length} Days • {trip.pace} pace
            </span>
            <span className="px-3 py-1 rounded-full bg-zinc-100 text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Prices in {currencyCode}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={expandAll} className="text-sm font-medium text-brand hover:text-brand-hover px-3 py-1.5 rounded-lg hover:bg-brand/5 transition-colors">Expand All</button>
          <button onClick={collapseAll} className="text-sm font-medium text-zinc-500 hover:text-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors">Collapse All</button>
        </div>
      </div>

      <div className="space-y-6">
        {trip.itinerary.map((day, index) => (
          <motion.div
            key={day.dayNumber}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden border-zinc-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
              <button
                onClick={() => toggleDay(day.dayNumber)}
                className="w-full flex items-center justify-between p-5 md:p-6 bg-white hover:bg-zinc-50 transition-colors"
              >
                <div className="text-left flex items-center gap-4 md:gap-6">
                  <div className="bg-brand/10 text-brand font-bold text-xl md:text-2xl w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0">
                    D{day.dayNumber}
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-zinc-900 mb-1">{day.theme}</h3>
                    <p className="text-sm font-medium text-zinc-500">{day.date}</p>
                  </div>
                </div>
                <div className="bg-zinc-100 p-2 rounded-full shrink-0">
                  {expandedDays.includes(day.dayNumber) ? (
                    <ChevronUp className="h-5 w-5 text-zinc-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-zinc-600" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {expandedDays.includes(day.dayNumber) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-zinc-100"
                  >
                    <div className="p-5 md:p-8 space-y-8 bg-zinc-50/50">
                      {day.modules.map((mod, i) => (
                        <div key={mod.id} className="relative flex gap-6 md:gap-8 group">
                          {i !== day.modules.length - 1 && (
                            <div className="absolute left-[19px] md:left-[23px] top-12 bottom-[-32px] w-0.5 bg-zinc-200 group-hover:bg-brand/30 transition-colors" />
                          )}

                          <div className="flex flex-col items-center mt-1 shrink-0">
                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white border-2 border-zinc-200 group-hover:border-brand/50 transition-colors flex items-center justify-center z-10 shadow-sm">
                              {getIcon(mod.type)}
                            </div>
                          </div>

                          <div className="flex-1 pb-4">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2 gap-2">
                              <h4 className="text-lg font-bold text-zinc-900 leading-tight group-hover:text-brand transition-colors">{mod.title}</h4>
                              <span className="inline-flex items-center text-sm font-bold text-zinc-700 bg-white border border-zinc-200 shadow-sm px-3 py-1 rounded-full shrink-0 w-fit">
                                {mod.time}
                              </span>
                            </div>

                            <p className="text-zinc-600 mb-4 leading-relaxed text-sm md:text-base">{mod.description}</p>

                            <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2 bg-white p-3 rounded-xl border border-zinc-100 shadow-sm w-fit">
                              {mod.duration && (
                                <span className="flex items-center text-sm text-zinc-600 font-medium">
                                  <Clock className="w-4 h-4 mr-1.5 text-zinc-400" />
                                  {mod.duration}
                                </span>
                              )}
                              {mod.costEstimate > 0 && (
                                <>
                                  <div className="w-1 h-1 rounded-full bg-zinc-300" />
                                  <span className="text-sm text-zinc-600 font-medium">
                                    Est. {formatTripCurrency(mod.costEstimate, trip)}
                                  </span>
                                </>
                              )}
                              {mod.location && (
                                <>
                                  <div className="w-1 h-1 rounded-full bg-zinc-300" />
                                  <span className="text-sm text-zinc-600 font-medium truncate max-w-[200px] flex items-center">
                                    <MapPin className="w-4 h-4 mr-1.5 text-zinc-400" />
                                    {mod.location}
                                  </span>
                                </>
                              )}
                            </div>

                            {mod.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {mod.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-medium rounded-lg transition-colors">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
```

## 11) `src/pages/tabs/TodayTab.tsx`

```tsx
import React from 'react';
import { Trip } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { motion } from 'motion/react';
import { MapPin, Clock, Navigation, CheckCircle2, ArrowRight, Wallet } from 'lucide-react';
import { formatTripCurrency, getTripCurrencyCode } from '../../lib/currency';

export default function TodayTab({ trip }: { trip: Trip }) {
  const todayPlan = trip.itinerary[0];
  const currencyCode = getTripCurrencyCode(trip);

  if (!todayPlan) {
    return (
      <div className="p-12 text-center text-zinc-500 bg-white rounded-3xl border border-zinc-100 shadow-sm">
        No itinerary available for today.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-sm">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">Today</h2>
          <p className="text-zinc-500 font-medium mt-2 text-lg">{todayPlan.date} • {todayPlan.theme}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 px-4 py-2 rounded-xl text-sm w-fit">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            On Track
          </Badge>
          <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 border-zinc-200 px-4 py-2 rounded-xl text-sm w-fit">
            Prices in {currencyCode}
          </Badge>
        </div>
      </div>

      <div className="space-y-6 relative">
        <div className="absolute left-6 md:left-8 top-8 bottom-8 w-0.5 bg-zinc-200 hidden md:block" />

        {todayPlan.modules.map((mod, i) => {
          const isNext = i === 1;
          const isPast = i === 0;

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative md:pl-20"
            >
              <div className={`absolute left-[27px] top-8 w-4 h-4 rounded-full border-4 border-white shadow-sm hidden md:block z-10 ${
                isNext ? 'bg-blue-500' : isPast ? 'bg-zinc-300' : 'bg-zinc-400'
              }`} />

              <Card className={`overflow-hidden transition-all duration-300 rounded-2xl ${
                isNext ? 'border-l-4 border-l-blue-500 shadow-lg bg-white scale-[1.02] md:scale-100' :
                isPast ? 'border border-zinc-200 bg-zinc-50/80 opacity-70' :
                'border border-zinc-200 bg-white hover:shadow-md'
              }`}>
                <CardContent className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3 gap-2">
                    <div className="flex items-center space-x-3">
                      <span className={`text-lg font-bold ${isNext ? 'text-blue-600' : 'text-zinc-900'}`}>
                        {mod.time}
                      </span>
                      {isNext && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-md font-bold tracking-wide">
                          UP NEXT
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-zinc-500 font-medium flex items-center bg-zinc-100 px-3 py-1 rounded-full w-fit">
                        <Clock className="w-4 h-4 mr-1.5" />
                        {mod.duration}
                      </span>
                      {mod.costEstimate > 0 && (
                        <span className="text-sm text-zinc-500 font-medium flex items-center bg-zinc-100 px-3 py-1 rounded-full w-fit">
                          <Wallet className="w-4 h-4 mr-1.5" />
                          {formatTripCurrency(mod.costEstimate, trip)}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className={`text-xl font-bold leading-tight mb-2 ${isPast ? 'line-through text-zinc-500' : 'text-zinc-900'}`}>
                    {mod.title}
                  </h3>

                  {mod.location && (
                     <p className="text-zinc-600 flex items-start mt-3 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                      <MapPin className="w-5 h-5 mr-2 shrink-0 text-zinc-400" />
                      <span className="line-clamp-2">{mod.location}</span>
                    </p>
                  )}

                  {isNext && (
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button className="flex-1 bg-brand text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center hover:bg-brand-hover transition-colors shadow-sm">
                        <Navigation className="w-4 h-4 mr-2" />
                        Start Navigation
                      </button>
                      <button className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-semibold py-3 px-4 rounded-xl flex items-center justify-center hover:bg-zinc-50 hover:border-zinc-300 transition-colors">
                        Find Alternatives
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
```

Apply these file replacements on top of branch `fix/currency-formatting` to complete the full phase 2 rollout.

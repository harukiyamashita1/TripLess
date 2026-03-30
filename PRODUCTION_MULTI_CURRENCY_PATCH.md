# Production-level multi-currency rollout patch

This patch upgrades the earlier phase 2 implementation into a production-grade version with:
- server-side exchange-rate fetching
- short-term in-memory caching on the Express server
- browser-side localStorage caching fallback
- live-rate metadata (source + last updated)
- graceful fallback to destination-local static inference when live rates are unavailable
- exact-budget conversion using server-fetched rates instead of hardcoded approximations

## Why this is production-level

Frankfurter documents that its public API has no key requirement and no usage limits, and it supports rate lookup by base and quote currency. It also recommends caching for high-volume use. Frankfurter can also be filtered to ECB-backed data when needed. The ECB separately states that its euro foreign exchange reference rates are usually updated around 16:00 CET on working days and are for information purposes only. Use this feature for planning/display, not settlement or regulated transaction pricing. citeturn436285search0turn217967search4

---

## 1) Replace `src/lib/currency.ts`

```ts
import { Trip } from '../types';

export const DEFAULT_CURRENCY_CODE = 'USD';

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', label: 'USD · US Dollar' },
  { code: 'JPY', label: 'JPY · Japanese Yen' },
  { code: 'EUR', label: 'EUR · Euro' },
  { code: 'GBP', label: 'GBP · British Pound' },
  { code: 'CAD', label: 'CAD · Canadian Dollar' },
  { code: 'AUD', label: 'AUD · Australian Dollar' },
  { code: 'CHF', label: 'CHF · Swiss Franc' },
] as const;

export type SupportedCurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];

const SUPPORTED_CURRENCY_SET = new Set<string>(SUPPORTED_CURRENCIES.map(currency => currency.code));

const DESTINATION_CURRENCY_KEYWORDS: Array<{ currencyCode: SupportedCurrencyCode; keywords: string[] }> = [
  { currencyCode: 'JPY', keywords: ['japan', 'tokyo', 'kyoto', 'osaka', 'hokkaido', 'okinawa', 'nagoya', 'fukuoka'] },
  { currencyCode: 'EUR', keywords: ['france', 'paris', 'italy', 'rome', 'milan', 'florence', 'spain', 'madrid', 'barcelona', 'germany', 'berlin', 'munich', 'netherlands', 'amsterdam', 'portugal', 'lisbon', 'greece', 'athens', 'vienna', 'brussels', 'europe'] },
  { currencyCode: 'GBP', keywords: ['uk', 'united kingdom', 'england', 'london', 'scotland', 'edinburgh', 'manchester'] },
  { currencyCode: 'CAD', keywords: ['canada', 'toronto', 'vancouver', 'montreal', 'banff'] },
  { currencyCode: 'AUD', keywords: ['australia', 'sydney', 'melbourne', 'brisbane', 'perth'] },
  { currencyCode: 'CHF', keywords: ['switzerland', 'zurich', 'geneva', 'lucerne', 'interlaken'] },
  { currencyCode: 'USD', keywords: ['united states', 'usa', 'new york', 'hawaii', 'los angeles', 'las vegas', 'san francisco', 'miami', 'chicago'] },
];

export interface ExchangeRateSnapshot {
  base: string;
  quotes: Record<string, number>;
  fetchedAt: string;
  provider: string;
}

export function normalizeCurrencyCode(currencyCode?: string): SupportedCurrencyCode {
  const normalized = currencyCode?.trim().toUpperCase();
  if (normalized && SUPPORTED_CURRENCY_SET.has(normalized)) {
    return normalized as SupportedCurrencyCode;
  }
  return DEFAULT_CURRENCY_CODE;
}

export function inferCurrencyCodeFromDestination(destination?: string): SupportedCurrencyCode {
  if (!destination?.trim()) return DEFAULT_CURRENCY_CODE;

  const normalizedDestination = destination.trim().toLowerCase();
  const match = DESTINATION_CURRENCY_KEYWORDS.find(({ keywords }) =>
    keywords.some(keyword => normalizedDestination.includes(keyword))
  );

  return match?.currencyCode || DEFAULT_CURRENCY_CODE;
}

export function getTripCurrencyCode(trip: Trip): SupportedCurrencyCode {
  return normalizeCurrencyCode(trip.summary.currencyCode || inferCurrencyCodeFromDestination(trip.destination));
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const normalizedCurrencyCode = normalizeCurrencyCode(currencyCode);

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: normalizedCurrencyCode,
      maximumFractionDigits: normalizedCurrencyCode === 'JPY' || Math.abs(safeAmount) >= 100 ? 0 : 2,
    }).format(safeAmount);
  } catch {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: DEFAULT_CURRENCY_CODE,
      maximumFractionDigits: Math.abs(safeAmount) >= 100 ? 0 : 2,
    }).format(safeAmount);
  }
}

export function formatTripCurrency(amount: number, trip: Trip): string {
  return formatCurrency(amount, getTripCurrencyCode(trip));
}

export function convertUsingSnapshot(
  amount: number,
  fromCurrencyCode: string,
  toCurrencyCode: string,
  snapshot: ExchangeRateSnapshot
): number {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const from = normalizeCurrencyCode(fromCurrencyCode);
  const to = normalizeCurrencyCode(toCurrencyCode);

  if (from === to) return safeAmount;
  if (snapshot.base !== from) {
    throw new Error(`Snapshot base mismatch: expected ${from}, got ${snapshot.base}`);
  }

  const rate = snapshot.quotes[to];
  if (!rate || !Number.isFinite(rate)) {
    throw new Error(`Missing conversion rate from ${from} to ${to}`);
  }

  return safeAmount * rate;
}
```

---

## 2) Add `src/lib/exchangeRates.ts`

```ts
import {
  DEFAULT_CURRENCY_CODE,
  ExchangeRateSnapshot,
  normalizeCurrencyCode,
} from './currency';

const LOCAL_STORAGE_PREFIX = 'tripless:exchange-rates:';
const LOCAL_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface ExchangeRateApiResponse {
  snapshot: ExchangeRateSnapshot;
  cache: 'server' | 'fresh';
}

function buildStorageKey(base: string, symbols: string[]) {
  return `${LOCAL_STORAGE_PREFIX}${base}:${symbols.sort().join(',')}`;
}

function readLocalCache(base: string, symbols: string[]): ExchangeRateSnapshot | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(buildStorageKey(base, symbols));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ExchangeRateSnapshot;
    const age = Date.now() - new Date(parsed.fetchedAt).getTime();
    if (age > LOCAL_CACHE_TTL_MS) return null;

    return parsed;
  } catch {
    return null;
  }
}

function writeLocalCache(snapshot: ExchangeRateSnapshot) {
  if (typeof window === 'undefined') return;

  try {
    const symbols = Object.keys(snapshot.quotes);
    window.localStorage.setItem(
      buildStorageKey(snapshot.base, symbols),
      JSON.stringify(snapshot)
    );
  } catch {
    // ignore quota / serialization issues
  }
}

export async function fetchExchangeRateSnapshot(
  baseCurrencyCode: string,
  targetCurrencyCodes: string[]
): Promise<ExchangeRateSnapshot> {
  const base = normalizeCurrencyCode(baseCurrencyCode);
  const symbols = Array.from(new Set(targetCurrencyCodes.map(normalizeCurrencyCode)))
    .filter(code => code !== base);

  if (symbols.length === 0) {
    return {
      base,
      quotes: {},
      fetchedAt: new Date().toISOString(),
      provider: 'local',
    };
  }

  const cached = readLocalCache(base, symbols);
  if (cached) return cached;

  const params = new URLSearchParams({
    base,
    symbols: symbols.join(','),
  });

  const response = await fetch(`/api/exchange-rates?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates (${response.status})`);
  }

  const data = (await response.json()) as ExchangeRateApiResponse;
  writeLocalCache(data.snapshot);
  return data.snapshot;
}

export async function convertCurrencyLive(
  amount: number,
  fromCurrencyCode: string,
  toCurrencyCode: string
): Promise<{ convertedAmount: number; snapshot: ExchangeRateSnapshot }> {
  const from = normalizeCurrencyCode(fromCurrencyCode);
  const to = normalizeCurrencyCode(toCurrencyCode);

  if (from === to) {
    return {
      convertedAmount: amount,
      snapshot: {
        base: from,
        quotes: {},
        fetchedAt: new Date().toISOString(),
        provider: 'local',
      },
    };
  }

  const snapshot = await fetchExchangeRateSnapshot(from, [to]);
  const rate = snapshot.quotes[to];

  if (!rate || !Number.isFinite(rate)) {
    throw new Error(`Missing live conversion rate from ${from} to ${to}`);
  }

  return {
    convertedAmount: amount * rate,
    snapshot,
  };
}

export function getFallbackDisplayCurrency(destination?: string) {
  return destination ? normalizeCurrencyCode(DEFAULT_CURRENCY_CODE) : DEFAULT_CURRENCY_CODE;
}
```

---

## 3) Add `src/hooks/useBudgetConversion.ts`

```ts
import { useEffect, useMemo, useState } from 'react';
import { convertCurrencyLive } from '../lib/exchangeRates';
import {
  formatCurrency,
  inferCurrencyCodeFromDestination,
  normalizeCurrencyCode,
} from '../lib/currency';

interface ConversionState {
  destinationCurrencyCode: string;
  convertedBudgetLabel: string | null;
  helperText: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useBudgetConversion(
  destination: string,
  exactBudget: string,
  inputCurrencyCode: string,
  isExactMode: boolean
): ConversionState {
  const destinationCurrencyCode = useMemo(
    () => inferCurrencyCodeFromDestination(destination),
    [destination]
  );

  const [convertedBudgetLabel, setConvertedBudgetLabel] = useState<string | null>(null);
  const [helperText, setHelperText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function run() {
      if (!isExactMode || !exactBudget.trim()) {
        setConvertedBudgetLabel(null);
        setHelperText(null);
        setError(null);
        return;
      }

      const amount = Number(exactBudget.replace(/,/g, ''));
      if (!Number.isFinite(amount) || amount <= 0) {
        setConvertedBudgetLabel(null);
        setHelperText('Enter a valid positive budget amount.');
        setError(null);
        return;
      }

      const inputCurrency = normalizeCurrencyCode(inputCurrencyCode);
      if (inputCurrency === destinationCurrencyCode) {
        const formatted = formatCurrency(amount, inputCurrency);
        setConvertedBudgetLabel(formatted);
        setHelperText(`Trip prices will be shown in ${destinationCurrencyCode}.`);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { convertedAmount, snapshot } = await convertCurrencyLive(
          amount,
          inputCurrency,
          destinationCurrencyCode
        );

        if (isCancelled) return;

        setConvertedBudgetLabel(formatCurrency(convertedAmount, destinationCurrencyCode));
        setHelperText(
          `Approx. live conversion from ${inputCurrency} to ${destinationCurrencyCode} using ${snapshot.provider} rates fetched ${new Date(snapshot.fetchedAt).toLocaleString()}.`
        );
      } catch (err) {
        if (isCancelled) return;

        setConvertedBudgetLabel(null);
        setHelperText(`Trip prices will still be shown in ${destinationCurrencyCode} after generation.`);
        setError('Live conversion preview is temporarily unavailable.');
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    run();

    return () => {
      isCancelled = true;
    };
  }, [destinationCurrencyCode, exactBudget, inputCurrencyCode, isExactMode]);

  return {
    destinationCurrencyCode,
    convertedBudgetLabel,
    helperText,
    isLoading,
    error,
  };
}
```

---

## 4) Replace `server.ts`

```ts
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRANKFURTER_BASE_URL = 'https://api.frankfurter.dev/v1/latest';
const EXCHANGE_RATE_CACHE_TTL_MS = 60 * 60 * 1000;
const DEFAULT_PROVIDER = 'Frankfurter (ECB-backed reference data)';

interface ExchangeRateCacheValue {
  payload: {
    snapshot: {
      base: string;
      quotes: Record<string, number>;
      fetchedAt: string;
      provider: string;
    };
    cache: 'server' | 'fresh';
  };
  expiresAt: number;
}

const exchangeRateCache = new Map<string, ExchangeRateCacheValue>();

function buildCacheKey(base: string, symbols: string) {
  return `${base}:${symbols}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/exchange-rates', async (req, res) => {
    const base = String(req.query.base || 'USD').toUpperCase();
    const symbols = String(req.query.symbols || '')
      .split(',')
      .map(symbol => symbol.trim().toUpperCase())
      .filter(Boolean)
      .filter(symbol => symbol !== base)
      .join(',');

    if (!symbols) {
      return res.json({
        snapshot: {
          base,
          quotes: {},
          fetchedAt: new Date().toISOString(),
          provider: 'local',
        },
        cache: 'fresh',
      });
    }

    const cacheKey = buildCacheKey(base, symbols);
    const cached = exchangeRateCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return res.json({
        ...cached.payload,
        cache: 'server',
      });
    }

    try {
      const upstreamUrl = `${FRANKFURTER_BASE_URL}?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbols)}`;
      const upstreamResponse = await fetch(upstreamUrl, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!upstreamResponse.ok) {
        return res.status(502).json({
          error: 'Failed to fetch upstream exchange rates',
          status: upstreamResponse.status,
        });
      }

      const upstreamJson = await upstreamResponse.json() as {
        base: string;
        date: string;
        rates: Record<string, number>;
      };

      const payload = {
        snapshot: {
          base: upstreamJson.base,
          quotes: upstreamJson.rates,
          fetchedAt: new Date().toISOString(),
          provider: DEFAULT_PROVIDER,
        },
        cache: 'fresh' as const,
      };

      exchangeRateCache.set(cacheKey, {
        payload,
        expiresAt: Date.now() + EXCHANGE_RATE_CACHE_TTL_MS,
      });

      return res.json(payload);
    } catch (error) {
      console.error('Exchange rate fetch failed', error);
      return res.status(500).json({
        error: 'Unexpected error while fetching exchange rates',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
```

---

## 5) Replace `src/services/ai/generateTrip.ts`

```ts
import { getAI, getApiKey } from './geminiClient';
import { tripSchema } from './schemas';
import { SYSTEM_PROMPTS } from './prompts';
import { Trip } from '../../types';
import { mockTrip } from './mockFallback';
import {
  formatCurrency,
  inferCurrencyCodeFromDestination,
  normalizeCurrencyCode,
} from '../../lib/currency';
import { convertCurrencyLive } from '../../lib/exchangeRates';

async function buildBudgetInstruction(destination: string, budgetStyle: string): Promise<string> {
  const exactBudgetMatch = budgetStyle.match(/^Exact amount:\s*([\d,.]+)\s*([A-Z]{3})$/i);

  if (!exactBudgetMatch) {
    return `Budget preference: ${budgetStyle}.`;
  }

  const rawAmount = Number(exactBudgetMatch[1].replace(/,/g, ''));
  const sourceCurrencyCode = normalizeCurrencyCode(exactBudgetMatch[2]);

  if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
    return 'Budget preference: balanced.';
  }

  if (!destination.trim()) {
    return `The user gave an exact total trip budget of ${formatCurrency(rawAmount, sourceCurrencyCode)} (${sourceCurrencyCode}). If you choose a destination with another local currency, convert that budget first and keep every returned monetary value in the chosen destination currency.`;
  }

  const destinationCurrencyCode = inferCurrencyCodeFromDestination(destination);

  if (sourceCurrencyCode === destinationCurrencyCode) {
    return `The user gave an exact total trip budget of ${formatCurrency(rawAmount, sourceCurrencyCode)} (${sourceCurrencyCode}). Treat it as a hard ceiling for the full trip.`;
  }

  try {
    const { convertedAmount, snapshot } = await convertCurrencyLive(
      rawAmount,
      sourceCurrencyCode,
      destinationCurrencyCode
    );

    return `The user gave an exact total trip budget of ${formatCurrency(rawAmount, sourceCurrencyCode)} (${sourceCurrencyCode}). The approximate live converted planning budget is ${formatCurrency(convertedAmount, destinationCurrencyCode)} (${destinationCurrencyCode}) using ${snapshot.provider} rates fetched ${new Date(snapshot.fetchedAt).toISOString()}. Treat the converted destination-currency amount as a hard ceiling for the full trip.`;
  } catch {
    return `The user gave an exact total trip budget of ${formatCurrency(rawAmount, sourceCurrencyCode)} (${sourceCurrencyCode}). Convert it into the destination's local currency before planning and treat the converted amount as a hard ceiling for the full trip.`;
  }
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

  const budgetInstruction = await buildBudgetInstruction(destination, budgetStyle);

  let prompt = `Create a realistic, highly curated travel itinerary ${destPrompt} from ${startDate} to ${endDate} for ${travelers} people.
${budgetInstruction} Pace: ${pace}. Trip focus: ${tripType}.
${currencyInstruction}
${SYSTEM_PROMPTS.GENERATE_TRIP}
If no specific destination was provided, pick a fantastic destination and make sure to return its name in the 'destination' field.`;

  if (additionalNotes.trim()) {
    prompt += `\n\nUser's additional notes and specific requests:\n"${additionalNotes}"\nPlease heavily factor these notes into the itinerary and hotel selection.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: tripSchema,
      temperature: 0.7,
    },
  });

  return JSON.parse(response.text || '{}') as Trip;
}
```

---

## 6) Upgrade `src/pages/CreateTrip.tsx`

In addition to the Phase 2 changes, add a live preview under the exact budget inputs.

### Add imports
```ts
import { useBudgetConversion } from '../hooks/useBudgetConversion';
```

### Add hook inside component
```ts
const budgetPreview = useBudgetConversion(destination, exactBudget, budgetCurrency, budgetMode === 'exact');
```

### Add helper UI directly under the exact budget input/select block
```tsx
<div className="space-y-2">
  <p className="text-sm text-zinc-500">
    Enter your total trip budget in your preferred currency. TripLess will plan and display prices in the destination's local currency.
  </p>

  <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
      Destination currency
    </p>
    <p className="text-sm text-zinc-800 font-medium">
      {budgetPreview.destinationCurrencyCode}
      {budgetPreview.convertedBudgetLabel ? ` · Approx. trip budget ${budgetPreview.convertedBudgetLabel}` : ''}
    </p>
    {budgetPreview.helperText && (
      <p className="text-xs text-zinc-500 mt-1">{budgetPreview.helperText}</p>
    )}
    {budgetPreview.isLoading && (
      <p className="text-xs text-brand mt-1">Fetching live exchange rate preview…</p>
    )}
    {budgetPreview.error && (
      <p className="text-xs text-amber-600 mt-1">{budgetPreview.error}</p>
    )}
  </div>
</div>
```

---

## 7) Upgrade the overview/stay/itinerary/today tabs

Keep the Phase 2 formatting changes, and also surface that rates are for planning and display.

### Example badge/footer copy
```tsx
<Badge variant="secondary" className="px-4 py-2 text-sm bg-zinc-100 text-zinc-700 rounded-xl">
  Prices shown in {currencyCode}
</Badge>
<p className="text-xs text-zinc-500 mt-2">
  Planning prices are estimates and may vary at booking time.
</p>
```

---

## 8) Replace `src/services/ai/mockFallback.ts`

Keep the Phase 2 shape, but remove hardcoded approximate rates and convert by live snapshot only when you have a server available. For mock fallback, the safer production move is to store destination-local mock numbers directly.

```ts
import { Trip, ChangeSummary } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const mockTrip: Trip = {
  id: uuidv4(),
  destination: 'Tokyo, Japan',
  startDate: '2026-04-10',
  endDate: '2026-04-15',
  travelers: 2,
  budgetStyle: 'balanced',
  pace: 'medium',
  summary: {
    title: 'The Ultimate Tokyo Experience',
    description: 'A perfect blend of tradition and futurism in the heart of Japan.',
    totalCostEstimate: 375000,
    currencyCode: 'JPY',
  },
  stay: {
    areaName: 'Shinjuku',
    areaDescription: 'The bustling heart of Tokyo with endless dining, shopping, and neon lights.',
    hotels: [
      {
        id: 'h1',
        name: 'Park Hyatt Tokyo',
        pricePerNight: 75000,
        tags: ['Luxury', 'Iconic View', 'Spa'],
        description: 'Sophisticated luxury with breathtaking views of the city and Mount Fuji.',
      },
      {
        id: 'h2',
        name: 'Hotel Gracery Shinjuku',
        pricePerNight: 27000,
        tags: ['Modern', 'Great Location', 'Godzilla'],
        description: 'A modern hotel famous for its life-size Godzilla head and central location.',
      },
      {
        id: 'h3',
        name: 'Keio Plaza Hotel',
        pricePerNight: 33000,
        tags: ['Classic', 'Family Friendly', 'Large'],
        description: 'A well-established hotel offering a wide range of amenities and rooms.',
      },
    ],
  },
  itinerary: [
    {
      dayNumber: 1,
      date: '2026-04-10',
      theme: 'Neon & Nightlife',
      modules: [
        {
          id: 'm1',
          type: 'transit',
          time: '02:00 PM',
          duration: '1 hour',
          title: 'Arrival at Narita Airport',
          description: 'Pick up your JR Pass and take the Narita Express to Shinjuku Station.',
          costEstimate: 4500,
          tags: ['Transport', "N'EX"],
        },
        {
          id: 'm2',
          type: 'activity',
          time: '04:00 PM',
          duration: '2 hours',
          title: 'Shinjuku Gyoen National Garden',
          description: 'A large park and garden in Shinjuku and Shibuya. It was originally a residence of the Naitō family in the Edo period.',
          costEstimate: 750,
          tags: ['Nature', 'Garden', 'Chill'],
        },
        {
          id: 'm3',
          type: 'meal',
          time: '07:00 PM',
          duration: '1.5 hours',
          title: 'Dinner at Omoide Yokocho',
          description: "Also known as 'Piss Alley', this narrow street is packed with tiny yakitori stalls.",
          costEstimate: 6000,
          tags: ['Local', 'Street Food', 'Atmospheric'],
        },
      ],
    },
  ],
};

export const mockChangeSummary: ChangeSummary = {
  message: 'Updated your hotel suggestions to be more budget-friendly as requested.',
  affectedDays: [],
  changedModules: ['Stay'],
  unchangedModules: ['Day 1', 'Day 2', 'Day 3'],
  timingAdjusted: false,
  explanation: 'I found three highly-rated hotels in the same area that offer better value while maintaining great access to the city.',
};
```

---

## 9) Production acceptance checklist

- [ ] Exact budget can be entered in USD/JPY/EUR/etc.
- [ ] Live preview converts the budget into the destination currency
- [ ] Server caches exchange-rate responses for one hour
- [ ] Browser caches exchange-rate snapshots for six hours
- [ ] AI always returns one consistent currency code for all amounts
- [ ] UI never hardcodes `$`
- [ ] Overview, stay, itinerary, and today tabs display the same currency
- [ ] Fallback works when live exchange-rate fetch fails
- [ ] Copy clearly labels values as planning estimates, not booking guarantees

---

## 10) Suggested release note

> TripLess now supports destination-based multi-currency pricing. Exact trip budgets can be entered in your preferred currency and are converted into the destination's local currency for itinerary planning. Prices are displayed consistently across trip overview, hotel recommendations, and itinerary modules.

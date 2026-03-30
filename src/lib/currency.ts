import { Trip } from '../types';

export const DEFAULT_CURRENCY_CODE = 'USD';

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'CHF', label: 'Swiss Franc (CHF)' },
];

export function normalizeCurrencyCode(currencyCode?: string): string {
  if (!currencyCode) return DEFAULT_CURRENCY_CODE;
  const upper = currencyCode.toUpperCase().trim();
  if (SUPPORTED_CURRENCIES.some(c => c.code === upper)) {
    return upper;
  }
  return upper; // Return whatever they passed if we don't strictly support it, Intl.NumberFormat might still handle it
}

export function inferCurrencyCodeFromDestination(destination?: string): string {
  if (!destination) return DEFAULT_CURRENCY_CODE;
  
  const dest = destination.toLowerCase();
  if (dest.includes('japan') || dest.includes('tokyo') || dest.includes('kyoto') || dest.includes('osaka')) {
    return 'JPY';
  }
  if (dest.includes('uk') || dest.includes('london') || dest.includes('england') || dest.includes('britain')) {
    return 'GBP';
  }
  if (dest.includes('europe') || dest.includes('france') || dest.includes('paris') || dest.includes('germany') || dest.includes('italy') || dest.includes('spain')) {
    return 'EUR';
  }
  if (dest.includes('canada') || dest.includes('toronto') || dest.includes('vancouver')) {
    return 'CAD';
  }
  if (dest.includes('australia') || dest.includes('sydney') || dest.includes('melbourne')) {
    return 'AUD';
  }
  if (dest.includes('switzerland') || dest.includes('zurich') || dest.includes('geneva')) {
    return 'CHF';
  }
  
  return DEFAULT_CURRENCY_CODE;
}

export function getTripCurrencyCode(trip: Trip): string {
  return normalizeCurrencyCode(trip.summary?.currencyCode || inferCurrencyCodeFromDestination(trip.destination));
}

export function formatCurrency(amount: number | undefined, currencyCode: string): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '';
  }
  
  const code = normalizeCurrencyCode(currencyCode);
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: code === 'JPY' ? 0 : 2,
      minimumFractionDigits: code === 'JPY' ? 0 : 0,
    }).format(amount);
  } catch (e) {
    // Fallback if Intl.NumberFormat fails
    const prefix = code === 'USD' ? '$' : code === 'JPY' ? '¥' : code === 'EUR' ? '€' : code === 'GBP' ? '£' : `${code} `;
    return `${prefix}${amount.toLocaleString()}`;
  }
}

export function formatTripCurrency(amount: number | undefined, trip: Trip): string {
  return formatCurrency(amount, getTripCurrencyCode(trip));
}

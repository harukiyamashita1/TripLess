import { Trip } from '../types';

const DEFAULT_CURRENCY_CODE = 'USD';

export function getTripCurrencyCode(trip: Trip): string {
  return trip.summary.currencyCode || DEFAULT_CURRENCY_CODE;
}

export function formatTripCurrency(amount: number, trip: Trip): string {
  return formatCurrency(amount, getTripCurrencyCode(trip));
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: safeAmount >= 100 ? 0 : 2,
    }).format(safeAmount);
  } catch {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: DEFAULT_CURRENCY_CODE,
      maximumFractionDigits: safeAmount >= 100 ? 0 : 2,
    }).format(safeAmount);
  }
}

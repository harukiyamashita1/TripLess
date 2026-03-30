import { Trip } from '../types';

export interface TripEngagement {
  completionScore: number;
  moduleCount: number;
  hotelCount: number;
  dayCount: number;
  statusLabel: string;
  nextBestAction: string;
}

export function calculateTripEngagement(trip: Trip): TripEngagement {
  let score = 0;
  
  const hasSummary = !!(trip.summary && trip.summary.title && trip.summary.description);
  if (hasSummary) score += 20;

  const hasStayArea = !!(trip.stay && trip.stay.areaName);
  if (hasStayArea) score += 10;

  const hotelCount = trip.stay?.hotels?.length || 0;
  if (hotelCount > 0) score += 20;

  const dayCount = trip.itinerary?.length || 0;
  if (dayCount > 0) score += 20;

  const moduleCount = trip.itinerary?.reduce((acc, day) => acc + (day.modules?.length || 0), 0) || 0;
  if (moduleCount >= 3) score += 15;
  if (moduleCount >= 6) score += 15;

  let statusLabel = 'Just Started';
  if (score >= 90) {
    statusLabel = 'Ready to Go';
  } else if (score >= 70) {
    statusLabel = 'Well Crafted';
  } else if (score >= 40) {
    statusLabel = 'Taking Shape';
  }

  let nextBestAction = 'Refine for a better fit';
  if (hotelCount === 0) {
    nextBestAction = 'Add better hotel options';
  } else if (moduleCount < 3) {
    nextBestAction = 'Add more itinerary detail';
  } else if (dayCount <= 1) {
    nextBestAction = 'Expand the plan';
  }

  return {
    completionScore: score,
    moduleCount,
    hotelCount,
    dayCount,
    statusLabel,
    nextBestAction
  };
}

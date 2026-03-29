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
  time: string; // e.g., "09:00 AM"
  duration: string; // e.g., "2 hours"
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

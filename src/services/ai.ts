import { Trip, ChangeSummary } from "../types";

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
  const response = await fetch('/api/trips/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination,
      startDate,
      endDate,
      travelers,
      budgetStyle,
      pace,
      tripType,
      additionalNotes
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate trip');
  }

  return await response.json();
}

export async function refineTrip(
  currentTrip: Trip,
  userRequest: string
): Promise<{ updatedTrip: Trip; changeSummary: ChangeSummary }> {
  const response = await fetch('/api/trips/refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentTrip, userRequest })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to refine trip');
  }

  return await response.json();
}

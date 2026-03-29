import { Trip, ChangeSummary } from "../types";
import { generateTripAI } from "./ai/generateTrip";
import { classifyEditAI } from "./ai/classifyEdit";
import { applyEditAI } from "./ai/applyEdit";
import { tripRepository } from "../lib/repositories/trips";
import { editRepository } from "../lib/repositories/edits";
import { v4 as uuidv4 } from "uuid";

export async function generateTrip(
  destination: string,
  startDate: string,
  endDate: string,
  travelers: number,
  budgetStyle: string,
  pace: string,
  tripType: string,
  additionalNotes: string,
  userId?: string
): Promise<Trip> {
  const trip = await generateTripAI(
    destination,
    startDate,
    endDate,
    travelers,
    budgetStyle,
    pace,
    tripType,
    additionalNotes
  );

  // Ensure ID is set
  if (!trip.id) trip.id = uuidv4();

  // If user is logged in, save to Supabase
  if (userId) {
    await tripRepository.createTrip(trip, userId);
  }

  return trip;
}

export async function refineTrip(
  currentTrip: Trip,
  userRequest: string,
  userId?: string
): Promise<{ updatedTrip: Trip; changeSummary: ChangeSummary }> {
  // 1. Classify the edit
  const classification = await classifyEditAI(currentTrip, userRequest);

  // 2. Apply the edit
  const { updatedTrip, changeSummary } = await applyEditAI(currentTrip, userRequest, classification);

  // 3. If user is logged in, save the edit and update the trip
  if (userId) {
    await editRepository.saveEdit(
      currentTrip.id,
      userId,
      userRequest,
      classification,
      { updatedTrip, changeSummary },
      changeSummary
    );
    await tripRepository.updateTrip(updatedTrip);
  }

  return { updatedTrip, changeSummary };
}

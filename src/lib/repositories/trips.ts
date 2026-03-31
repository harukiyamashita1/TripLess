import { supabase } from '../supabase/client';
import { Trip, DayPlan, TripModule } from '../../types';

export const tripRepository = {
  async createTrip(trip: Trip, userId: string) {
    if (!supabase) {
      console.warn('Supabase client not initialized. Skipping createTrip.');
      return trip;
    }

    // 1. Insert trip
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .insert({
        id: trip.id,
        user_id: userId,
        destination: trip.destination,
        start_date: trip.startDate,
        end_date: trip.endDate,
        travelers: trip.travelers,
        budget_style: trip.budgetStyle,
        pace: trip.pace,
        summary: trip.summary,
        stay: trip.stay
      })
      .select()
      .single();

    if (tripError) throw tripError;

    // 2. Insert days and items
    for (const day of trip.itinerary) {
      const { data: dayData, error: dayError } = await supabase
        .from('trip_days')
        .insert({
          trip_id: trip.id,
          day_number: day.dayNumber,
          date: day.date,
          theme: day.theme
        })
        .select()
        .single();

      if (dayError) throw dayError;

      const items = day.modules.map((mod, index) => ({
        day_id: dayData.id,
        type: mod.type,
        time: mod.time,
        duration: mod.duration,
        title: mod.title,
        description: mod.description,
        cost_estimate: mod.costEstimate,
        tags: mod.tags,
        location: mod.location,
        sort_order: index
      }));

      const { error: itemsError } = await supabase
        .from('trip_day_items')
        .insert(items);

      if (itemsError) throw itemsError;
    }

    return tripData;
  },

  async getTrip(tripId: string): Promise<Trip | null> {
    if (!supabase) {
      console.warn('Supabase client not initialized. Skipping getTrip.');
      return null;
    }

    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select(`
        *,
        trip_days (
          *,
          trip_day_items (*)
        )
      `)
      .eq('id', tripId)
      .single();

    if (tripError) {
      if (tripError.code === 'PGRST116') return null;
      throw tripError;
    }

    // Map database structure to Trip interface
    const itinerary: DayPlan[] = (tripData.trip_days || [])
      .sort((a: any, b: any) => a.day_number - b.day_number)
      .map((day: any) => ({
        dayNumber: day.day_number,
        date: day.date,
        theme: day.theme,
        modules: (day.trip_day_items || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((item: any) => ({
            id: item.id,
            type: item.type,
            time: item.time,
            duration: item.duration,
            title: item.title,
            description: item.description,
            costEstimate: Number(item.cost_estimate),
            tags: item.tags || [],
            location: item.location
          }))
      }));

    return {
      id: tripData.id,
      destination: tripData.destination,
      startDate: tripData.start_date,
      endDate: tripData.end_date,
      travelers: tripData.travelers,
      budgetStyle: tripData.budget_style,
      pace: tripData.pace,
      summary: tripData.summary,
      stay: tripData.stay,
      itinerary
    };
  },

  async listUserTrips(userId: string): Promise<Trip[]> {
    if (!supabase) {
      console.warn('Supabase client not initialized. Skipping listUserTrips.');
      return [];
    }

    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        trip_days (
          *,
          trip_day_items (*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((tripData: any) => {
      const itinerary: DayPlan[] = (tripData.trip_days || [])
        .sort((a: any, b: any) => a.day_number - b.day_number)
        .map((day: any) => ({
          dayNumber: day.day_number,
          date: day.date,
          theme: day.theme,
          modules: (day.trip_day_items || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((item: any) => ({
              id: item.id,
              type: item.type,
              time: item.time,
              duration: item.duration,
              title: item.title,
              description: item.description,
              costEstimate: Number(item.cost_estimate),
              tags: item.tags || [],
              location: item.location
            }))
        }));

      return {
        id: tripData.id,
        destination: tripData.destination,
        startDate: tripData.start_date,
        endDate: tripData.end_date,
        travelers: tripData.travelers,
        budgetStyle: tripData.budget_style,
        pace: tripData.pace,
        summary: tripData.summary,
        stay: tripData.stay,
        itinerary
      };
    });
  },

  async updateTrip(trip: Trip) {
    if (!supabase) {
      console.warn('Supabase client not initialized. Skipping updateTrip.');
      return;
    }

    // This is more complex because of modularity.
    // For now, let's implement a simple full update or localized update logic.
    // A real production app would use a transaction or a more granular approach.
    
    // 1. Update main trip data
    const { error: tripError } = await supabase
      .from('trips')
      .update({
        destination: trip.destination,
        start_date: trip.startDate,
        end_date: trip.endDate,
        travelers: trip.travelers,
        budget_style: trip.budgetStyle,
        pace: trip.pace,
        summary: trip.summary,
        stay: trip.stay,
        updated_at: new Date().toISOString()
      })
      .eq('id', trip.id);

    if (tripError) throw tripError;

    // For itinerary updates, we might want to delete and re-insert or update existing.
    // Let's go with a simple "sync" approach for now.
    // In a real app, we'd only update the changed days/items.
    
    // Delete existing days (cascades to items)
    const { error: deleteError } = await supabase
      .from('trip_days')
      .delete()
      .eq('trip_id', trip.id);

    if (deleteError) throw deleteError;

    // Re-insert days and items
    for (const day of trip.itinerary) {
      const { data: dayData, error: dayError } = await supabase
        .from('trip_days')
        .insert({
          trip_id: trip.id,
          day_number: day.dayNumber,
          date: day.date,
          theme: day.theme
        })
        .select()
        .single();

      if (dayError) throw dayError;

      const items = day.modules.map((mod, index) => ({
        day_id: dayData.id,
        type: mod.type,
        time: mod.time,
        duration: mod.duration,
        title: mod.title,
        description: mod.description,
        cost_estimate: mod.costEstimate,
        tags: mod.tags,
        location: mod.location,
        sort_order: index
      }));

      const { error: itemsError } = await supabase
        .from('trip_day_items')
        .insert(items);

      if (itemsError) throw itemsError;
    }
  },

  async deleteTrip(tripId: string) {
    if (!supabase) {
      console.warn('Supabase client not initialized. Skipping deleteTrip.');
      return;
    }

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (error) throw error;
  }
};

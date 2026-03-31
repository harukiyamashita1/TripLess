import { supabase } from '../supabase/client';
import { ChangeSummary } from '../../types';

export const editRepository = {
  async saveEdit(tripId: string, userId: string, request: string, classification: any, patch: any, changeSummary: ChangeSummary) {
    if (!supabase) {
      console.warn('Supabase client not initialized. Skipping saveEdit.');
      return null;
    }

    const { data, error } = await supabase
      .from('trip_edits')
      .insert({
        trip_id: tripId,
        user_id: userId,
        request,
        classification,
        patch,
        change_summary: changeSummary
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async listTripEdits(tripId: string) {
    if (!supabase) {
      console.warn('Supabase client not initialized. Skipping listTripEdits.');
      return [];
    }

    const { data, error } = await supabase
      .from('trip_edits')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }
};

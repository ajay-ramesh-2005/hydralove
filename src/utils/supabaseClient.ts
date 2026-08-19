import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * Uploads unsynced entries from IndexedDB queue to Supabase
 */
export async function syncOfflineEntriesWithSupabase(unsyncedEntries: any[]) {
  if (!supabase || !unsyncedEntries.length) return false;

  try {
    const { error } = await supabase
      .from('hydration_entries')
      .upsert(
        unsyncedEntries.map(e => ({
          id: e.id,
          user_id: e.userId,
          amount_ml: e.amountMl,
          timestamp: e.timestamp,
          local_date: e.localDate,
          created_at: e.createdAt,
        })),
        { onConflict: 'id' }
      );

    if (error) {
      console.warn('Supabase sync error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network issue during Supabase sync:', err);
    return false;
  }
}

/**
 * Fetches remote hydration entries for a given date from Supabase
 */
export async function fetchRemoteEntriesFromSupabase(localDate: string) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('hydration_entries')
      .select('*')
      .eq('local_date', localDate);

    if (error) {
      console.warn('Fetch remote entries error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amountMl: row.amount_ml,
      timestamp: row.timestamp,
      localDate: row.local_date,
      createdAt: row.created_at,
      synced: true,
    }));
  } catch (err) {
    console.warn('Network issue fetching remote entries:', err);
    return [];
  }
}

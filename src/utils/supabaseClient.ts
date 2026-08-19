import { createClient, SupabaseClient } from '@supabase/supabase-js';

const HARDCODED_SUPABASE_URL = 'https://obrdtnkgcrjqgvzdbbge.supabase.co';
const HARDCODED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmR0bmtnY3JqcWd2emRiYmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzA1NzYsImV4cCI6MjEwMDcwNjU3Nn0.Lrq9U3TKcMykTdPUMWeDYWXorRBMnGXiUKiOdZitBNk';

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || HARDCODED_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || HARDCODED_SUPABASE_ANON_KEY;

  const localUrl = localStorage.getItem('hydralove_supabase_url') || '';
  const localKey = localStorage.getItem('hydralove_supabase_key') || '';

  return {
    url: envUrl || localUrl,
    key: envKey || localKey,
  };
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();

  if (!url || !key) {
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  try {
    cachedUrl = url;
    cachedKey = key;
    cachedClient = createClient(url, key);
    return cachedClient;
  } catch (e) {
    console.warn('Failed to initialize Supabase client:', e);
    return null;
  }
}

export const supabase = getSupabaseClient();
export const isSupabaseConfigured = Boolean(supabase || getSupabaseCredentials().url);

export function saveSupabaseCredentials(url: string, key: string) {
  if (url.trim()) {
    localStorage.setItem('hydralove_supabase_url', url.trim());
  } else {
    localStorage.removeItem('hydralove_supabase_url');
  }

  if (key.trim()) {
    localStorage.setItem('hydralove_supabase_key', key.trim());
  } else {
    localStorage.removeItem('hydralove_supabase_key');
  }

  cachedClient = null;
  cachedUrl = '';
  cachedKey = '';
}

/**
 * Uploads/upserts user profiles (names, weight, goals) to Supabase
 */
export async function syncProfilesWithSupabase(profiles: any[]) {
  const client = getSupabaseClient();
  if (!client || !profiles.length) return false;

  try {
    const { error } = await client
      .from('users')
      .upsert(
        profiles.map(p => ({
          id: p.id,
          name: p.name,
          weight_kg: p.weightKg,
          daily_goal_ml: p.dailyGoalMl,
          role_label: p.roleLabel || p.name,
        })),
        { onConflict: 'id' }
      );

    if (error) {
      console.warn('Supabase profile sync error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network issue syncing profiles:', err);
    return false;
  }
}

/**
 * Fetches user profiles from Supabase to keep all devices synced
 */
export async function fetchProfilesFromSupabase() {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('users')
      .select('*');

    if (error) {
      console.warn('Fetch profiles error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      weightKg: Number(row.weight_kg) || 60,
      dailyGoalMl: Number(row.daily_goal_ml) || 3000,
      createdAt: row.created_at || new Date().toISOString(),
      roleLabel: row.role_label || row.name,
    }));
  } catch (err) {
    console.warn('Network issue fetching profiles:', err);
    return [];
  }
}

/**
 * Uploads unsynced hydration entries from IndexedDB queue to Supabase
 */
export async function syncOfflineEntriesWithSupabase(unsyncedEntries: any[]) {
  const client = getSupabaseClient();
  if (!client || !unsyncedEntries.length) return false;

  try {
    const { error } = await client
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
      console.warn('Supabase entry sync error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network issue during Supabase entry sync:', err);
    return false;
  }
}

/**
 * Fetches remote hydration entries for a given date from Supabase
 */
export async function fetchRemoteEntriesFromSupabase(localDate: string) {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
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

/**
 * Deletes a single entry from Supabase
 */
export async function deleteRemoteEntryFromSupabase(entryId: string) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('hydration_entries')
      .delete()
      .eq('id', entryId);

    if (error) console.warn('Supabase entry delete error:', error.message);
    return !error;
  } catch (e) {
    console.warn('Error deleting remote entry:', e);
    return false;
  }
}

/**
 * Deletes all hydration entries for a specific user and date from Supabase (for Reset Today's Water)
 */
export async function deleteRemoteEntriesForDateFromSupabase(userId: string, localDate: string) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('hydration_entries')
      .delete()
      .eq('user_id', userId)
      .eq('local_date', localDate);

    if (error) console.warn('Supabase reset entries delete error:', error.message);
    return !error;
  } catch (e) {
    console.warn('Error deleting remote entries for date:', e);
    return false;
  }
}

/**
 * Saves custom admin/partner notifications to Supabase table for cross-device notification polling & realtime broadcast
 */
export async function saveRemoteNotificationToSupabase(logEntry: any, senderUserId?: string) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: logEntry.id,
      user_id: logEntry.userId,
      message: logEntry.message,
      type: logEntry.type || 'admin_custom',
      sent_at: logEntry.sentAt || new Date().toISOString(),
      status: 'sent',
    };

    // 1. Save to Supabase table
    const { error } = await client
      .from('notification_history')
      .upsert(payload, { onConflict: 'id' });

    if (error) console.warn('Supabase notification history save error:', error.message);

    // 2. Broadcast via Supabase Realtime Channel for instant zero-latency delivery to all connected devices!
    const channel = client.channel('hydralove_global_push');
    await channel.send({
      type: 'broadcast',
      event: 'custom_push',
      payload: {
        ...payload,
        senderUserId: senderUserId || 'admin',
      },
    });

    return true;
  } catch (e) {
    console.warn('Error saving remote notification:', e);
    return false;
  }
}

/**
 * Fetches recent notifications from Supabase with fail-safe matching for iPhone & Android
 */
export async function fetchRemoteNotificationsFromSupabase(myUserId: string) {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('notification_history')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(20);

    if (error) {
      console.warn('Fetch remote notifications error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      message: row.message,
      type: row.type,
      sentAt: row.sent_at,
      status: row.status,
    }));
  } catch (e) {
    console.warn('Error fetching remote notifications:', e);
    return [];
  }
}

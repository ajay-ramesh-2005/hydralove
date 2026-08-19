import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { UserProfile, HydrationEntry, ReminderSettings, NotificationLog } from '../types';

interface HydraLoveDBSchema extends DBSchema {
  profiles: {
    key: string;
    value: UserProfile;
  };
  entries: {
    key: string;
    value: HydrationEntry;
    indexes: {
      'by-user': string;
      'by-date': string;
      'by-user-date': [string, string];
      'by-synced': number;
    };
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      action: 'ADD_ENTRY' | 'DELETE_ENTRY' | 'UPDATE_PROFILE';
      payload: any;
      timestamp: string;
    };
  };
  settings: {
    key: string;
    value: any;
  };
  notifications: {
    key: string;
    value: NotificationLog;
    indexes: {
      'by-user': string;
    };
  };
}

const DB_NAME = 'hydralove_offline_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<HydraLoveDBSchema>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<HydraLoveDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('entries')) {
          const entryStore = db.createObjectStore('entries', { keyPath: 'id' });
          entryStore.createIndex('by-user', 'userId');
          entryStore.createIndex('by-date', 'localDate');
          entryStore.createIndex('by-user-date', ['userId', 'localDate']);
          entryStore.createIndex('by-synced', 'synced' as any);
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }

        if (!db.objectStoreNames.contains('notifications')) {
          const notifStore = db.createObjectStore('notifications', { keyPath: 'id' });
          notifStore.createIndex('by-user', 'userId');
        }
      },
    });
  }
  return dbPromise;
}

export async function getProfileFromDB(userId: string): Promise<UserProfile | undefined> {
  const db = await getDB();
  return db.get('profiles', userId);
}

export async function saveProfileToDB(profile: UserProfile): Promise<void> {
  const db = await getDB();
  await db.put('profiles', profile);
}

export async function getAllProfilesFromDB(): Promise<UserProfile[]> {
  const db = await getDB();
  return db.getAll('profiles');
}

export async function saveEntryToDB(entry: HydrationEntry): Promise<void> {
  const db = await getDB();
  await db.put('entries', entry);
}

export async function deleteEntryFromDB(entryId: string): Promise<void> {
  const db = await getDB();
  await db.delete('entries', entryId);
}

export async function getEntriesForUserAndDate(userId: string, localDate: string): Promise<HydrationEntry[]> {
  const db = await getDB();
  const tx = db.transaction('entries', 'readonly');
  const index = tx.store.index('by-user-date');
  const entries = await index.getAll([userId, localDate]);
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getAllEntriesForUser(userId: string): Promise<HydrationEntry[]> {
  const db = await getDB();
  const tx = db.transaction('entries', 'readonly');
  const index = tx.store.index('by-user');
  return index.getAll(userId);
}

export async function getAllUnsyncedEntries(): Promise<HydrationEntry[]> {
  const db = await getDB();
  const all = await db.getAll('entries');
  return all.filter(e => !e.synced);
}

export async function addToSyncQueue(action: 'ADD_ENTRY' | 'DELETE_ENTRY' | 'UPDATE_PROFILE', payload: any): Promise<void> {
  const db = await getDB();
  const id = `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await db.put('sync_queue', {
    id,
    action,
    payload,
    timestamp: new Date().toISOString(),
  });
}

export async function getSyncQueue(): Promise<any[]> {
  const db = await getDB();
  return db.getAll('sync_queue');
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sync_queue', id);
}

export async function getSetting<T>(key: string, defaultValue?: T): Promise<T | undefined> {
  const db = await getDB();
  const val = await db.get('settings', key);
  return val !== undefined ? val : defaultValue;
}

export async function saveSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('settings', value, key);
}

export async function saveNotificationLog(log: NotificationLog): Promise<void> {
  const db = await getDB();
  await db.put('notifications', log);
}

export async function getNotificationLogs(userId?: string): Promise<NotificationLog[]> {
  const db = await getDB();
  if (userId) {
    const tx = db.transaction('notifications', 'readonly');
    const index = tx.store.index('by-user');
    return index.getAll(userId);
  }
  return db.getAll('notifications');
}

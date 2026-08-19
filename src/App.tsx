import React, { useState, useEffect } from 'react';
import type { UserProfile, HydrationEntry, ReminderSettings, NotificationLog } from './types';
import {
  getProfileFromDB,
  saveProfileToDB,
  getAllProfilesFromDB,
  getEntriesForUserAndDate,
  saveEntryToDB,
  deleteEntryFromDB,
  getSetting,
  saveSetting,
  getNotificationLogs,
  getAllUnsyncedEntries,
} from './utils/indexedDB';
import { getLocalDateString, calculateDailyGoalMl } from './utils/hydrationGoal';
import {
  syncOfflineEntriesWithSupabase,
  fetchRemoteEntriesFromSupabase,
  syncProfilesWithSupabase,
  fetchProfilesFromSupabase,
} from './utils/supabaseClient';
import {
  requestPushSubscription,
  sendAdminPushNotification,
  initLocalHydrationReminders,
} from './utils/pushNotifications';

import { WelcomeOnboarding } from './components/WelcomeOnboarding';
import { MainHydrationView } from './components/MainHydrationView';
import { AdminDashboard } from './components/AdminDashboard';
import { SettingsModal } from './components/SettingsModal';
import { TogetherCelebrationModal } from './components/TogetherCelebrationModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';

export const App: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>('user_1');
  const [myUserId, setMyUserId] = useState<string>('user_1');
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [isDeviceConfigured, setIsDeviceConfigured] = useState<boolean>(true);

  const [todayEntriesMap, setTodayEntriesMap] = useState<Record<string, HydrationEntry[]>>({});
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: true,
    times: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'],
    soundEnabled: true,
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pushSubscribed, setPushSubscribed] = useState<boolean>(false);

  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showTogetherCelebration, setShowTogetherCelebration] = useState<boolean>(false);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState<boolean>(false);

  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);

  const todayStr = getLocalDateString();

  useEffect(() => {
    async function loadInitialData() {
      const storedProfiles = await getAllProfilesFromDB();
      const savedActiveId = await getSetting<string>('active_user_id', 'user_1');
      const savedMyUserId = await getSetting<string>('my_user_id', '');
      const savedReminders = await getSetting<ReminderSettings>('reminder_settings');
      const savedSound = await getSetting<boolean>('sound_enabled', true);
      const logs = await getNotificationLogs();

      if (savedReminders) setReminderSettings(savedReminders);
      setSoundEnabled(savedSound ?? true);
      setNotificationLogs(logs);

      let currentProfiles = storedProfiles;
      if (!currentProfiles || currentProfiles.length === 0) {
        currentProfiles = [
          {
            id: 'user_1',
            name: 'User 1',
            weightKg: 65,
            dailyGoalMl: 3000,
            createdAt: new Date().toISOString(),
            roleLabel: 'User 1',
          },
          {
            id: 'user_2',
            name: 'User 2',
            weightKg: 55,
            dailyGoalMl: 2800,
            createdAt: new Date().toISOString(),
            roleLabel: 'User 2',
          },
        ];
        for (const p of currentProfiles) {
          await saveProfileToDB(p);
        }
      }

      setProfiles(currentProfiles);

      if (!savedMyUserId) {
        setIsDeviceConfigured(false);
      } else {
        setMyUserId(savedMyUserId);
        setIsDeviceConfigured(true);
      }

      const currentId = savedActiveId || savedMyUserId || currentProfiles[0].id;
      setActiveUserId(currentId);
      const found = currentProfiles.find(p => p.id === currentId) || currentProfiles[0];
      setActiveProfile(found);

      const map: Record<string, HydrationEntry[]> = {};
      for (const p of currentProfiles) {
        const userEntries = await getEntriesForUserAndDate(p.id, todayStr);
        map[p.id] = userEntries;
      }
      setTodayEntriesMap(map);

      // Perform online sync on mount
      if (navigator.onLine) {
        triggerOfflineSyncAndFetch();
      }
    }

    loadInitialData();

    const handleOnline = () => {
      setIsOnline(true);
      triggerOfflineSyncAndFetch();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Online periodic sync every 15s to keep all devices and profile names updated live
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        triggerOfflineSyncAndFetch();
      }
    }, 15000);

    initLocalHydrationReminders(() => activeProfile?.name || '');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  const triggerOfflineSyncAndFetch = async () => {
    if (!navigator.onLine) return;
    
    // 1. Sync remote profile names & goals from Supabase
    const remoteProfiles = await fetchProfilesFromSupabase();
    if (remoteProfiles && remoteProfiles.length > 0) {
      for (const p of remoteProfiles) {
        await saveProfileToDB(p);
      }
      setProfiles(remoteProfiles);
      if (activeProfile) {
        const found = remoteProfiles.find(p => p.id === activeProfile.id);
        if (found) setActiveProfile(found);
      }
    } else if (profiles.length > 0) {
      // Sync local profiles to Supabase if Supabase has no data
      await syncProfilesWithSupabase(profiles);
    }

    // 2. Upload unsynced local hydration entries
    const unsynced = await getAllUnsyncedEntries();
    if (unsynced.length > 0) {
      const success = await syncOfflineEntriesWithSupabase(unsynced);
      if (success) {
        for (const entry of unsynced) {
          await saveEntryToDB({ ...entry, synced: true });
        }
      }
    }

    // 3. Fetch remote entries from Supabase to sync both users' water data
    const remoteEntries = await fetchRemoteEntriesFromSupabase(todayStr);
    if (remoteEntries.length > 0) {
      const map: Record<string, HydrationEntry[]> = {};
      for (const entry of remoteEntries) {
        await saveEntryToDB(entry);
        if (!map[entry.userId]) map[entry.userId] = [];
        map[entry.userId].push(entry);
      }
      setTodayEntriesMap(prev => ({
        ...prev,
        ...map,
      }));
    }
  };

  const handleDeviceOnboardingComplete = async (selectedUserId: string, weightKg: number) => {
    const updatedProfile = profiles.find(p => p.id === selectedUserId);
    if (updatedProfile) {
      const newGoalMl = calculateDailyGoalMl(weightKg);
      const newP = {
        ...updatedProfile,
        weightKg,
        dailyGoalMl: newGoalMl,
      };
      await saveProfileToDB(newP);
      const newProfiles = profiles.map(p => (p.id === selectedUserId ? newP : p));
      setProfiles(newProfiles);
      await syncProfilesWithSupabase(newProfiles);
    }

    await saveSetting('my_user_id', selectedUserId);
    await saveSetting('active_user_id', selectedUserId);

    setMyUserId(selectedUserId);
    setActiveUserId(selectedUserId);
    const found = profiles.find(p => p.id === selectedUserId) || profiles[0];
    setActiveProfile(found);
    setIsDeviceConfigured(true);
  };

  const handleSwitchProfile = async (userId: string) => {
    setActiveUserId(userId);
    await saveSetting('active_user_id', userId);
    const found = profiles.find(p => p.id === userId) || null;
    setActiveProfile(found);

    if (found && !todayEntriesMap[userId]) {
      const userEntries = await getEntriesForUserAndDate(userId, todayStr);
      setTodayEntriesMap(prev => ({ ...prev, [userId]: userEntries }));
    }
  };

  const handleSaveMyUserId = async (userId: string) => {
    setMyUserId(userId);
    await saveSetting('my_user_id', userId);
  };

  const handleSaveProfileNames = async (u1Name: string, u2Name: string) => {
    const p1 = profiles.find(p => p.id === 'user_1');
    const p2 = profiles.find(p => p.id === 'user_2');

    const updated = profiles.map(p => {
      if (p.id === 'user_1') return { ...p, name: u1Name, roleLabel: u1Name };
      if (p.id === 'user_2') return { ...p, name: u2Name, roleLabel: u2Name };
      return p;
    });

    for (const p of updated) {
      await saveProfileToDB(p);
    }

    setProfiles(updated);
    if (activeProfile) {
      const found = updated.find(p => p.id === activeProfile.id);
      if (found) setActiveProfile(found);
    }

    // Sync updated names to Supabase immediately so all devices update!
    await syncProfilesWithSupabase(updated);
  };

  const handleAddWater = async (amountMl: number) => {
    if (!activeProfile) return;

    if (activeProfile.id !== myUserId) {
      return;
    }

    const newEntry: HydrationEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: activeProfile.id,
      amountMl,
      timestamp: new Date().toISOString(),
      localDate: todayStr,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    await saveEntryToDB(newEntry);

    setTodayEntriesMap(prev => {
      const currentList = prev[activeProfile.id] || [];
      return {
        ...prev,
        [activeProfile.id]: [newEntry, ...currentList],
      };
    });

    triggerOfflineSyncAndFetch();
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!activeProfile) return;

    if (activeProfile.id !== myUserId) {
      return;
    }

    await deleteEntryFromDB(entryId);

    setTodayEntriesMap(prev => {
      const currentList = prev[activeProfile.id] || [];
      return {
        ...prev,
        [activeProfile.id]: currentList.filter(e => e.id !== entryId),
      };
    });
  };

  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    await saveProfileToDB(updatedProfile);
    const updatedProfiles = profiles.map(p => (p.id === updatedProfile.id ? updatedProfile : p));
    setProfiles(updatedProfiles);
    if (activeProfile?.id === updatedProfile.id) {
      setActiveProfile(updatedProfile);
    }
    // Sync profile edits to Supabase
    await syncProfilesWithSupabase(updatedProfiles);
  };

  const handleSaveReminders = async (reminders: ReminderSettings) => {
    setReminderSettings(reminders);
    await saveSetting('reminder_settings', reminders);
  };

  const handleToggleSound = async (enabled: boolean) => {
    setSoundEnabled(enabled);
    await saveSetting('sound_enabled', enabled);
  };

  const handleResetToday = async () => {
    if (!activeProfile) return;
    if (activeProfile.id !== myUserId) return;

    const currentList = todayEntriesMap[activeProfile.id] || [];
    for (const e of currentList) {
      await deleteEntryFromDB(e.id);
    }
    setTodayEntriesMap(prev => ({ ...prev, [activeProfile.id]: [] }));
  };

  const handleResetAll = async () => {
    indexedDB.deleteDatabase('hydralove_offline_db');
    localStorage.clear();
    window.location.reload();
  };

  const handleRequestPush = async () => {
    if (!activeProfile) return false;
    const success = await requestPushSubscription(activeProfile.id);
    setPushSubscribed(success);
    return success;
  };

  const handleSendCustomNotification = async (targetUserId: string, message: string) => {
    const success = await sendAdminPushNotification(targetUserId, message);
    const updatedLogs = await getNotificationLogs();
    setNotificationLogs(updatedLogs);
    return success;
  };

  if (!isDeviceConfigured || !activeProfile || profiles.length === 0) {
    return (
      <WelcomeOnboarding
        existingProfiles={profiles.length > 0 ? profiles : [
          { id: 'user_1', name: 'User 1', weightKg: 65, dailyGoalMl: 3000, createdAt: new Date().toISOString(), roleLabel: 'User 1' },
          { id: 'user_2', name: 'User 2', weightKg: 55, dailyGoalMl: 2800, createdAt: new Date().toISOString(), roleLabel: 'User 2' },
        ]}
        onComplete={handleDeviceOnboardingComplete}
      />
    );
  }

  const activeEntries = todayEntriesMap[activeProfile.id] || [];
  const partnerProfile = profiles.find(p => p.id !== activeProfile.id);
  const partnerEntries = partnerProfile ? todayEntriesMap[partnerProfile.id] || [] : [];
  const partnerTodayTotalMl = partnerEntries.reduce((sum, e) => sum + e.amountMl, 0);

  return (
    <div className="relative font-sans text-slate-800 antialiased min-h-screen bg-pink-50">
      {!isOnline && (
        <div className="bg-amber-400 text-amber-950 font-bold text-[11px] py-1 text-center shadow-xs">
          Offline Mode • Saving water data locally 💧
        </div>
      )}

      <MainHydrationView
        activeProfile={activeProfile}
        allProfiles={profiles}
        myUserId={myUserId}
        entries={activeEntries}
        onAddWater={handleAddWater}
        onDeleteEntry={handleDeleteEntry}
        onSwitchProfile={handleSwitchProfile}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        onSendHeartNotification={handleSendCustomNotification}
        onOpenTogetherCelebration={() => setShowTogetherCelebration(true)}
        partnerProfile={partnerProfile}
        partnerTodayMl={partnerTodayTotalMl}
      />

      {showAdmin && (
        <AdminDashboard
          profiles={profiles}
          entriesMap={todayEntriesMap}
          onClose={() => setShowAdmin(false)}
          onSendCustomNotification={handleSendCustomNotification}
          onSaveProfileNames={handleSaveProfileNames}
          notificationLogs={notificationLogs}
        />
      )}

      {showSettings && (
        <SettingsModal
          activeProfile={activeProfile}
          allProfiles={profiles}
          myUserId={myUserId}
          reminderSettings={reminderSettings}
          soundEnabled={soundEnabled}
          onClose={() => setShowSettings(false)}
          onSaveProfile={handleSaveProfile}
          onSaveMyUserId={handleSaveMyUserId}
          onSaveReminders={handleSaveReminders}
          onToggleSound={handleToggleSound}
          onResetToday={handleResetToday}
          onResetAll={handleResetAll}
          onOpenInstallGuide={() => {
            setShowSettings(false);
            setShowInstallGuideModal(true);
          }}
          onRequestPushPermission={handleRequestPush}
          pushSubscribed={pushSubscribed}
        />
      )}

      {showTogetherCelebration && partnerProfile && (
        <TogetherCelebrationModal
          user1={activeProfile}
          user2={partnerProfile}
          onClose={() => setShowTogetherCelebration(false)}
        />
      )}

      <PWAInstallBanner
        forceShowModal={showInstallGuideModal}
        onCloseModal={() => setShowInstallGuideModal(false)}
      />
    </div>
  );
};

export default App;

import { getSetting, saveSetting, saveNotificationLog } from './indexedDB';
import { supabase, saveRemoteNotificationToSupabase } from './supabaseClient';
import type { PushSubscriptionData, NotificationLog, ReminderSettings } from '../types';

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-59y-vD3-p8_J93Jp39-5_k';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestPushSubscription(userId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Web Push is not supported in this browser.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied by user.');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });
    }

    const subJson = subscription.toJSON();
    const p256dhKey = subJson.keys?.p256dh || '';
    const authKey = subJson.keys?.auth || '';

    const subData: PushSubscriptionData = {
      userId,
      endpoint: subscription.endpoint,
      p256dh: p256dhKey,
      auth: authKey,
      createdAt: new Date().toISOString(),
    };

    await saveSetting(`push_sub_${userId}`, subData);

    if (supabase) {
      await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subData.endpoint,
        p256dh: subData.p256dh,
        auth: subData.auth,
        updated_at: new Date().toISOString(),
      });
    }

    return true;
  } catch (err) {
    console.warn('Error subscribing to push notifications:', err);
    return false;
  }
}

async function safeShowNotification(title: string, options: any): Promise<boolean> {
  if (!('Notification' in window)) return false;

  let perm = Notification.permission;
  if (perm !== 'granted') {
    perm = await Notification.requestPermission();
  }
  if (perm !== 'granted') return false;

  let shownViaSW = false;

  if ('serviceWorker' in navigator) {
    try {
      // Race serviceWorker.ready with a 1.5s timeout so it NEVER hangs
      const reg: any = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('SW Timeout')), 1500)),
      ]);

      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options);
        shownViaSW = true;
      }
    } catch (e) {
      console.warn('Service worker not ready or timed out, falling back to direct Notification:', e);
    }
  }

  if (!shownViaSW) {
    try {
      new Notification(title, options);
      return true;
    } catch (err) {
      console.warn('Direct notification error:', err);
      return false;
    }
  }

  return true;
}

export async function triggerTestNotification(userName: string = 'Friend'): Promise<{ success: boolean; message: string }> {
  if (!('Notification' in window)) {
    return { success: false, message: 'Notifications are not supported on this browser/device.' };
  }

  let perm = Notification.permission;
  if (perm !== 'granted') {
    perm = await Notification.requestPermission();
  }

  if (perm !== 'granted') {
    return { success: false, message: 'Notification permission denied in OS/Browser settings.' };
  }

  const title = 'HydraLove 💧 Test Alert!';
  const body = `Hey ${userName}! 💕 Local notifications are working! (Scheduled test in 5s...)`;

  try {
    const options: any = {
      body,
      icon: 'apple-touch-icon.png',
      badge: 'apple-touch-icon.png',
      vibrate: [200, 100, 200],
    };

    const success = await safeShowNotification(title, options);

    // Schedule 5s delayed notification to test screen lock
    setTimeout(async () => {
      const delayedOptions: any = {
        body: `Drink water, ${userName}! 🌸 Your screen lock test succeeded!`,
        icon: 'apple-touch-icon.png',
        vibrate: [300, 100, 300],
      };
      await safeShowNotification('HydraLove ⏰ Delayed Test (5s)', delayedOptions);
    }, 5000);

    if (success) {
      return { success: true, message: 'Test alert sent! Second test will fire in 5 seconds (lock your screen to test).' };
    } else {
      return { success: false, message: 'Failed to display notification. Check OS permissions.' };
    }
  } catch (e: any) {
    return { success: false, message: e?.message || 'Failed to trigger notification.' };
  }
}

export async function sendAdminPushNotification(targetUserId: string, message: string, senderUserId?: string): Promise<boolean> {
  const logEntry: NotificationLog = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: targetUserId,
    message,
    type: 'admin_custom',
    sentAt: new Date().toISOString(),
    status: 'sent',
  };

  await saveNotificationLog(logEntry);

  // Upload to Supabase notification_history so ALL OTHER devices receive it!
  await saveRemoteNotificationToSupabase(logEntry, senderUserId);

  // Invoke Web Push edge function if available
  if (supabase) {
    try {
      const { error } = await supabase.functions.invoke('send-push', {
        body: { targetUserId, message },
      });
      if (error) console.warn('Supabase edge function error:', error.message);
    } catch (e) {
      console.warn('Edge function invoke failed:', e);
    }
  }

  return true;
}

export function initLocalHydrationReminders(getUserName: () => string) {
  if (typeof window === 'undefined') return;

  // Default minute test mode to true for testing
  if (localStorage.getItem('hydralove_test_mode_minute') === null) {
    localStorage.setItem('hydralove_test_mode_minute', 'true');
  }

  const checkAndTriggerReminder = async () => {
    const reminderSettings = await getSetting<ReminderSettings>('reminder_settings');
    if (reminderSettings && !reminderSettings.enabled) return;

    const isEveryMinuteTestMode = localStorage.getItem('hydralove_test_mode_minute') !== 'false';

    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];
    const hoursStr = String(now.getHours()).padStart(2, '0');
    const minutesStr = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hoursStr}:${minutesStr}`;

    let slotKey = '';
    let isScheduledSlot = false;

    if (isEveryMinuteTestMode) {
      // 1-Minute Mode: Every minute is a scheduled slot (09:00, 09:01, 09:02...)
      slotKey = `${todayDateStr}_${currentTimeStr}`;
      isScheduledSlot = true;
    } else {
      // Hourly Mode: Hours with :00 are scheduled slots (09:00, 10:00, 11:00...)
      const currentHourSlot = `${hoursStr}:00`;
      slotKey = `${todayDateStr}_${hoursStr}`;
      isScheduledSlot = reminderSettings?.times?.includes(currentHourSlot) ?? false;
    }

    const lastNotifiedSlot = localStorage.getItem('hydralove_last_notified_slot');

    if (isScheduledSlot && lastNotifiedSlot !== slotKey) {
      const name = getUserName() || 'Friend';
      const title = 'Hydration Time 💧';
      const options: any = {
        body: `Hey ${name}! 💕 It's time for a little water break!`,
        icon: 'apple-touch-icon.png',
        badge: 'apple-touch-icon.png',
        vibrate: [200, 100, 200],
      };

      const success = await safeShowNotification(title, options);
      if (success) {
        localStorage.setItem('hydralove_last_notified_slot', slotKey);
      }
    }
  };

  // Run check every 5 seconds
  setInterval(checkAndTriggerReminder, 5000);

  // Run when app becomes visible / user turns on screen
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkAndTriggerReminder();
    }
  });

  // Run immediately on load
  checkAndTriggerReminder();
}

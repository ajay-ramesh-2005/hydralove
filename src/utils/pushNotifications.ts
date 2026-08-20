import { getSetting, saveSetting, saveNotificationLog } from './indexedDB';
import { supabase, saveRemoteNotificationToSupabase } from './supabaseClient';
import type { PushSubscriptionData, NotificationLog, ReminderSettings } from '../types';

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-59y-vD3-p8_J93Jp39-5_k';

const DEFAULT_REMINDER_TIMES = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00',
  '21:00', '22:00', '23:00', '00:00'
];

function urlBase64ToUint8Array(base64String: string) {
  try {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (e) {
    console.warn('Error converting VAPID key base64:', e);
    return new Uint8Array(0);
  }
}

export function getAbsoluteAppUrl(filename: string): string {
  if (typeof window === 'undefined') return filename;
  const origin = window.location.origin;
  if (origin.includes('github.io')) {
    return `${origin}/hydralove/${filename}`;
  }
  const base = import.meta.env.BASE_URL || '/hydralove/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${origin}${cleanBase}${filename}`;
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

    const swUrl = getAbsoluteAppUrl('sw.js');
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register(swUrl, { scope: getAbsoluteAppUrl('') });
    }

    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const keyBytes = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
      const subOptions: any = { userVisibleOnly: true };
      if (keyBytes.length > 0) {
        subOptions.applicationServerKey = keyBytes;
      }
      subscription = await registration.pushManager.subscribe(subOptions);
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

async function safeShowNotification(title: string, options: any): Promise<{ success: boolean; error?: string }> {
  if (!('Notification' in window)) {
    return { success: false, error: 'Notification API is not supported in this browser.' };
  }

  let perm = Notification.permission;
  if (perm !== 'granted') {
    try {
      perm = await Notification.requestPermission();
    } catch (e: any) {
      return { success: false, error: `Permission request failed: ${e?.message || e}` };
    }
  }

  if (perm !== 'granted') {
    return { success: false, error: `Notification permission is "${perm}". Please allow notifications in phone settings.` };
  }

  const iconUrl = getAbsoluteAppUrl('apple-touch-icon.png');
  const swUrl = getAbsoluteAppUrl('sw.js');

  const safeOptions: any = {
    ...options,
    icon: iconUrl,
    badge: iconUrl,
  };

  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  if ('serviceWorker' in navigator) {
    try {
      let reg: ServiceWorkerRegistration | undefined;

      const readyReg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 1500)),
      ]);

      if (readyReg) {
        reg = readyReg;
      } else {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          reg = registrations[0];
        }
      }

      if (!reg) {
        reg = await navigator.serviceWorker.register(swUrl, { scope: getAbsoluteAppUrl('') });
      }

      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, safeOptions);
        return { success: true };
      }
    } catch (swErr: any) {
      console.warn('First SW showNotification attempt failed, retrying fresh registration:', swErr);

      try {
        const freshReg = await navigator.serviceWorker.register(swUrl, { scope: getAbsoluteAppUrl('') });
        if (freshReg && typeof freshReg.showNotification === 'function') {
          await freshReg.showNotification(title, safeOptions);
          return { success: true };
        }
      } catch (retryErr: any) {
        console.warn('SW fresh registration failed:', retryErr);
        if (isMobile) {
          return { success: false, error: `SW Register Error: ${retryErr?.message || retryErr}` };
        }
      }
    }
  }

  if (isMobile) {
    return { success: false, error: 'Mobile browser requires an active Service Worker.' };
  }

  // Desktop fallback
  try {
    new Notification(title, safeOptions);
    return { success: true };
  } catch (directErr: any) {
    console.warn('Direct Notification constructor failed:', directErr);
    return { success: false, error: directErr?.message || 'Could not display notification.' };
  }
}

export async function triggerTestNotification(userName: string = 'Friend'): Promise<{ success: boolean; message: string }> {
  if (!('Notification' in window)) {
    return { success: false, message: 'Notifications are not supported in this browser. Install PWA or open in Chrome/Safari.' };
  }

  let perm = Notification.permission;
  if (perm !== 'granted') {
    perm = await Notification.requestPermission();
  }

  if (perm !== 'granted') {
    return {
      success: false,
      message: `Permission status: "${perm}". Please tap the lock 🔒 icon by the URL or check Phone Settings -> Notifications.`,
    };
  }

  const title = 'HydraLove 💧 Test Alert!';
  const body = `Hey ${userName}! 💕 Local notifications are working! (Second test in 5s...)`;

  try {
    const options: any = {
      body,
      vibrate: [200, 100, 200],
    };

    const result = await safeShowNotification(title, options);

    if (result.success) {
      // Schedule 5s delayed notification to test screen lock
      setTimeout(async () => {
        const delayedOptions: any = {
          body: `Drink water, ${userName}! 🌸 Screen lock test succeeded!`,
          vibrate: [300, 100, 300],
        };
        await safeShowNotification('HydraLove ⏰ Delayed Test (5s)', delayedOptions);
      }, 5000);

      return { success: true, message: 'Test alert sent! Lock screen test will fire in 5 seconds (lock phone to test).' };
    } else {
      return { success: false, message: `❌ ${result.error || 'Notification failed.'}` };
    }
  } catch (e: any) {
    return { success: false, message: `❌ ${e?.message || 'Failed to trigger notification.'}` };
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

export async function scheduleOfflineNotificationTriggers(getUserName: () => string) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const isTimestampTriggerSupported = 'showTrigger' in Notification.prototype || 'TimestampTrigger' in window;
    if (!isTimestampTriggerSupported) return;

    const reminderSettings = await getSetting<ReminderSettings>('reminder_settings');
    const enabled = reminderSettings ? reminderSettings.enabled : true;
    if (!enabled) return;

    const times = (reminderSettings?.times && reminderSettings.times.length > 0)
      ? reminderSettings.times
      : DEFAULT_REMINDER_TIMES;

    const reg = await navigator.serviceWorker.ready;
    const name = getUserName() || 'Friend';
    const TimestampTrigger = (window as any).TimestampTrigger;

    for (const timeStr of times) {
      const [h, m] = timeStr.split(':').map(Number);
      const targetDate = new Date();
      targetDate.setHours(h, m, 0, 0);

      if (targetDate.getTime() < Date.now()) {
        targetDate.setDate(targetDate.getDate() + 1); // schedule for tomorrow
      }

      await reg.showNotification('Hydration Time 💧', {
        body: `Hey ${name}! 💕 It's time for a little water break!`,
        icon: getAbsoluteAppUrl('apple-touch-icon.png'),
        badge: getAbsoluteAppUrl('apple-touch-icon.png'),
        vibrate: [200, 100, 200],
        showTrigger: new TimestampTrigger(targetDate.getTime()),
        tag: `hydration_slot_${targetDate.getTime()}`,
      } as any);
    }
  } catch (err) {
    console.warn('NotificationTriggers scheduling note:', err);
  }
}

export function initLocalHydrationReminders(getUserName: () => string) {
  if (typeof window === 'undefined') return;

  const checkAndTriggerReminder = async () => {
    const reminderSettings = await getSetting<ReminderSettings>('reminder_settings');
    const enabled = reminderSettings ? reminderSettings.enabled : true;
    if (!enabled) return;

    const times = (reminderSettings?.times && reminderSettings.times.length > 0)
      ? reminderSettings.times
      : DEFAULT_REMINDER_TIMES;

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
      isScheduledSlot = times.includes(currentHourSlot);
    }

    const lastNotifiedSlot = localStorage.getItem('hydralove_last_notified_slot');

    if (isScheduledSlot && lastNotifiedSlot !== slotKey) {
      const name = getUserName() || 'Friend';
      const title = 'Hydration Time 💧';
      const options: any = {
        body: `Hey ${name}! 💕 It's time for a little water break!`,
        vibrate: [200, 100, 200],
      };

      const result = await safeShowNotification(title, options);
      if (result.success) {
        localStorage.setItem('hydralove_last_notified_slot', slotKey);
      }
    }
  };

  // Schedule native OS offline alarms
  scheduleOfflineNotificationTriggers(getUserName);

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

import { getSetting, saveSetting, saveNotificationLog } from './indexedDB';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { PushSubscriptionData, NotificationLog } from '../types';

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

    const p256dh = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    const subData: PushSubscriptionData = {
      userId,
      endpoint: subscription.endpoint,
      p256dh: p256dh ? btoa(String.fromCharCode(...new Uint8Array(p256dh))) : '',
      auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : '',
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

export async function sendAdminPushNotification(targetUserId: string, message: string): Promise<boolean> {
  const logEntry: NotificationLog = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId: targetUserId,
    message,
    type: 'admin_custom',
    sentAt: new Date().toISOString(),
    status: 'sent',
  };

  await saveNotificationLog(logEntry);

  if ('Notification' in window && Notification.permission === 'granted') {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification('HydraLove 💧', {
        body: message,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [100, 50, 100],
      });
    } else {
      new Notification('HydraLove 💧', { body: message, icon: '/pwa-192x192.png' });
    }
  }

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

  setInterval(async () => {
    const reminderSettings = await getSetting('reminder_settings');
    if (!reminderSettings || !reminderSettings.enabled) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (reminderSettings.times?.includes(timeStr) && now.getSeconds() < 10) {
      if ('Notification' in window && Notification.permission === 'granted') {
        const name = getUserName() || 'Friend';
        const title = 'Hydration Time 💧';
        const options = {
          body: `Hey ${name}! 💕 It's time for a little water break!`,
          icon: '/pwa-192x192.png',
          vibrate: [200, 100, 200],
        };

        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(title, options);
        } else {
          new Notification(title, options);
        }
      }
    }
  }, 30000);
}

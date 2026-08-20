import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare let self: any;

// Force newly installed Service Worker to activate immediately
self.skipWaiting();
clientsClaim();

// Precache static assets built by Vite
precacheAndRoute(self.__WB_MANIFEST || []);

self.lastNotifiedSlot = self.lastNotifiedSlot || '';

function checkBackgroundReminders() {
  try {
    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];
    const hoursStr = String(now.getHours()).padStart(2, '0');
    const minutesStr = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hoursStr}:${minutesStr}`;

    // 2-Minute Interval: trigger on every even minute (12:06, 12:08, 12:10...)
    const isScheduled = now.getMinutes() % 2 === 0;
    const slotKey = `sw_${todayDateStr}_${currentTimeStr}`;

    if (isScheduled && self.lastNotifiedSlot !== slotKey) {
      self.lastNotifiedSlot = slotKey;

      const userName = self.userName || 'Friend';
      const title = 'Hydration Time 💧';
      const options: any = {
        body: `Hey ${userName}! 💕 It's time for a little water break!`,
        icon: '/apple-touch-icon.png',
        badge: '/apple-touch-icon.png',
        vibrate: [200, 100, 200],
        data: '/',
      };

      if (self.registration && typeof self.registration.showNotification === 'function') {
        self.registration.showNotification(title, options);
      }
    }
  } catch (err) {
    console.warn('SW Background reminder error:', err);
  }
}

// Background interval running in Service Worker thread
setInterval(checkBackgroundReminders, 5000);

// Listen to messages from window tab to sync user profile
self.addEventListener('message', (event: any) => {
  if (event.data) {
    if (event.data.type === 'SYNC_SW_CONFIG') {
      self.userName = event.data.userName;
    }
    if (event.data.type === 'TRIGGER_CHECK') {
      checkBackgroundReminders();
    }
  }
});

// Periodic Sync handler for PWA background wakeups
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'hydration-reminder') {
    event.waitUntil(checkBackgroundReminders());
  }
});

// Handle incoming Web Push notifications (works background & screen lock)
self.addEventListener('push', (event: any) => {
  let data: any = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'HydraLove 💧 Remind';
  const options: NotificationOptions = {
    body: data.body || 'Time for a water break! 💕',
    icon: '/apple-touch-icon.png',
    badge: '/apple-touch-icon.png',
    data: data.url || '/',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification tap / click to bring app to focus
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: any[]) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

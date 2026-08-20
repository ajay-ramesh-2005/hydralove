import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare let self: any;

// Force newly installed Service Worker to activate immediately
self.skipWaiting();
clientsClaim();

// Precache static assets built by Vite
precacheAndRoute(self.__WB_MANIFEST || []);

const DEFAULT_HOURLY_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00',
  '21:00', '22:00', '23:00', '00:00'
];

self.lastNotifiedSlot = self.lastNotifiedSlot || '';

function checkBackgroundReminders() {
  try {
    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];
    const hoursStr = String(now.getHours()).padStart(2, '0');
    const minutesStr = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hoursStr}:${minutesStr}`;

    const currentHourSlot = `${hoursStr}:00`;
    const isMinuteMode = self.isMinuteMode === true;

    let slotKey = '';
    let isScheduled = false;

    if (isMinuteMode) {
      slotKey = `sw_${todayDateStr}_${currentTimeStr}`;
      isScheduled = true;
    } else {
      slotKey = `sw_${todayDateStr}_${hoursStr}`;
      isScheduled = DEFAULT_HOURLY_SLOTS.includes(currentHourSlot);
    }

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
setInterval(checkBackgroundReminders, 10000);

// Listen to messages from window tab to sync user profile and mode
self.addEventListener('message', (event: any) => {
  if (event.data) {
    if (event.data.type === 'SYNC_SW_CONFIG') {
      self.userName = event.data.userName;
      self.isMinuteMode = event.data.isMinuteMode;
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

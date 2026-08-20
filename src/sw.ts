import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare let self: any;

// Force newly installed Service Worker to activate immediately
self.skipWaiting();
clientsClaim();

// Precache static assets built by Vite
precacheAndRoute(self.__WB_MANIFEST || []);

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

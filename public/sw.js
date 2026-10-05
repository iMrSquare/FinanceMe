// Service worker de FinanceMe: solo notificaciones push (sin caché offline).
// Se registra en cada arranque desde src/components/PushRegistrar.tsx.

// Toma el control sin esperar a que se cierren las pestañas: si no, una versión nueva
// se quedaría en "waiting" y los push seguirían gestionados por la anterior
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  // Hay que mostrar algo siempre: con userVisibleOnly, los push "silenciosos" hacen que
  // el navegador (Safari sobre todo) acabe revocando el permiso
  let data = { title: 'FinanceMe', body: 'Tienes un aviso nuevo', url: '/' };
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'FinanceMe', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/badge-96.png',
      // Una notificación nueva con el mismo tag sustituye a la anterior en vez de apilarse
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      lang: 'es',
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin);
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Reutiliza la ventana abierta (en iOS instalada es la única) en vez de abrir otra
    for (const client of windows) {
      if (new URL(client.url).origin === target.origin && 'focus' in client) {
        const focused = await client.focus();
        if (focused && 'navigate' in focused) await focused.navigate(target.href);
        return;
      }
    }
    await self.clients.openWindow(target.href);
  })());
});

// El navegador puede rotar la suscripción por su cuenta (caducidad de claves del push
// service). Se vuelve a suscribir con la misma clave VAPID y el servidor traspasa los
// avisos activados del endpoint viejo al nuevo.
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil((async () => {
    const applicationServerKey = event.oldSubscription?.options?.applicationServerKey
      || await fetch('/api/push/vapid').then(r => r.json()).then(d => d.publicKey).catch(() => null);
    if (!applicationServerKey) return;
    const subscription = event.newSubscription
      || await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    await fetch('/api/push/subscribe', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscription.toJSON(), replaces: event.oldSubscription?.endpoint ?? null }),
    });
  })());
});

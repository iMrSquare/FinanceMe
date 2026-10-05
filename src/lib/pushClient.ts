'use client';

// Lado navegador de las notificaciones push: registro del service worker y
// mantenimiento de la suscripción. Los componentes solo manejan estados legibles.

const SW_URL = '/sw.js';

export function isIOS() {
  const ua = navigator.userAgent;
  // iPadOS se presenta como Mac de escritorio, pero con pantalla táctil
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

// ¿Se creó la suscripción con la clave VAPID actual? Si el servidor cambió sus claves,
// la suscripción sigue en el navegador pero ya no recibe nada
function sameKey(sub: PushSubscription, key: Uint8Array) {
  const actual = sub.options?.applicationServerKey;
  if (!actual) return true;
  const x = new Uint8Array(actual);
  return x.length === key.length && x.every((v, i) => v === key[i]);
}

async function fetchPublicKey(): Promise<string | null> {
  const data = await fetch('/api/push/vapid').then(r => (r.ok ? r.json() : null)).catch(() => null);
  return typeof data?.publicKey === 'string' ? data.publicKey : null;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  try {
    // updateViaCache 'none': el navegador no reutiliza un sw.js cacheado durante días
    return await navigator.serviceWorker.register(SW_URL, { scope: '/', updateViaCache: 'none' });
  } catch (err) {
    console.error('[push] no se pudo registrar el service worker', err);
    return null;
  }
}

/** Suscripción válida para la clave actual: reutiliza la existente si coincide; si no, la sustituye */
export async function ensureSubscription(): Promise<PushSubscription> {
  const reg = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready);
  // register() resuelve antes de que el worker esté activo; sin esto, subscribe puede fallar tras instalar la PWA
  await navigator.serviceWorker.ready;
  const publicKey = await fetchPublicKey();
  if (!publicKey) throw new Error('El servidor no tiene claves de notificación');
  const key = urlBase64ToUint8Array(publicKey);
  const existing = await reg.pushManager.getSubscription();
  if (existing && sameKey(existing, key)) return existing;
  if (existing) await existing.unsubscribe().catch(() => false);
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
}

export async function getSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration(SW_URL);
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/**
 * En cada arranque con sesión: mantiene la suscripción de este navegador al día sin pedir nada.
 * - La reasigna a la cuenta actual (puede haber entrado otra persona en el mismo dispositivo).
 * - Si se creó con una clave VAPID que el servidor ya no usa, la renueva y conserva sus avisos.
 * - Actualiza en el servidor las claves si el navegador las rotó.
 * Nunca pide permiso ni crea suscripciones nuevas: eso solo se hace desde Avisos.
 */
export async function reconcilePush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await registerServiceWorker();
  if (!reg || Notification.permission !== 'granted') return;
  try {
    const existing = await reg.pushManager.getSubscription();
    if (!existing) return;
    const sub = await ensureSubscription();
    await fetch('/api/push/subscribe', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), replaces: sub.endpoint !== existing.endpoint ? existing.endpoint : undefined }),
    });
  } catch (err) {
    console.warn('[push] no se pudo reconciliar la suscripción', err);
  }
}

/** Al cerrar sesión: este dispositivo deja de recibir los avisos de la cuenta */
export async function disablePushOnLogout(): Promise<void> {
  const sub = await getSubscription().catch(() => null);
  if (!sub) return;
  // Primero el servidor: si se cancela antes en el navegador y falla la llamada, queda una fila zombi
  await fetch('/api/push/subscribe', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe().catch(() => false);
}

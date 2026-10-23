import webpush, { WebPushError } from 'web-push';
import { deletePushSubscription, getAppSetting, setAppSetting, type PushSubscriptionRow } from './db';

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

export type PushResult =
  | { ok: true }
  /** gone: el servicio push dice que la suscripción ya no existe (se borra de la BBDD) */
  | { ok: false; gone: boolean; status: number | null; detail: string };

/** Claves VAPID: del entorno si existen; si no, se generan una vez y se guardan en la BBDD */
export function getVapidKeys(): { publicKey: string; privateKey: string } {
  const envPub = process.env.VAPID_PUBLIC_KEY;
  const envPriv = process.env.VAPID_PRIVATE_KEY;
  if (envPub && envPriv) return { publicKey: envPub, privateKey: envPriv };

  let publicKey = getAppSetting('vapid_public_key');
  let privateKey = getAppSetting('vapid_private_key');
  if (!publicKey || !privateKey) {
    const keys = webpush.generateVAPIDKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
    setAppSetting('vapid_public_key', publicKey);
    setAppSetting('vapid_private_key', privateKey);
  }
  return { publicKey, privateKey };
}

// Un subject solo vale si es mailto: o https: y no apunta a localhost ni a dominios .local:
// el servicio push de Apple rechaza el envío entero (403 BadJwtToken) con cualquier otro
function validSubject(value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  const candidate = /^[^:@\s]+@[^@\s]+$/.test(v) ? `mailto:${v}` : v; // email suelto → mailto:
  try {
    const url = new URL(candidate);
    const host = url.protocol === 'mailto:' ? url.pathname.split('@')[1] ?? '' : url.hostname;
    if (!['mailto:', 'https:'].includes(url.protocol) || !host.includes('.')) return null;
    if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.localhost')) return null;
    return url.protocol === 'https:' ? url.origin : candidate;
  } catch {
    return null;
  }
}

/**
 * Guarda la URL pública (https) desde la que se usa la app: sirve de subject VAPID si no hay VAPID_SUBJECT.
 * Solo la primera vez: las cabeceras x-forwarded-* las puede fijar el cliente y no deben poder cambiarla después
 */
export function rememberAppUrl(headers: Headers) {
  if (getAppSetting('app_url')) return;
  const host = headers.get('x-forwarded-host') ?? headers.get('host');
  const proto = headers.get('x-forwarded-proto')?.split(',')[0].trim() ?? 'http';
  const url = host ? validSubject(`${proto}://${host}`) : null;
  if (url) setAppSetting('app_url', url);
}

function vapidDetails() {
  const subject = validSubject(process.env.VAPID_SUBJECT) ?? validSubject(getAppSetting('app_url'));
  if (!subject) return null;
  const { publicKey, privateKey } = getVapidKeys();
  return { subject, publicKey, privateKey };
}

/** Envía una notificación; borra la suscripción si el servicio push indica que ya no existe */
export async function sendPush(sub: Pick<PushSubscriptionRow, 'endpoint' | 'p256dh' | 'auth'>, payload: PushPayload): Promise<PushResult> {
  const details = vapidDetails();
  if (!details) {
    const detail = 'Falta un contacto válido para el servicio push: define VAPID_SUBJECT (mailto:tu@correo o https://tu-dominio) o abre FinanceMe por HTTPS y vuelve a activar las notificaciones';
    console.error('[push]', detail);
    return { ok: false, gone: false, status: null, detail };
  }
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 12, urgency: 'normal', vapidDetails: details },
    );
    return { ok: true };
  } catch (err) {
    const status = err instanceof WebPushError ? err.statusCode : null;
    const detail = err instanceof WebPushError ? (err.body || err.message).trim().slice(0, 200) : String(err);
    const gone = status === 404 || status === 410;
    if (gone) deletePushSubscription(sub.endpoint);
    else console.error('[push] error enviando notificación', new URL(sub.endpoint).host, status ?? '', detail);
    return { ok: false, gone, status, detail };
  }
}

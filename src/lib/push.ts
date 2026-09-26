import webpush from 'web-push';
import { deletePushSubscription, getAppSetting, setAppSetting, type PushSubscriptionRow } from './db';

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

let configured = false;

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

function ensureConfigured() {
  if (configured) return;
  const { publicKey, privateKey } = getVapidKeys();
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@financeme.local', publicKey, privateKey);
  configured = true;
}

/** Envía una notificación; borra la suscripción si el servicio push indica que ya no existe */
export async function sendPush(sub: Pick<PushSubscriptionRow, 'endpoint' | 'p256dh' | 'auth'>, payload: PushPayload): Promise<boolean> {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 12, urgency: 'normal' },
    );
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) deletePushSubscription(sub.endpoint);
    else console.error('[push] error enviando notificación', status ?? err);
    return false;
  }
}

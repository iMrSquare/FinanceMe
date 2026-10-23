import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getPushSubscription } from '@/lib/db';
import { rememberAppUrl, sendPush } from '@/lib/push';

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  rememberAppUrl(req.headers);
  const body = await req.json().catch(() => null);
  const scope = body?.scope === 'hogar' ? 'hogar' : 'personal';
  const sub = typeof body?.endpoint === 'string' ? getPushSubscription(body.endpoint, auth.id) : null;
  if (!sub) return NextResponse.json({ error: 'Este dispositivo no tiene las notificaciones activadas. Vuelve a activarlas.', gone: true }, { status: 404 });
  const res = await sendPush(sub, {
    title: 'FinanceMe · Prueba',
    body: 'Las notificaciones de este dispositivo funcionan correctamente.',
    url: `/${scope}/avisos`,
    tag: 'financeme-test',
  });
  if (res.ok) return NextResponse.json({ ok: true });
  if (res.gone) {
    return NextResponse.json({ error: 'La suscripción de este dispositivo ha caducado. Vuelve a activar las notificaciones.', gone: true }, { status: 410 });
  }
  // El motivo real del servicio push (p. ej. 403 BadJwtToken) es lo único que permite saber qué falla
  const error = res.status ? `El servicio de notificaciones rechazó el envío (${res.status}${res.detail ? ` · ${res.detail}` : ''})` : res.detail;
  return NextResponse.json({ error }, { status: 502 });
}

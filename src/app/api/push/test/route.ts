import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getPushSubscription } from '@/lib/db';
import { sendPush } from '@/lib/push';

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  const scope = body?.scope === 'hogar' ? 'hogar' : 'personal';
  const sub = typeof body?.endpoint === 'string' ? getPushSubscription(body.endpoint, auth.id) : null;
  if (!sub) return NextResponse.json({ error: 'Este dispositivo no tiene las notificaciones activadas' }, { status: 404 });
  const ok = await sendPush(sub, {
    title: 'FinanceMe · Prueba',
    body: 'Las notificaciones de este dispositivo funcionan correctamente.',
    url: `/${scope}/avisos`,
    tag: 'financeme-test',
  });
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'No se pudo enviar la notificación' }, { status: 502 });
}

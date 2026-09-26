import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { deletePushSubscription, getPushSubscription, isHogarActivated, savePushSubscription, type PushScope } from '@/lib/db';

function parseScope(v: unknown): PushScope | null {
  return v === 'hogar' || v === 'personal' ? v : null;
}

function estado(row: { notify_hogar: number; notify_personal: number } | null) {
  return { hogar: row?.notify_hogar === 1, personal: row?.notify_personal === 1 };
}

// Estado de este dispositivo: ?endpoint=...
export async function GET(req: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const endpoint = req.nextUrl.searchParams.get('endpoint');
  if (!endpoint) return NextResponse.json(estado(null));
  return NextResponse.json(estado(getPushSubscription(endpoint, auth.id)));
}

// Activa o desactiva un ámbito para la suscripción del dispositivo
export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  const scope = parseScope(body?.scope);
  const sub = body?.subscription;
  const endpoint = typeof sub?.endpoint === 'string' ? sub.endpoint : null;
  const p256dh = typeof sub?.keys?.p256dh === 'string' ? sub.keys.p256dh : null;
  const authKey = typeof sub?.keys?.auth === 'string' ? sub.keys.auth : null;
  if (!scope || !endpoint || !p256dh || !authKey || !endpoint.startsWith('https://')) {
    return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
  }
  if (scope === 'hogar' && auth.role !== 'admin' && !isHogarActivated()) {
    return NextResponse.json({ error: 'Sin acceso a Hogar' }, { status: 403 });
  }
  const row = savePushSubscription(auth.id, { endpoint, p256dh, auth: authKey, userAgent: req.headers.get('user-agent') }, scope, body?.enabled !== false);
  const next = estado(row);
  if (!next.hogar && !next.personal) deletePushSubscription(endpoint);
  return NextResponse.json(next);
}

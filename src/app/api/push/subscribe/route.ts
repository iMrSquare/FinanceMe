import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import {
  deletePushSubscription, deletePushSubscriptionForUser, getPushSubscription, isHogarActivated, savePushSubscription, syncPushSubscription, type PushScope,
} from '@/lib/db';

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

function parseSubscription(raw: unknown) {
  const sub = raw as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  const endpoint = typeof sub?.endpoint === 'string' ? sub.endpoint : null;
  const p256dh = typeof sub?.keys?.p256dh === 'string' ? sub.keys.p256dh : null;
  const auth = typeof sub?.keys?.auth === 'string' ? sub.keys.auth : null;
  if (!endpoint || !p256dh || !auth || !endpoint.startsWith('https://')) return null;
  return { endpoint, p256dh, auth };
}

// Activa o desactiva un ámbito para la suscripción del dispositivo
export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  const scope = parseScope(body?.scope);
  const sub = parseSubscription(body?.subscription);
  if (!scope || !sub) return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
  if (scope === 'hogar' && auth.role !== 'admin' && !isHogarActivated()) {
    return NextResponse.json({ error: 'Sin acceso a Hogar' }, { status: 403 });
  }
  const { endpoint } = sub;
  const row = savePushSubscription(auth.id, { ...sub, userAgent: req.headers.get('user-agent') }, scope, body?.enabled !== false);
  const next = estado(row);
  if (!next.hogar && !next.personal) deletePushSubscription(endpoint);
  return NextResponse.json(next);
}

// Reconciliación (arranque de la app o rotación desde el service worker): mantiene la
// suscripción al día sin cambiar qué avisos tiene activados
export async function PUT(req: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  const sub = parseSubscription(body?.subscription);
  if (!sub) return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
  const replaces = typeof body?.replaces === 'string' ? body.replaces : null;
  return NextResponse.json(estado(syncPushSubscription(auth.id, { ...sub, userAgent: req.headers.get('user-agent') }, replaces)));
}

// Baja del dispositivo (al cerrar sesión)
export async function DELETE(req: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  if (typeof body?.endpoint !== 'string') return NextResponse.json({ error: 'endpoint requerido' }, { status: 400 });
  deletePushSubscriptionForUser(body.endpoint, auth.id);
  return NextResponse.json({ ok: true });
}

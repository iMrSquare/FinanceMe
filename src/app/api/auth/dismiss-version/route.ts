import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { markVersionSeen } from '@/lib/db';
import { APP_VERSION } from '@/lib/constants';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  markVersionSeen(session.id, APP_VERSION);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { activateHogar } from '@/lib/db';

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  activateHogar();
  return NextResponse.json({ ok: true });
}

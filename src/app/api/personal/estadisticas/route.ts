import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPersonalEstadisticas } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  return NextResponse.json(getPersonalEstadisticas(session.id, 6));
}

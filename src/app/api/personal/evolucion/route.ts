import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPersonalEvolucion } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  return NextResponse.json(getPersonalEvolucion(session.id, 6));
}

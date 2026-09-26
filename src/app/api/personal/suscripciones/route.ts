import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPersonalSuscripciones, createPersonalSuscripcion } from '@/lib/db';
import { parseRecurrenteBody } from '@/lib/recurrentes';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  return NextResponse.json(getPersonalSuscripciones(session.id));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const data = parseRecurrenteBody(await request.json());
  if (!data) return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
  createPersonalSuscripcion(session.id, data);
  return NextResponse.json({ ok: true });
}

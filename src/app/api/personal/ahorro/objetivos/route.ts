import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPersonalAhorroObjetivos, createPersonalAhorroObjetivo } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  return NextResponse.json(getPersonalAhorroObjetivos(session.id));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { nombre, objetivo, fecha_objetivo } = await request.json();
  if (!nombre?.trim() || objetivo == null || !fecha_objetivo) {
    return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
  }
  createPersonalAhorroObjetivo(session.id, { nombre: nombre.trim(), objetivo: Number(objetivo), fecha_objetivo });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { getSession, canEdit } from '@/lib/auth';
import { getAhorroObjetivos, createAhorroObjetivo } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getAhorroObjetivos());
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  const { nombre, objetivo, fecha_objetivo } = await request.json();
  if (!nombre?.trim() || objetivo == null || !fecha_objetivo) {
    return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
  }
  createAhorroObjetivo({ nombre: nombre.trim(), objetivo: Number(objetivo), fecha_objetivo });
  return NextResponse.json({ ok: true });
}

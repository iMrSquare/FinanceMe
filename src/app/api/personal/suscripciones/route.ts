import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPersonalSuscripciones, createPersonalSuscripcion } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  return NextResponse.json(getPersonalSuscripciones(session.id));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { nombre, importe, cobro, periodicidad, comentario } = await request.json();
  if (!nombre?.trim() || importe == null) return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
  createPersonalSuscripcion(session.id, { nombre: nombre.trim(), importe: Number(importe), cobro: cobro || null, periodicidad: periodicidad || 'mensual', comentario: comentario || null });
  return NextResponse.json({ ok: true });
}

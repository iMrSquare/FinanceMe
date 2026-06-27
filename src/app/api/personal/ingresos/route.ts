import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPersonalIngresosFijos, createPersonalIngresoFijo } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  return NextResponse.json(getPersonalIngresosFijos(session.id));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { concepto, importe, comentario } = await request.json();
  if (!concepto?.trim() || importe == null) return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
  createPersonalIngresoFijo(session.id, { concepto: concepto.trim(), importe: Number(importe), comentario: comentario || null });
  return NextResponse.json({ ok: true });
}

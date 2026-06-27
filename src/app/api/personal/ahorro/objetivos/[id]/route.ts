import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updatePersonalAhorroObjetivoDatos, deletePersonalAhorroObjetivo } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { id } = await params;
  const { nombre, objetivo, fecha_objetivo } = await request.json();
  updatePersonalAhorroObjetivoDatos(Number(id), session.id, { nombre: nombre.trim(), objetivo: Number(objetivo), fecha_objetivo });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { id } = await params;
  deletePersonalAhorroObjetivo(Number(id), session.id);
  return NextResponse.json({ ok: true });
}

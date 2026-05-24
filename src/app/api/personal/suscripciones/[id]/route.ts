import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updatePersonalSuscripcion, deletePersonalSuscripcion } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { id } = await params;
  const { nombre, importe, cobro, periodicidad, comentario } = await request.json();
  updatePersonalSuscripcion(Number(id), session.id, { nombre: nombre.trim(), importe: Number(importe), cobro: cobro || null, periodicidad: periodicidad || 'mensual', comentario: comentario || null });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { id } = await params;
  deletePersonalSuscripcion(Number(id), session.id);
  return NextResponse.json({ ok: true });
}

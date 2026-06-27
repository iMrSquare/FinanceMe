import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updatePersonalIngresoFijo, deletePersonalIngresoFijo } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { id } = await params;
  const { concepto, importe, comentario } = await request.json();
  updatePersonalIngresoFijo(Number(id), session.id, { concepto: concepto.trim(), importe: Number(importe), comentario: comentario || null });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { id } = await params;
  deletePersonalIngresoFijo(Number(id), session.id);
  return NextResponse.json({ ok: true });
}

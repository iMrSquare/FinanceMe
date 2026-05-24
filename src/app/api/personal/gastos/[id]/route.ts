import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updatePersonalGasto, deletePersonalGasto } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { id } = await params;
  const { gasto, importe, categoria, banco, cobro, vencimiento, comentario } = await request.json();
  updatePersonalGasto(Number(id), session.id, { gasto: gasto.trim(), importe: Number(importe), categoria: categoria || null, banco: banco || null, cobro: cobro || null, vencimiento: vencimiento || null, comentario: comentario || null });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { id } = await params;
  deletePersonalGasto(Number(id), session.id);
  return NextResponse.json({ ok: true });
}

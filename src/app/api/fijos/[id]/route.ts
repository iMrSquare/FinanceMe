import { NextResponse } from 'next/server';
import { updateFijo, deleteFijo } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { gasto, categoria, banco, importe, comentario, cobro, vencimiento } = await req.json();
  updateFijo(Number(id), gasto, categoria ?? null, banco ?? null, Number(importe) || 0, comentario ?? null, cobro ?? null, vencimiento ?? null);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteFijo(Number(id));
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { updateFijo, deleteFijo } from '@/lib/db';
import { requireEditor } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const { gasto, categoria, banco, importe, comentario, cobro, vencimiento } = await req.json();
  updateFijo(Number(id), gasto, categoria ?? null, banco ?? null, Number(importe) || 0, comentario ?? null, cobro ?? null, vencimiento ?? null);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  deleteFijo(Number(id));
  return NextResponse.json({ ok: true });
}

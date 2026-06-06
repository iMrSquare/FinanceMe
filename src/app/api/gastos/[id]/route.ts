import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { gasto, fecha, categoria, banco, importe, comentario } = body;
  const db = getDb();
  db.prepare(
    'UPDATE gastos SET gasto=?, fecha=?, categoria=?, banco=?, importe=?, comentario=? WHERE id=?'
  ).run(gasto, fecha ?? null, categoria ?? null, banco ?? null, importe ?? 0, comentario ?? null, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM gastos WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}

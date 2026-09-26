import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireEditor } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await req.json();
  const { gasto, fecha, categoria, importe, comentario } = body;
  const db = getDb();
  db.prepare(
    'UPDATE prestamos SET gasto=?, fecha=?, categoria=?, importe=?, comentario=? WHERE id=?'
  ).run(gasto, fecha ?? null, categoria ?? null, importe ?? 0, comentario ?? null, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM prestamos WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}

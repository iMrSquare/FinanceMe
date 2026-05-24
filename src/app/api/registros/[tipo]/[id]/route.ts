import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await params;
  const table = tipo === 'luz' ? 'registro_luz' : 'registro_agua';
  const { importe, comentario } = await req.json();
  const db = getDb();
  db.prepare(`UPDATE ${table} SET importe=?, comentario=? WHERE id=?`).run(importe ?? 0, comentario ?? null, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await params;
  const table = tipo === 'luz' ? 'registro_luz' : 'registro_agua';
  const db = getDb();
  db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id);
  return NextResponse.json({ ok: true });
}

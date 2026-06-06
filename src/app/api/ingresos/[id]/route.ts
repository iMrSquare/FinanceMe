import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { inquilino, aportacion, comentario } = await req.json();
  const db = getDb();
  db.prepare('UPDATE ingresos SET inquilino=?, aportacion=?, comentario=? WHERE id=?').run(inquilino, aportacion ?? 0, comentario ?? null, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM ingresos WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}

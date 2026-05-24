import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { nombre, importe, m3, fecha_lectura_inicio, fecha_lectura_fin, fecha_cobro, compania } = await req.json();
  const db = getDb();
  db.prepare(
    'UPDATE registro_agua SET nombre=?, importe=?, m3=?, fecha_lectura_inicio=?, fecha_lectura_fin=?, fecha_cobro=?, compania=? WHERE id=?'
  ).run(nombre, importe ?? 0, m3 ?? null, fecha_lectura_inicio ?? null, fecha_lectura_fin ?? null, fecha_cobro ?? null, compania ?? null, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM registro_agua WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}

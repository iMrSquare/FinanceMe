import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { nombre, importe, kwh, fecha_lectura_inicio, fecha_lectura_fin, fecha_cobro, precio_kwh, compania } = await req.json();
  const db = getDb();
  db.prepare(
    'UPDATE registro_luz SET nombre=?, importe=?, kwh=?, fecha_lectura_inicio=?, fecha_lectura_fin=?, fecha_cobro=?, precio_kwh=?, compania=? WHERE id=?'
  ).run(nombre, importe ?? 0, kwh ?? null, fecha_lectura_inicio ?? null, fecha_lectura_fin ?? null, fecha_cobro ?? null, precio_kwh ?? null, compania ?? null, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM registro_luz WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}

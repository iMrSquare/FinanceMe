import { NextResponse } from 'next/server';
import { getDb, getRegistroAgua } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getRegistroAgua());
}

export async function POST(req: Request) {
  const { anio, nombre, importe, m3, fecha_lectura_inicio, fecha_lectura_fin, fecha_cobro, compania } = await req.json();
  if (!anio || !nombre) return NextResponse.json({ error: 'anio y nombre requeridos' }, { status: 400 });
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO registro_agua (anio, nombre, importe, m3, fecha_lectura_inicio, fecha_lectura_fin, fecha_cobro, compania) VALUES (?,?,?,?,?,?,?,?)'
  ).run(anio, nombre, importe ?? 0, m3 ?? null, fecha_lectura_inicio ?? null, fecha_lectura_fin ?? null, fecha_cobro ?? null, compania ?? null);
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}

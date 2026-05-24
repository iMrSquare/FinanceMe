import { NextResponse } from 'next/server';
import { getDb, getRegistroLuz } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getRegistroLuz());
}

export async function POST(req: Request) {
  const { anio, nombre, importe, kwh, fecha_lectura_inicio, fecha_lectura_fin, fecha_cobro, precio_kwh, compania } = await req.json();
  if (!anio || !nombre) return NextResponse.json({ error: 'anio y nombre requeridos' }, { status: 400 });
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO registro_luz (anio, nombre, importe, kwh, fecha_lectura_inicio, fecha_lectura_fin, fecha_cobro, precio_kwh, compania) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(anio, nombre, importe ?? 0, kwh ?? null, fecha_lectura_inicio ?? null, fecha_lectura_fin ?? null, fecha_cobro ?? null, precio_kwh ?? null, compania ?? null);
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}

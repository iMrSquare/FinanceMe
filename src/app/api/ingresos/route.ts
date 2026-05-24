import { NextResponse } from 'next/server';
import { getDb, getIngresos, getOrCreateMes } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get('mes');
  const anio = searchParams.get('anio');
  if (!mes || !anio) return NextResponse.json({ error: 'mes y anio requeridos' }, { status: 400 });
  const mesObj = getOrCreateMes(Number(mes), Number(anio));
  return NextResponse.json(getIngresos(mesObj.id));
}

export async function POST(req: Request) {
  const { mes_id, inquilino, aportacion } = await req.json();
  if (!mes_id || !inquilino) return NextResponse.json({ error: 'mes_id e inquilino requeridos' }, { status: 400 });
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO ingresos (mes_id, inquilino, aportacion) VALUES (?, ?, ?)'
  ).run(mes_id, inquilino, aportacion ?? 0);
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}

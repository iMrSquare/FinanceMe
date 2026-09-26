import { NextResponse } from 'next/server';
import { getDb, getPrestamos, getOrCreateMes, getMes } from '@/lib/db';
import { requireEditor, requireSession } from '@/lib/auth';

export async function GET(req: Request) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get('mes');
  const anio = searchParams.get('anio');
  if (!mes || !anio) return NextResponse.json({ error: 'mes y anio requeridos' }, { status: 400 });
  const mesObj = getMes(Number(mes), Number(anio));
  return NextResponse.json(mesObj ? getPrestamos(mesObj.id) : []);
}

export async function POST(req: Request) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const { mes_id, gasto, fecha, categoria, importe, comentario } = body;
  if (!mes_id || !gasto) return NextResponse.json({ error: 'mes_id y gasto requeridos' }, { status: 400 });
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO prestamos (mes_id, gasto, fecha, categoria, importe, comentario) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(mes_id, gasto, fecha ?? null, categoria ?? null, importe ?? 0, comentario ?? null);
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}

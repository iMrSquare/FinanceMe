import { NextResponse } from 'next/server';
import { getDb, getIngresos, getMes, isMesBloqueado } from '@/lib/db';
import { requireEditor, requireSession } from '@/lib/auth';

export async function GET(req: Request) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get('mes');
  const anio = searchParams.get('anio');
  if (!mes || !anio) return NextResponse.json({ error: 'mes y anio requeridos' }, { status: 400 });
  const mesObj = getMes(Number(mes), Number(anio));
  return NextResponse.json(mesObj ? getIngresos(mesObj.id) : []);
}

export async function POST(req: Request) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;
  const { mes_id, inquilino, aportacion, comentario } = await req.json();
  if (!mes_id || !inquilino) return NextResponse.json({ error: 'mes_id e inquilino requeridos' }, { status: 400 });
  if (isMesBloqueado(mes_id)) return NextResponse.json({ error: 'Este mes está bloqueado' }, { status: 403 });
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO ingresos (mes_id, inquilino, aportacion, comentario) VALUES (?, ?, ?, ?)'
  ).run(mes_id, inquilino, aportacion ?? 0, comentario ?? null);
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}

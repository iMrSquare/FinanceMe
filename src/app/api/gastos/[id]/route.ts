import { NextResponse } from 'next/server';
import { getDb, getMesIdDeGasto, isMesBloqueado } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mesId = getMesIdDeGasto(Number(id));
  if (mesId != null && isMesBloqueado(mesId)) {
    return NextResponse.json({ error: 'Este mes está bloqueado' }, { status: 403 });
  }
  const body = await req.json();
  const { gasto, fecha, categoria, banco, importe, comentario } = body;
  const db = getDb();
  db.prepare(
    'UPDATE gastos SET gasto=?, fecha=?, categoria=?, banco=?, importe=?, comentario=? WHERE id=?'
  ).run(gasto, fecha ?? null, categoria ?? null, banco ?? null, importe ?? 0, comentario ?? null, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mesId = getMesIdDeGasto(Number(id));
  if (mesId != null && isMesBloqueado(mesId)) {
    return NextResponse.json({ error: 'Este mes está bloqueado' }, { status: 403 });
  }
  const db = getDb();
  db.prepare('DELETE FROM gastos WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}

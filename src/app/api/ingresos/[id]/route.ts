import { NextResponse } from 'next/server';
import { getDb, getMesIdDeIngreso, isMesBloqueado } from '@/lib/db';
import { requireEditor } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const mesId = getMesIdDeIngreso(Number(id));
  if (mesId != null && isMesBloqueado(mesId)) {
    return NextResponse.json({ error: 'Este mes está bloqueado' }, { status: 403 });
  }
  const { inquilino, aportacion, comentario } = await req.json();
  const db = getDb();
  db.prepare('UPDATE ingresos SET inquilino=?, aportacion=?, comentario=? WHERE id=?').run(inquilino, aportacion ?? 0, comentario ?? null, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const mesId = getMesIdDeIngreso(Number(id));
  if (mesId != null && isMesBloqueado(mesId)) {
    return NextResponse.json({ error: 'Este mes está bloqueado' }, { status: 403 });
  }
  const db = getDb();
  db.prepare('DELETE FROM ingresos WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}

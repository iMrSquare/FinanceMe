import { NextResponse } from 'next/server';
import { getDb, getCategorias } from '@/lib/db';
import { getSession, canEdit } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get('tipo') as 'gasto' | 'prestamo' | 'luz' | 'agua' | null;
  if (!tipo) return NextResponse.json({ error: 'tipo requerido' }, { status: 400 });
  return NextResponse.json(getCategorias(tipo));
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  const { tipo, nombre, color } = await req.json();
  if (!tipo || !nombre) return NextResponse.json({ error: 'tipo y nombre requeridos' }, { status: 400 });
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO categorias (tipo, nombre, color) VALUES (?, ?, ?)'
  ).run(tipo, nombre, color ?? '#e5e7eb');
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}

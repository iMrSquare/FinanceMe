import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPersonalCategorias, createPersonalCategoria } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  return NextResponse.json(getPersonalCategorias(session.id));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { nombre, color } = await request.json();
  if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
  try {
    createPersonalCategoria(session.id, nombre.trim(), color || '#6366f1');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 409 });
  }
}

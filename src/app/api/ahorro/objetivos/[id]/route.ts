import { NextResponse } from 'next/server';
import { getSession, canEdit } from '@/lib/auth';
import { updateAhorroObjetivoDatos, deleteAhorroObjetivo } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  const { id } = await params;
  const { nombre, objetivo, fecha_objetivo } = await request.json();
  updateAhorroObjetivoDatos(Number(id), { nombre: nombre.trim(), objetivo: Number(objetivo), fecha_objetivo });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  const { id } = await params;
  deleteAhorroObjetivo(Number(id));
  return NextResponse.json({ ok: true });
}

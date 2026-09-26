import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updatePersonalSuscripcion, deletePersonalSuscripcion } from '@/lib/db';
import { parseRecurrenteBody } from '@/lib/recurrentes';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { id } = await params;
  const data = parseRecurrenteBody(await request.json());
  if (!data) return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
  updatePersonalSuscripcion(Number(id), session.id, data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { id } = await params;
  deletePersonalSuscripcion(Number(id), session.id);
  return NextResponse.json({ ok: true });
}

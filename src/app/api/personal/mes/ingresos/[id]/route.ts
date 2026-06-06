import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updatePersonalIngresoMes, deletePersonalIngresoMes } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const { concepto, importe, fecha, comentario } = await request.json();

  updatePersonalIngresoMes(Number(id), session.id, {
    concepto: concepto.trim(),
    importe: Number(importe),
    fecha: fecha || null,
    comentario: comentario || null,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  deletePersonalIngresoMes(Number(id), session.id);

  return NextResponse.json({ ok: true });
}

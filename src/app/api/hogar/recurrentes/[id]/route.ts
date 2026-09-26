import { NextRequest, NextResponse } from 'next/server';
import { requireEditor } from '@/lib/auth';
import { updateHogarRecurrente, deleteHogarRecurrente } from '@/lib/db';
import { parseRecurrenteBody } from '@/lib/recurrentes';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const data = parseRecurrenteBody(await request.json());
  if (!data) return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
  updateHogarRecurrente(Number(id), data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  deleteHogarRecurrente(Number(id));
  return NextResponse.json({ ok: true });
}

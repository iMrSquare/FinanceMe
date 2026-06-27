import { NextResponse } from 'next/server';
import { getSession, canEdit } from '@/lib/auth';
import { updateAhorroObjetivoAportado } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  const { id } = await params;
  const { aportado } = await request.json();
  updateAhorroObjetivoAportado(Number(id), Number(aportado));
  return NextResponse.json({ ok: true });
}

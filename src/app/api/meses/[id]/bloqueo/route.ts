import { NextResponse } from 'next/server';
import { getSession, canEdit } from '@/lib/auth';
import { setMesBloqueado } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  const { id } = await params;
  const { bloqueado } = await req.json();
  setMesBloqueado(Number(id), !!bloqueado);
  return NextResponse.json({ ok: true });
}

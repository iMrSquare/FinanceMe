import { NextRequest, NextResponse } from 'next/server';
import { getSession, canEdit } from '@/lib/auth';
import { updateAhorroMes } from '@/lib/db';

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  const { year, mes, aportado } = await request.json();
  updateAhorroMes(Number(year), Number(mes), Number(aportado));
  return NextResponse.json({ ok: true });
}

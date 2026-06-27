import { NextResponse } from 'next/server';
import { getSession, canEdit } from '@/lib/auth';
import { getPresupuestoAutoConfigsHogar, upsertPresupuestoAutoHogar } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getPresupuestoAutoConfigsHogar());
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  const { tipo, banco, categoria } = await request.json();
  if (tipo !== 'objetivos') {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  }
  upsertPresupuestoAutoHogar(tipo, banco || null, categoria || null);
  return NextResponse.json({ ok: true });
}

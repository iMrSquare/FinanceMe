import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPresupuestoAutoConfigs, upsertPresupuestoAuto } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  return NextResponse.json(getPresupuestoAutoConfigs(session.id));
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { tipo, banco, categoria, redondeo } = await request.json();
  if (!['suscripciones', 'ahorro', 'objetivos'].includes(tipo)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  }

  upsertPresupuestoAuto(session.id, tipo, banco || null, categoria || null, typeof redondeo === 'boolean' ? redondeo : undefined);
  return NextResponse.json({ ok: true });
}

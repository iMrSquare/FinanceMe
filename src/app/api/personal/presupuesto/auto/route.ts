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

  const { tipo, banco, categoria, redondeo, desglose } = await request.json();
  if (!['suscripciones', 'ahorro', 'objetivos'].includes(tipo)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  }

  // Solo el modo (desde Recurrentes): se conservan la categoría y el banco ya configurados
  const actual = banco === undefined && categoria === undefined ? getPresupuestoAutoConfigs(session.id).find(c => c.tipo === tipo) : undefined;
  upsertPresupuestoAuto(session.id, tipo, actual ? actual.banco : banco || null, actual ? actual.categoria : categoria || null, {
    redondeo: typeof redondeo === 'boolean' ? redondeo : undefined,
    desglose: typeof desglose === 'boolean' ? desglose : undefined,
  });
  return NextResponse.json({ ok: true });
}

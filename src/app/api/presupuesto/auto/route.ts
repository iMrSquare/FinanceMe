import { NextResponse } from 'next/server';
import { requireEditor, requireSession } from '@/lib/auth';
import { getPresupuestoAutoConfigsHogar, upsertPresupuestoAutoHogar } from '@/lib/db';

export async function GET() {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(getPresupuestoAutoConfigsHogar());
}

export async function PUT(request: Request) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;
  const { tipo, banco, categoria, redondeo, desglose } = await request.json();
  if (!['objetivos', 'ahorro', 'recurrentes'].includes(tipo)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  }
  upsertPresupuestoAutoHogar(tipo, banco || null, categoria || null, {
    redondeo: typeof redondeo === 'boolean' ? redondeo : undefined,
    desglose: typeof desglose === 'boolean' ? desglose : undefined,
  });
  return NextResponse.json({ ok: true });
}

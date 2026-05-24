import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPersonalGastos, createPersonalGasto } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  return NextResponse.json(getPersonalGastos(session.id));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { gasto, importe, categoria, banco, cobro, vencimiento, comentario } = await request.json();
  if (!gasto?.trim() || importe == null) return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
  createPersonalGasto(session.id, { gasto: gasto.trim(), importe: Number(importe), categoria: categoria || null, banco: banco || null, cobro: cobro || null, vencimiento: vencimiento || null, comentario: comentario || null });
  return NextResponse.json({ ok: true });
}

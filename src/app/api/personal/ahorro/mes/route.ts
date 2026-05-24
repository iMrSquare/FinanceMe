import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updatePersonalAhorroMes } from '@/lib/db';

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { year, mes, aportado } = await request.json();
  updatePersonalAhorroMes(session.id, Number(year), Number(mes), Number(aportado));
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updatePersonalAhorroObjetivoAportado } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { id } = await params;
  const { aportado } = await request.json();
  updatePersonalAhorroObjetivoAportado(Number(id), session.id, Number(aportado));
  return NextResponse.json({ ok: true });
}

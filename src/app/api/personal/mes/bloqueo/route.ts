import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { setPersonalMesBloqueado } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { anio, mes, bloqueado } = await request.json();
  if (!anio || !mes) return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 });

  setPersonalMesBloqueado(session.id, Number(mes), Number(anio), !!bloqueado);
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPersonalAhorro, updatePersonalAhorroObjetivo } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const year = Number(request.nextUrl.searchParams.get('year') ?? new Date().getFullYear());
  return NextResponse.json(getPersonalAhorro(session.id, year));
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { year, objetivoAnual } = await request.json();
  return NextResponse.json(updatePersonalAhorroObjetivo(session.id, Number(year), Number(objetivoAnual)));
}

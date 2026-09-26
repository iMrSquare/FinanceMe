import { NextRequest, NextResponse } from 'next/server';
import { getSession, canEdit, requireSession } from '@/lib/auth';
import { getAhorro, updateAhorroObjetivo } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const year = Number(request.nextUrl.searchParams.get('year') ?? new Date().getFullYear());
  return NextResponse.json(getAhorro(year));
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  const { year, objetivoAnual } = await request.json();
  return NextResponse.json(updateAhorroObjetivo(Number(year), Number(objetivoAnual)));
}

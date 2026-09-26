import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getPersonalEstadisticas } from '@/lib/db';
import { parseEstadisticasParams } from '@/lib/estadisticasParams';

export async function GET(req: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(getPersonalEstadisticas(auth.id, parseEstadisticasParams(req.nextUrl.searchParams, 6)));
}

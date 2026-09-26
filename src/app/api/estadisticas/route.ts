import { NextRequest, NextResponse } from 'next/server';
import { getEstadisticasGastos } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { parseEstadisticasParams } from '@/lib/estadisticasParams';

export async function GET(req: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(getEstadisticasGastos(parseEstadisticasParams(req.nextUrl.searchParams, 6)));
}

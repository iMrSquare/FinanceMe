import { NextResponse } from 'next/server';
import { getEstadisticasGastos } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getEstadisticasGastos(6));
}

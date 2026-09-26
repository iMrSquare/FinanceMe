import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/constants';

// Versión que sirve el servidor; la app la compara con la suya para pedir recargar tras actualizar
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ version: APP_VERSION }, { headers: { 'Cache-Control': 'no-store' } });
}

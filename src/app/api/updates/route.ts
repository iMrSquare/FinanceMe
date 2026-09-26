import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { comprobarActualizaciones, getUpdateInfo } from '@/lib/updates';

async function soloAdmin() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  return null;
}

export async function GET() {
  const denegado = await soloAdmin();
  if (denegado) return denegado;
  return NextResponse.json(getUpdateInfo());
}

/** Comprobar ahora (botón de Configuración) */
export async function POST() {
  const denegado = await soloAdmin();
  if (denegado) return denegado;
  return NextResponse.json(await comprobarActualizaciones());
}

import { NextResponse } from 'next/server';
import { getFijos, createFijo } from '@/lib/db';
import { requireEditor, requireSession } from '@/lib/auth';

export async function GET(req: Request) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get('tipo') as 'gasto' | 'prestamo' | 'ingreso' | null;
  if (!tipo) return NextResponse.json({ error: 'tipo requerido' }, { status: 400 });
  return NextResponse.json(getFijos(tipo));
}

export async function POST(req: Request) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;
  const { tipo, gasto, categoria, banco, importe, comentario, cobro, vencimiento } = await req.json();
  if (!tipo || !gasto) return NextResponse.json({ error: 'tipo y gasto requeridos' }, { status: 400 });
  const fijo = createFijo(tipo, gasto, categoria ?? null, banco ?? null, Number(importe) || 0, comentario ?? null, cobro ?? null, vencimiento ?? null);
  return NextResponse.json(fijo, { status: 201 });
}

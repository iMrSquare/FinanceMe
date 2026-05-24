import { NextResponse } from 'next/server';
import { getFijos, createFijo } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get('tipo') as 'gasto' | 'prestamo' | 'ingreso' | null;
  if (!tipo) return NextResponse.json({ error: 'tipo requerido' }, { status: 400 });
  return NextResponse.json(getFijos(tipo));
}

export async function POST(req: Request) {
  const { tipo, gasto, categoria, importe, comentario } = await req.json();
  if (!tipo || !gasto) return NextResponse.json({ error: 'tipo y gasto requeridos' }, { status: 400 });
  const fijo = createFijo(tipo, gasto, categoria ?? null, Number(importe) || 0, comentario ?? null);
  return NextResponse.json(fijo, { status: 201 });
}

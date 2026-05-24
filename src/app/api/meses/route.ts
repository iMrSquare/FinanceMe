import { NextResponse } from 'next/server';
import { getMeses, getOrCreateMes, getMes, applyFijosToMes } from '@/lib/db';

export async function GET() {
  const meses = getMeses();
  return NextResponse.json(meses);
}

export async function POST(req: Request) {
  const { mes, anio } = await req.json();
  if (!mes || !anio) return NextResponse.json({ error: 'mes y anio requeridos' }, { status: 400 });
  const isNew = !getMes(Number(mes), Number(anio));
  const mesObj = getOrCreateMes(Number(mes), Number(anio));
  if (isNew) applyFijosToMes(mesObj.id);
  return NextResponse.json(mesObj, { status: 201 });
}

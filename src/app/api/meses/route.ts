import { NextResponse } from 'next/server';
import { getMeses, getOrCreateMes, getMes, applyFijosToMes, clearMesData } from '@/lib/db';

export async function GET() {
  const meses = getMeses();
  return NextResponse.json(meses);
}

export async function POST(req: Request) {
  const { mes, anio, importarFijos = true, sobrescribir = false } = await req.json();
  if (!mes || !anio) return NextResponse.json({ error: 'mes y anio requeridos' }, { status: 400 });
  const isNew = !getMes(Number(mes), Number(anio));
  const mesObj = getOrCreateMes(Number(mes), Number(anio));
  if (sobrescribir) {
    clearMesData(mesObj.id);
    applyFijosToMes(mesObj.id, mesObj.mes, mesObj.anio);
  } else if (isNew && importarFijos) {
    applyFijosToMes(mesObj.id, mesObj.mes, mesObj.anio);
  }
  return NextResponse.json(mesObj, { status: 201 });
}

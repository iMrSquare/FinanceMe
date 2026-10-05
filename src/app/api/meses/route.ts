import { NextResponse } from 'next/server';
import { getMeses, getOrCreateMes, getMes, applyFijosToMes, clearMesData } from '@/lib/db';
import { requireEditor, requireSession } from '@/lib/auth';

export async function GET() {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const meses = getMeses();
  return NextResponse.json(meses);
}

export async function POST(req: Request) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;
  const { mes, anio, importarFijos = true, sobrescribir = false } = await req.json();
  if (!mes || !anio) return NextResponse.json({ error: 'mes y anio requeridos' }, { status: 400 });

  const mesNum = Number(mes);
  const anioNum = Number(anio);
  if (!Number.isInteger(mesNum) || mesNum < 1 || mesNum > 12 || !Number.isInteger(anioNum) || anioNum < 1900 || anioNum > 2999) {
    return NextResponse.json({ error: 'Mes no válido' }, { status: 400 });
  }

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

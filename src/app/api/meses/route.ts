import { NextResponse } from 'next/server';
import { getMeses, getOrCreateMes, getMes, applyFijosToMes, clearMesData, getMesActual } from '@/lib/db';
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
  const { mes: mesActual, anio: anioActual } = getMesActual();
  let maxAnio = anioActual;
  let maxMes = mesActual + 1; // mes actual + 1 (siguiente mes permitido)
  if (maxMes > 12) { maxMes -= 12; maxAnio += 1; }
  if (anioNum > maxAnio || (anioNum === maxAnio && mesNum > maxMes)) {
    return NextResponse.json({ error: 'Solo se puede crear como máximo el mes siguiente al actual' }, { status: 400 });
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

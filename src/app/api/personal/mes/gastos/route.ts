import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPersonalGastosMes, createPersonalGastoMes, getPersonalCategorias } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const anio = Number(searchParams.get('anio'));
  const mes = Number(searchParams.get('mes'));
  if (!anio || !mes) return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 });

  return NextResponse.json({
    gastos: getPersonalGastosMes(session.id, anio, mes),
    categorias: getPersonalCategorias(session.id),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { anio, mes, concepto, importe, categoria, banco, fecha, comentario } = await request.json();
  if (!anio || !mes || !concepto?.trim() || importe == null) {
    return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
  }

  createPersonalGastoMes(session.id, Number(anio), Number(mes), {
    concepto: concepto.trim(),
    importe: Number(importe),
    categoria: categoria || null,
    banco: banco || null,
    fecha: fecha || null,
    comentario: comentario || null,
  });

  return NextResponse.json({ ok: true });
}

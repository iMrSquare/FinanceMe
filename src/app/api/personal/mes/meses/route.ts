import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  createPersonalMes, getPersonalGastos, createPersonalGastoMes,
  getPersonalSuscripciones, getPersonalAhorro, getPresupuestoAutoConfigs,
  personalMesExists, clearPersonalMesGastos,
} from '@/lib/db';
import type { PersonalGastoFijo } from '@/lib/db';

function roundUp5(n: number): number {
  return Math.ceil(n / 5) * 5;
}

function cobroFecha(cobro: string | null, mes: number, anio: number): string | null {
  if (!cobro) return null;
  const day = Math.min(parseInt(cobro), new Date(anio, mes, 0).getDate());
  return `${anio}-${String(mes).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isVencido(f: PersonalGastoFijo, mes: number, anio: number): boolean {
  if (!f.vencimiento) return false;
  const [vAnio, vMes] = f.vencimiento.split('T')[0].split('-').map(Number);
  return vAnio < anio || (vAnio === anio && vMes < mes);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { mes, anio, importarFijos, sobrescribir = false } = await request.json();
  if (!mes || !anio) return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 });

  const mesNum = Number(mes);
  const anioNum = Number(anio);

  const now = new Date();
  if (anioNum > now.getFullYear() || (anioNum === now.getFullYear() && mesNum > now.getMonth() + 1)) {
    return NextResponse.json({ error: 'No se pueden crear meses futuros' }, { status: 400 });
  }

  const alreadyExists = personalMesExists(session.id, mesNum, anioNum);

  if (sobrescribir && alreadyExists) {
    clearPersonalMesGastos(session.id, mesNum, anioNum);
    // Import fijos with cobro→fecha conversion
    const fijos = getPersonalGastos(session.id);
    for (const f of fijos) {
      if (isVencido(f, mesNum, anioNum)) continue;
      createPersonalGastoMes(session.id, anioNum, mesNum, {
        concepto: f.gasto, importe: f.importe,
        categoria: f.categoria, banco: f.banco,
        fecha: cobroFecha(f.cobro, mesNum, anioNum),
        comentario: f.comentario,
      });
    }
    return NextResponse.json({ ok: true, anio: anioNum, mes: mesNum });
  }

  if (alreadyExists) {
    return NextResponse.json({ error: 'Este mes ya está creado' }, { status: 409 });
  }

  createPersonalMes(session.id, mesNum, anioNum);

  if (importarFijos) {
    const fijos = getPersonalGastos(session.id);
    for (const f of fijos) {
      if (isVencido(f, mesNum, anioNum)) continue;
      createPersonalGastoMes(session.id, anioNum, mesNum, {
        concepto: f.gasto, importe: f.importe,
        categoria: f.categoria, banco: f.banco,
        fecha: cobroFecha(f.cobro, mesNum, anioNum),
        comentario: f.comentario,
      });
    }

    const autoConfigs = getPresupuestoAutoConfigs(session.id);

    const suscs = getPersonalSuscripciones(session.id);
    const suscReal = suscs.reduce((s, sub) => s + (sub.periodicidad === 'anual' ? sub.importe / 12 : sub.importe), 0);
    if (suscReal > 0) {
      const cfg = autoConfigs.find(c => c.tipo === 'suscripciones');
      createPersonalGastoMes(session.id, anioNum, mesNum, {
        concepto: 'Suscripciones',
        importe: roundUp5(suscReal),
        categoria: cfg?.categoria ?? null,
        banco: cfg?.banco ?? null,
        fecha: null,
        comentario: `Total suscripciones redondeado (real: ${suscReal.toFixed(2)} €)`,
      });
    }

    const ahorro = getPersonalAhorro(session.id, anioNum);
    const ahorroMensual = ahorro.objetivo_anual / 12;
    if (ahorroMensual > 0) {
      const cfg = autoConfigs.find(c => c.tipo === 'ahorro');
      createPersonalGastoMes(session.id, anioNum, mesNum, {
        concepto: 'Ahorro mensual',
        importe: ahorroMensual,
        categoria: cfg?.categoria ?? null,
        banco: cfg?.banco ?? null,
        fecha: null,
        comentario: `Objetivo ${ahorro.objetivo_anual} € / año ÷ 12 redondeado`,
      });
    }
  }

  return NextResponse.json({ ok: true, anio: anioNum, mes: mesNum });
}

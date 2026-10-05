import { NextRequest, NextResponse } from 'next/server';
import { getSession, verifyPassword } from '@/lib/auth';
import { lineasRecurrentesMes } from '@/lib/recurrentes';
import { mensualNecesario } from '@/lib/ahorroObjetivos';
import { descripcionCuotaAhorro, objetivoMensualAhorro } from '@/lib/ahorro';
import { formatEUR } from '@/lib/format';
import {
  createPersonalMes, getPersonalGastos, createPersonalGastoMes,
  getPersonalIngresosFijos, createPersonalIngresoMes,
  getPersonalSuscripciones, getPersonalAhorro, getPersonalAhorroObjetivos, getPresupuestoAutoConfigs,
  personalMesExists, clearPersonalMesGastos, clearPersonalMesIngresos, deletePersonalMes, getUserById, isPersonalMesBloqueado,
} from '@/lib/db';
import type { PersonalGastoFijo } from '@/lib/db';

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

function applyVirtualRows(userId: number, anioNum: number, mesNum: number) {
  const autoConfigs = getPresupuestoAutoConfigs(userId);

  const recurrentesCfg = autoConfigs.find(c => c.tipo === 'suscripciones') ?? { banco: null, categoria: null };
  for (const linea of lineasRecurrentesMes(getPersonalSuscripciones(userId), recurrentesCfg, anioNum, mesNum)) {
    createPersonalGastoMes(userId, anioNum, mesNum, linea);
  }

  const ahorro = getPersonalAhorro(userId, anioNum);
  const ahorroMensual = objetivoMensualAhorro(ahorro, anioNum);
  if (ahorroMensual > 0) {
    const cfg = autoConfigs.find(c => c.tipo === 'ahorro');
    createPersonalGastoMes(userId, anioNum, mesNum, {
      concepto: 'Ahorro mensual',
      importe: ahorroMensual,
      categoria: cfg?.categoria ?? null,
      banco: cfg?.banco ?? null,
      fecha: null,
      comentario: descripcionCuotaAhorro(ahorro, formatEUR),
    });
  }

  const objetivosMensual = getPersonalAhorroObjetivos(userId)
    .reduce((s, o) => s + (mensualNecesario(o) ?? 0), 0);
  if (objetivosMensual > 0) {
    const cfg = autoConfigs.find(c => c.tipo === 'objetivos');
    createPersonalGastoMes(userId, anioNum, mesNum, {
      concepto: 'Objetivos',
      importe: objetivosMensual,
      categoria: cfg?.categoria ?? null,
      banco: cfg?.banco ?? null,
      fecha: null,
      comentario: 'Aportación mensual necesaria para tus objetivos de ahorro en progreso',
    });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { mes, anio, importarFijos, sobrescribir = false } = await request.json();
  if (!mes || !anio) return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 });

  const mesNum = Number(mes);
  const anioNum = Number(anio);

  if (!Number.isInteger(mesNum) || mesNum < 1 || mesNum > 12 || !Number.isInteger(anioNum) || anioNum < 1900 || anioNum > 2999) {
    return NextResponse.json({ error: 'Mes no válido' }, { status: 400 });
  }

  const alreadyExists = personalMesExists(session.id, mesNum, anioNum);

  if (sobrescribir && alreadyExists) {
    clearPersonalMesGastos(session.id, mesNum, anioNum);
    clearPersonalMesIngresos(session.id, mesNum, anioNum);
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
    const ingresosFijos = getPersonalIngresosFijos(session.id);
    for (const i of ingresosFijos) {
      createPersonalIngresoMes(session.id, anioNum, mesNum, {
        concepto: i.concepto, importe: i.importe, fecha: null, comentario: i.comentario,
      });
    }
    applyVirtualRows(session.id, anioNum, mesNum);
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

    applyVirtualRows(session.id, anioNum, mesNum);

    const ingresosFijos = getPersonalIngresosFijos(session.id);
    for (const i of ingresosFijos) {
      createPersonalIngresoMes(session.id, anioNum, mesNum, {
        concepto: i.concepto, importe: i.importe, fecha: null, comentario: i.comentario,
      });
    }
  }

  return NextResponse.json({ ok: true, anio: anioNum, mes: mesNum });
}

// Elimina el mes y todos sus movimientos. Exige la contraseña del usuario y que el mes esté desbloqueado
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { mes, anio, password } = await request.json().catch(() => ({}));
  const mesNum = Number(mes);
  const anioNum = Number(anio);
  if (!personalMesExists(session.id, mesNum, anioNum)) return NextResponse.json({ error: 'El mes no existe' }, { status: 404 });
  if (isPersonalMesBloqueado(session.id, anioNum, mesNum)) {
    return NextResponse.json({ error: 'El mes está bloqueado: desbloquéalo antes de eliminarlo' }, { status: 409 });
  }
  const user = getUserById(session.id);
  if (!user || typeof password !== 'string' || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'La contraseña no es correcta' }, { status: 403 });
  }
  deletePersonalMes(session.id, mesNum, anioNum);
  return NextResponse.json({ ok: true });
}

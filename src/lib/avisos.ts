import { billingDatesBetween } from './billing';
import { getFijos, getHogarRecurrentes, getPersonalGastos, getPersonalSuscripciones } from './db';

export type AvisoScope = 'hogar' | 'personal';

export interface ProximoPago {
  clave: string;
  origen: 'presupuesto' | 'recurrente';
  id: number;
  concepto: string;
  importe: number;
  /** YYYY-MM-DD */
  fecha: string;
  periodicidad: string;
  href: string;
}

interface Fuente {
  origen: ProximoPago['origen'];
  id: number;
  concepto: string;
  importe: number;
  cobro: string | null;
  periodicidad: string;
  vencimiento?: string | null;
}

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Un fijo con vencimiento sigue vigente durante todo el mes de su vencimiento (igual que al crear el Mes)
function vigente(fecha: Date, vencimiento: string | null | undefined) {
  if (!vencimiento) return true;
  const [vAnio, vMes] = vencimiento.split('T')[0].split('-').map(Number);
  return fecha.getFullYear() < vAnio || (fecha.getFullYear() === vAnio && fecha.getMonth() + 1 <= vMes);
}

function fuentes(scope: AvisoScope, userId?: number): Fuente[] {
  if (scope === 'hogar') {
    return [
      ...getFijos('gasto').map(f => ({ origen: 'presupuesto' as const, id: f.id, concepto: f.gasto, importe: f.importe, cobro: f.cobro, periodicidad: 'mensual', vencimiento: f.vencimiento })),
      ...getHogarRecurrentes().map(r => ({ origen: 'recurrente' as const, id: r.id, concepto: r.nombre, importe: r.importe, cobro: r.cobro, periodicidad: r.periodicidad })),
    ];
  }
  if (userId === undefined) return [];
  return [
    ...getPersonalGastos(userId).map(f => ({ origen: 'presupuesto' as const, id: f.id, concepto: f.gasto, importe: f.importe, cobro: f.cobro, periodicidad: 'mensual', vencimiento: f.vencimiento })),
    ...getPersonalSuscripciones(userId).map(r => ({ origen: 'recurrente' as const, id: r.id, concepto: r.nombre, importe: r.importe, cobro: r.cobro, periodicidad: r.periodicidad })),
  ];
}

/** Pagos con fecha de cobro conocida entre `desde` y `hasta`, ordenados por fecha */
export function getProximosPagos(scope: AvisoScope, userId: number | undefined, desde: Date, hasta: Date): ProximoPago[] {
  const pagos: ProximoPago[] = [];
  for (const f of fuentes(scope, userId)) {
    if (!f.cobro || f.importe <= 0) continue;
    const href = f.origen === 'presupuesto' ? `/${scope}/presupuesto` : `/${scope}/modulos/recurrentes`;
    for (const d of billingDatesBetween(f.cobro, f.periodicidad, desde, hasta)) {
      if (!vigente(d, f.vencimiento)) continue;
      const fecha = toISODate(d);
      pagos.push({ clave: `${f.origen}:${f.id}:${fecha}`, origen: f.origen, id: f.id, concepto: f.concepto, importe: f.importe, fecha, periodicidad: f.periodicidad, href });
    }
  }
  return pagos.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.concepto.localeCompare(b.concepto, 'es'));
}

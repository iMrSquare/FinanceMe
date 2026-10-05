import { billingDayInMonth, mesesMarcados, monthlyEquivalent, tieneFechaReferencia } from './billing';

export interface RecurrenteLike {
  id: number;
  nombre: string;
  importe: number;
  cobro: string | null;
  periodicidad: string;
  /** Meses (1-12) en que se cobra, separados por comas; null = todos */
  meses?: string | null;
  comentario?: string | null;
  categoria?: string | null;
  banco?: string | null;
}

export interface RecurrentesConfig {
  banco: string | null;
  categoria: string | null;
  redondeo?: number;
  desglose?: number;
}

export interface LineaMes {
  concepto: string;
  importe: number;
  fecha: string | null;
  categoria: string | null;
  banco: string | null;
  comentario: string | null;
}

export const PERIODICIDAD_LABEL: Record<string, string> = { mensual: 'Mensual', bimensual: 'Bimensual', trimestral: 'Trimestral', anual: 'Anual' };

/** Periodicidades en las que se pueden excluir meses (en trimestral y anual los marca la fecha) */
export const admiteExclusionMeses = (periodicidad: string) => periodicidad === 'mensual' || periodicidad === 'bimensual';

export function roundUp5(n: number): number {
  return Math.ceil(n / 5) * 5;
}

export function totalMensualRecurrentes(items: RecurrenteLike[]): number {
  return items.reduce((s, r) => s + monthlyEquivalent(r), 0);
}

/** Importe que los recurrentes aportan al Presupuesto mensual según la configuración */
export function importeVirtualRecurrentes(items: RecurrenteLike[], cfg: RecurrentesConfig): number {
  const real = totalMensualRecurrentes(items);
  if (real <= 0) return 0;
  if (cfg.desglose) return real;
  return (cfg.redondeo ?? 1) ? roundUp5(real) : real;
}

/** Líneas que se crean en un Mes (mes 1-12) a partir de los recurrentes */
export function lineasRecurrentesMes(items: RecurrenteLike[], cfg: RecurrentesConfig, anio: number, mes: number, conceptoTotal = 'Recurrentes'): LineaMes[] {
  const base = { categoria: cfg.categoria ?? null, banco: cfg.banco ?? null };

  if (!cfg.desglose) {
    const real = totalMensualRecurrentes(items);
    if (real <= 0) return [];
    const redondea = (cfg.redondeo ?? 1) === 1;
    return [{
      ...base,
      concepto: conceptoTotal,
      importe: redondea ? roundUp5(real) : real,
      fecha: null,
      comentario: redondea ? `Total recurrentes redondeado (real: ${real.toFixed(2)} €)` : 'Total recurrentes (sin redondeo)',
    }];
  }

  const lineas: LineaMes[] = [];
  for (const r of items) {
    if (r.importe <= 0) continue;
    // Desglosado: cada recurrente usa su categoría y banco; si no tiene, los de la fila automática
    const base = { categoria: r.categoria || cfg.categoria || null, banco: r.banco || cfg.banco || null };
    const mensual = r.periodicidad === 'mensual';
    // Meses excluidos: no se añade en los que no están marcados
    const marcados = mesesMarcados(r.meses);
    if (marcados && !marcados.has(mes - 1)) continue;
    // Sin fecha de referencia no se sabe en qué mes cae un cobro bimensual/trimestral/anual: se prorratea
    if (!mensual && !tieneFechaReferencia(r)) {
      lineas.push({ ...base, concepto: r.nombre, importe: monthlyEquivalent(r), fecha: null,
        comentario: `${PERIODICIDAD_LABEL[r.periodicidad] ?? r.periodicidad} prorrateado (${r.importe.toFixed(2)} €)` });
      continue;
    }
    let fecha: string | null = null;
    if (r.cobro) {
      const dia = billingDayInMonth(r, anio, mes - 1);
      if (dia === null) continue;
      fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    }
    lineas.push({ ...base, concepto: r.nombre, importe: r.importe, fecha, comentario: r.comentario ?? null });
  }
  return lineas;
}

const PERIODICIDADES = ['mensual', 'bimensual', 'trimestral', 'anual'] as const;

/** Normaliza la lista de meses marcados (1-12); null si son todos o no aplica */
export function normalizarMeses(v: unknown): string | null | undefined {
  const lista = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : null;
  if (!lista) return null;
  const meses = [...new Set(lista.map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= 12))].sort((a, b) => a - b);
  if (meses.length === 0) return undefined; // ninguno marcado: inválido
  return meses.length === 12 ? null : meses.join(',');
}

/** Valida el cuerpo de un POST/PUT de recurrente; null si falta algún campo obligatorio */
export function parseRecurrenteBody(body: Record<string, unknown>) {
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  const importe = Number(body.importe);
  if (!nombre || body.importe == null || !Number.isFinite(importe)) return null;
  const periodicidad = PERIODICIDADES.find(p => p === body.periodicidad) ?? 'mensual';
  const meses = admiteExclusionMeses(periodicidad) ? normalizarMeses(body.meses) : null;
  if (meses === undefined) return null;
  return {
    nombre,
    importe,
    cobro: typeof body.cobro === 'string' && body.cobro ? body.cobro : null,
    periodicidad,
    meses,
    comentario: typeof body.comentario === 'string' && body.comentario ? body.comentario : null,
    categoria: typeof body.categoria === 'string' && body.categoria ? body.categoria : null,
    banco: typeof body.banco === 'string' && body.banco ? body.banco : null,
  };
}

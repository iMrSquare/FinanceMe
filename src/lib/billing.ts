/** Lo mínimo para calcular cobros de un recurrente */
export interface Periodico {
  cobro: string | null;
  periodicidad: string;
  /** Meses (1-12) en que se cobra, separados por comas; null = todos */
  meses?: string | null;
}

const PASO_MESES: Record<string, number> = { mensual: 1, bimensual: 2, trimestral: 3, anual: 12 };
const paso = (periodicidad: string) => PASO_MESES[periodicidad] ?? 1;

/** Meses (0-11) marcados; null si se cobra en todos */
export function mesesMarcados(meses: string | null | undefined): Set<number> | null {
  if (!meses) return null;
  const set = new Set(meses.split(',').map(n => Number(n) - 1).filter(n => n >= 0 && n <= 11));
  return set.size === 0 || set.size === 12 ? null : set;
}

function isDayOnly(cobro: string) {
  const d = parseInt(cobro);
  return !isNaN(d) && d >= 1 && d <= 31 && !cobro.includes('-');
}

/** ¿Tiene fecha de referencia? Sin ella no se sabe en qué meses cae un cobro no mensual */
export const tieneFechaReferencia = (r: Pick<Periodico, 'cobro'>) => !!r.cobro && !isDayOnly(r.cobro);

/** Número de cobros al año, teniendo en cuenta los meses excluidos */
export function cobrosAlAnio(r: Periodico): number {
  const marcados = mesesMarcados(r.meses);
  const p = paso(r.periodicidad);
  if (!marcados) return 12 / p;
  if (p === 1) return marcados.size;
  // Con fecha de referencia se cuentan los meses del ciclo que siguen marcados; si no, proporción
  if (!tieneFechaReferencia(r)) return (12 / p) * (marcados.size / 12);
  const inicio = new Date(r.cobro!).getUTCMonth();
  let n = 0;
  for (let m = 0; m < 12; m++) if ((m - inicio + 12) % p === 0 && marcados.has(m)) n++;
  return n;
}

/** Equivalente mensual: lo que cuesta al año repartido entre 12 */
export function monthlyEquivalent(r: Periodico & { importe: number }): number {
  return (r.importe * cobrosAlAnio(r)) / 12;
}

// Day this subscription bills on within the given month/year, or null if it doesn't
// bill that month (outside its billing cycle, or a month the user excluded).
// Unlike nextBillingDate, this does NOT roll forward when the day has already passed —
// it's meant for "does this show on this month's calendar", not "when's the next charge".
export function billingDayInMonth(r: Periodico, year: number, month: number): number | null {
  if (!r.cobro) return null;
  const marcados = mesesMarcados(r.meses);
  if (marcados && !marcados.has(month)) return null;

  const dayOnly = isDayOnly(r.cobro);
  const original = dayOnly ? null : new Date(r.cobro);
  const day = dayOnly ? parseInt(r.cobro) : original!.getUTCDate();
  const clampDay = () => Math.min(day, new Date(year, month + 1, 0).getDate());

  if (!original) return clampDay();
  const p = paso(r.periodicidad);
  if (p === 1) return clampDay();
  const diff = (year - original.getUTCFullYear()) * 12 + (month - original.getUTCMonth());
  // Anual: se cobra cada año en el mes de la fecha, también en años anteriores a ella
  if (p === 12) return ((diff % 12) + 12) % 12 === 0 ? clampDay() : null;
  return diff >= 0 && diff % p === 0 ? clampDay() : null;
}

/** Fechas de cobro entre `desde` y `hasta` (ambas incluidas, a nivel de día) */
export function billingDatesBetween(r: Periodico, desde: Date, hasta: Date): Date[] {
  const from = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const to = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  const out: Date[] = [];
  let y = from.getFullYear();
  let m = from.getMonth();
  while (y < to.getFullYear() || (y === to.getFullYear() && m <= to.getMonth())) {
    const day = billingDayInMonth(r, y, m);
    if (day !== null) {
      const d = new Date(y, m, day);
      if (d >= from && d <= to) out.push(d);
    }
    if (++m > 11) { m = 0; y++; }
  }
  return out;
}

// Supports day-only format ("15") and legacy ISO date format ("2026-06-15").
// null si no tiene fecha o no se cobra en ningún mes del próximo año
export function nextBillingDate(r: Periodico, from: Date = new Date()): Date | null {
  if (!r.cobro) return null;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(start.getFullYear() + 1, start.getMonth() + 1, start.getDate());
  return billingDatesBetween(r, start, end)[0] ?? null;
}

export function monthlyEquivalent(importe: number, periodicidad: string): number {
  if (periodicidad === 'anual') return importe / 12;
  if (periodicidad === 'trimestral') return importe / 3;
  return importe;
}

// Day this subscription bills on within the given month/year, or null if it doesn't
// bill that month (e.g. a trimestral/anual subscription outside its billing cycle).
// Unlike nextBillingDate, this does NOT roll forward when the day has already passed —
// it's meant for "does this show on this month's calendar", not "when's the next charge".
export function billingDayInMonth(cobro: string, periodicidad: string, year: number, month: number): number | null {
  const dayOnly = parseInt(cobro);
  const isDayOnly = !isNaN(dayOnly) && dayOnly >= 1 && dayOnly <= 31;
  const original = isDayOnly ? null : new Date(cobro);
  const day = isDayOnly ? dayOnly : original!.getUTCDate();

  function clampDay(y: number, m: number, d: number): number {
    const last = new Date(y, m + 1, 0).getDate();
    return Math.min(d, last);
  }

  if (!original) return clampDay(year, month, day);

  if (periodicidad === 'anual') {
    return original.getUTCMonth() === month ? clampDay(year, month, day) : null;
  }

  if (periodicidad === 'trimestral') {
    const diff = (year - original.getUTCFullYear()) * 12 + (month - original.getUTCMonth());
    return diff >= 0 && diff % 3 === 0 ? clampDay(year, month, day) : null;
  }

  return clampDay(year, month, day);
}

/** Fechas de cobro entre `desde` y `hasta` (ambas incluidas, a nivel de día) */
export function billingDatesBetween(cobro: string, periodicidad: string, desde: Date, hasta: Date): Date[] {
  const from = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const to = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  const out: Date[] = [];
  let y = from.getFullYear();
  let m = from.getMonth();
  while (y < to.getFullYear() || (y === to.getFullYear() && m <= to.getMonth())) {
    const day = billingDayInMonth(cobro, periodicidad, y, m);
    if (day !== null) {
      const d = new Date(y, m, day);
      if (d >= from && d <= to) out.push(d);
    }
    if (++m > 11) { m = 0; y++; }
  }
  return out;
}

// Supports day-only format ("15") and legacy ISO date format ("2026-06-15")
export function nextBillingDate(cobro: string, periodicidad: string, from: Date = new Date()): Date {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(start.getFullYear() + 1, start.getMonth() + 1, start.getDate());
  return billingDatesBetween(cobro, periodicidad, start, end)[0] ?? start;
}

export function monthlyEquivalent(importe: number, periodicidad: string): number {
  if (periodicidad === 'anual') return importe / 12;
  if (periodicidad === 'trimestral') return importe / 3;
  return importe;
}

export function nextBillingDate(cobro: string, periodicidad: string): Date {
  // Support day-only format ("15") and legacy ISO date format ("2026-06-15")
  const dayOnly = parseInt(cobro);
  const isDayOnly = !isNaN(dayOnly) && dayOnly >= 1 && dayOnly <= 31;
  const original = isDayOnly ? null : new Date(cobro);
  const day = isDayOnly ? dayOnly : original!.getUTCDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function clampDay(y: number, m: number, d: number): Date {
    const last = new Date(y, m + 1, 0).getDate();
    return new Date(y, m, Math.min(d, last));
  }

  if (periodicidad === 'anual') {
    const month = original ? original.getUTCMonth() : today.getMonth();
    let y = today.getFullYear();
    let candidate = clampDay(y, month, day);
    if (candidate < today) candidate = clampDay(y + 1, month, day);
    return candidate;
  }

  const stepMonths = periodicidad === 'trimestral' ? 3 : 1;
  let y = today.getFullYear();
  let m = today.getMonth();
  let candidate = clampDay(y, m, day);
  if (candidate < today) {
    m += stepMonths;
    while (m > 11) { m -= 12; y += 1; }
    candidate = clampDay(y, m, day);
  }
  return candidate;
}

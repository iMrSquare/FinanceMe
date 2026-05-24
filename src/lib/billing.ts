export function nextBillingDate(cobro: string, periodicidad: string): Date {
  const original = new Date(cobro);
  const day = original.getUTCDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function clampDay(y: number, m: number, d: number): Date {
    const last = new Date(y, m + 1, 0).getDate();
    return new Date(y, m, Math.min(d, last));
  }

  if (periodicidad === 'mensual') {
    let y = today.getFullYear();
    let m = today.getMonth();
    let candidate = clampDay(y, m, day);
    if (candidate < today) {
      m += 1;
      if (m > 11) { m = 0; y += 1; }
      candidate = clampDay(y, m, day);
    }
    return candidate;
  } else {
    const month = original.getUTCMonth();
    let y = today.getFullYear();
    let candidate = clampDay(y, month, day);
    if (candidate < today) candidate = clampDay(y + 1, month, day);
    return candidate;
  }
}

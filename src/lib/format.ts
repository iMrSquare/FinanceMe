// es-ES no agrupa miles en números de 4 cifras (1190,00); en importes siempre se agrupa (1.190,00)
const numero = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: 'always',
} as Intl.NumberFormatOptions);

const entero = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' } as Intl.NumberFormatOptions);

/** 1.190,50 € · −25,00 € (signo menos tipográfico) · +1.859,10 € con `signo` */
export function formatEUR(n: number, opts: { signo?: boolean; decimales?: boolean } = {}): string {
  const valor = Number.isFinite(n) ? n : 0;
  const abs = (opts.decimales === false ? entero : numero).format(Math.abs(valor)) + ' €';
  if (valor < 0 && Math.abs(valor) >= 0.005) return `−${abs}`;
  return opts.signo && valor > 0 ? `+${abs}` : abs;
}

/** 7 sept · null → — */
export function formatFechaCorta(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.split('T')[0] + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

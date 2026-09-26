const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function MonthYearInput({ value, onChange, className, style, years: yearsProp, ariaLabel }: {
  value: string; onChange: (v: string) => void;
  className?: string; style?: React.CSSProperties;
  /** Años seleccionables; por defecto, el actual y los 15 siguientes */
  years?: number[];
  ariaLabel?: string;
}) {
  const [year, month] = value ? value.split('-') : ['', ''];
  const currentYear = new Date().getFullYear();
  const years = yearsProp ?? Array.from({ length: 16 }, (_, i) => currentYear + i);

  const set = (y: string, m: string) => { if (y && m) onChange(`${y}-${m}`); };

  return (
    <div className="grid grid-cols-2 gap-2">
      <select value={month} onChange={e => set(year || String(years[years.length - 1] ?? currentYear), e.target.value)} className={className} style={style} aria-label={ariaLabel ? `${ariaLabel}: mes` : undefined}>
        <option value="" disabled>Mes</option>
        {MESES.map((m, i) => <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
      </select>
      <select value={year} onChange={e => set(e.target.value, month || '01')} className={className} style={style} aria-label={ariaLabel ? `${ariaLabel}: año` : undefined}>
        <option value="" disabled>Año</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

const LABELS: Record<string, string> = {
  categorias: 'Categorías',
  bancos: 'Bancos',
  gastos_fijos: 'Gastos fijos',
  ingresos_fijos: 'Ingresos fijos',
  suscripciones: 'Recurrentes',
  hogar_recurrentes: 'Recurrentes',
  fijos: 'Fijos',
  ahorro: 'Objetivo anual de ahorro',
  ahorro_mes: 'Aportaciones mensuales de ahorro',
  ahorro_objetivos: 'Objetivos de ahorro',
  meses: 'Meses',
  gastos_mes: 'Meses con gastos registrados',
  ingresos_mes: 'Meses con ingresos registrados',
  presupuesto_auto: 'Presupuesto automático',
  registro_luz: 'Registros de luz',
  registro_agua: 'Registros de agua',
};

interface Props {
  count: number;
  breakdown: Record<string, number>;
  onOverwrite: () => void;
  onSkip: () => void;
  onCancel: () => void;
}

export function ImportOverwriteDialog({ count, breakdown, onOverwrite, onSkip, onCancel }: Props) {
  const items = Object.entries(breakdown).filter(([, n]) => n > 0);
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onCancel}>
      <div className="glass-card rounded-3xl p-8 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(var(--color-warning-rgb),0.12)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.14A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          </svg>
        </div>
        <h3 className="font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Se han encontrado {count} registro{count !== 1 ? 's' : ''} ya existente{count !== 1 ? 's' : ''}</h3>
        {items.length > 0 && (
          <ul className="text-xs text-left mb-4 mx-auto max-w-xs space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
            {items.map(([key, n]) => (
              <li key={key} className="flex justify-between">
                <span>{LABELS[key] ?? key}</span>
                <span className="font-semibold">{n}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>¿Quieres sobrescribirlos con los datos del archivo o mantener los actuales? El resto de registros nuevos se importará en cualquier caso.</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onOverwrite}
            className="w-full py-2.5 rounded-2xl text-sm font-bold text-white shadow-lg shadow-accent-primary/30"
            style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-dark))' }}
          >
            Sobrescribir
          </button>
          <button
            onClick={onSkip}
            className="w-full py-2.5 rounded-2xl text-sm font-semibold border transition-colors"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'transparent' }}
          >
            Mantener los actuales
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 rounded-2xl text-xs font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancelar importación
          </button>
        </div>
      </div>
    </div>
  );
}

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

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
  const plural = count !== 1 ? 's' : '';
  return (
    <Modal title={`${count} registro${plural} ya existente${plural}`} onClose={onCancel} width="500px">
      {items.length > 0 && (
        <ul className="fm-card mb-4 text-sm divide-y divide-[var(--divider)]">
          {items.map(([key, n]) => (
            <li key={key} className="flex justify-between gap-3 px-3 py-2">
              <span style={{ color: 'var(--text-secondary)' }}>{LABELS[key] ?? key}</span>
              <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{n}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        ¿Quieres sobrescribirlos con los datos del archivo o mantener los actuales? El resto de registros nuevos se importará en cualquier caso.
      </p>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-5">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={onSkip}>Mantener los actuales</Button>
        <Button variant="primary" onClick={onOverwrite}>Sobrescribir</Button>
      </div>
    </Modal>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { AutoRow } from '@/components/presupuesto/PresupuestoView';
import { diaCobro } from '@/components/presupuesto/PresupuestoView';
import { importeVirtualRecurrentes, totalMensualRecurrentes, PERIODICIDAD_LABEL, type RecurrenteLike, type RecurrentesConfig } from '@/lib/recurrentes';
import { monthlyEquivalent, nextBillingDate } from '@/lib/billing';
import { formatEUR } from '@/lib/format';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

type Recurrente = RecurrenteLike & { categoria?: string | null; banco?: string | null };

/** Texto de la columna Cobro: día del mes si es mensual; si no, la fecha del próximo cobro */
export function cobroTexto(r: Pick<Recurrente, 'cobro' | 'periodicidad'>): string | undefined {
  if (!r.cobro) return undefined;
  if (r.periodicidad === 'mensual') {
    const d = diaCobro(r.cobro);
    return d ? `Día ${d}` : undefined;
  }
  const f = nextBillingDate(r.cobro, r.periodicidad);
  return f.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

/** Filas automáticas de Recurrentes en el Presupuesto: una con el total o una por recurrente */
export function filasRecurrentes(items: Recurrente[], cfg: RecurrentesConfig & { desglose?: number }, tipo: string): AutoRow[] {
  const virtual = importeVirtualRecurrentes(items, cfg);
  if (virtual <= 0) return [];
  if (!cfg.desglose) {
    const real = totalMensualRecurrentes(items);
    return [{
      key: 'rec', tipo, concepto: 'Recurrentes', importe: virtual, categoria: cfg.categoria, banco: cfg.banco,
      subtitulo: cfg.redondeo ? `${formatEUR(real)} al mes, redondeado al múltiplo de 5 €` : `${formatEUR(real)} al mes`,
    }];
  }
  return items.filter(r => r.importe > 0).map(r => ({
    key: `rec-${r.id}`, tipo, recurrenteId: r.id, concepto: r.nombre,
    importe: monthlyEquivalent(r.importe, r.periodicidad),
    categoria: r.categoria || cfg.categoria, banco: r.banco || cfg.banco,
    cobroTexto: cobroTexto(r),
    subtitulo: r.periodicidad === 'mensual' ? 'Recurrente mensual' : `${PERIODICIDAD_LABEL[r.periodicidad]} de ${formatEUR(r.importe)}, prorrateado`,
  }));
}

/** Cambia la categoría y el banco de un recurrente desde el Presupuesto (modo desglosado) */
export function RecurrenteAjustesModal({ recurrente, apiBase, recurrentesHref, categorias, bancos, onClose, onSaved }: {
  recurrente: Recurrente & { comentario?: string | null };
  apiBase: string;
  recurrentesHref: string;
  categorias: { nombre: string }[];
  bancos: { nombre: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [categoria, setCategoria] = useState(recurrente.categoria ?? '');
  const [banco, setBanco] = useState(recurrente.banco ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function guardar() {
    setSaving(true);
    setError('');
    const res = await fetch(`${apiBase}/${recurrente.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...recurrente, categoria: categoria || null, banco: banco || null }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) { setError('No se pudo guardar. Inténtalo de nuevo.'); return; }
    onSaved();
  }

  return (
    <Modal title={recurrente.nombre} onClose={onClose}
      footer={<>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={guardar} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </>}>
      <p className="text-sm -mt-2 mb-4" style={{ color: 'var(--text-muted)' }}>
        {formatEUR(recurrente.importe)} · {PERIODICIDAD_LABEL[recurrente.periodicidad] ?? recurrente.periodicidad}
        {cobroTexto(recurrente) ? ` · ${recurrente.periodicidad === 'mensual' ? cobroTexto(recurrente) : `próximo el ${cobroTexto(recurrente)}`}` : ''}
      </p>
      <form onSubmit={e => { e.preventDefault(); guardar(); }} className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ra-cat" className="fm-label">Categoría</label>
          <select id="ra-cat" className="fm-input" value={categoria} onChange={e => setCategoria(e.target.value)}>
            <option value="">Sin categoría</option>
            {categorias.map(c => <option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ra-banco" className="fm-label">Banco</label>
          <select id="ra-banco" className="fm-input" value={banco} onChange={e => setBanco(e.target.value)}>
            <option value="">Sin banco</option>
            {bancos.map(b => <option key={b.nombre} value={b.nombre}>{b.nombre}</option>)}
          </select>
        </div>
        <button type="submit" hidden />
      </form>
      {error && <p role="alert" className="text-sm font-medium text-money-out mt-3">{error}</p>}
      <p className="text-[13px] mt-4" style={{ color: 'var(--text-muted)' }}>
        Importe, fecha de cobro y el resto de datos se cambian en{' '}
        <Link href={recurrentesHref} className="font-medium underline" style={{ color: 'var(--accent-mode)' }}>Recurrentes</Link>.
      </p>
    </Modal>
  );
}

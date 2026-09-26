'use client';

import { useState } from 'react';

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 border transition-colors appearance-none';
const inputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };

export interface AutoConfigValues {
  banco: string | null;
  categoria: string | null;
  redondeo?: boolean;
  desglose?: boolean;
}

interface Props {
  titulo: string;
  color: string;
  current: { banco: string | null; categoria: string | null; redondeo?: number; desglose?: number };
  categorias: { id: number; nombre: string }[];
  bancos: { id: number; nombre: string }[];
  /** Muestra las opciones propias de Recurrentes: desglosar y redondear */
  recurrentes?: boolean;
  onClose: () => void;
  onSave: (values: AutoConfigValues) => Promise<void>;
}

export default function AutoConfigModal({ titulo, color, current, categorias, bancos, recurrentes, onClose, onSave }: Props) {
  const [banco, setBanco] = useState(current.banco ?? '');
  const [categoria, setCategoria] = useState(current.categoria ?? '');
  const [redondeo, setRedondeo] = useState((current.redondeo ?? 1) === 1);
  const [desglose, setDesglose] = useState((current.desglose ?? 0) === 1);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      banco: banco || null,
      categoria: categoria || null,
      ...(recurrentes ? { redondeo, desglose } : {}),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={`Configurar ${titulo}`} className="glass-card rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>{titulo}</span>
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Configurar</h3>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="w-8 h-8 flex items-center justify-center rounded-full text-xl cursor-pointer" style={{ color: 'var(--text-muted)', background: 'var(--btn-hover)' }}>×</button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          {recurrentes && (
            <fieldset>
              <legend className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Cómo se añade al Mes</legend>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl" style={{ background: 'var(--bg-page)' }}>
                {[
                  { v: false, label: 'Total mensual', hint: 'Una sola línea' },
                  { v: true, label: 'Desglosado', hint: 'Una línea por recurrente' },
                ].map(opt => {
                  const active = desglose === opt.v;
                  return (
                    <button key={String(opt.v)} type="button" onClick={() => setDesglose(opt.v)} aria-pressed={active}
                      className="rounded-xl px-2 py-2 text-left transition-colors cursor-pointer min-h-[44px]"
                      style={{ background: active ? 'var(--bg-card)' : 'transparent', boxShadow: active ? '0 1px 4px var(--shadow-card)' : undefined }}>
                      <span className="block text-sm font-semibold" style={{ color: active ? color : 'var(--text-primary)' }}>{opt.label}</span>
                      <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{opt.hint}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                {desglose
                  ? 'Cada recurrente aparece con su importe y fecha de cobro. Los trimestrales y anuales solo se añaden en el mes en que se cobran.'
                  : 'Se añade una línea con el equivalente mensual de todos los recurrentes (anuales ÷ 12, trimestrales ÷ 3).'}
              </p>
            </fieldset>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Categoría{recurrentes && desglose ? ' por defecto' : ''}</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Banco{recurrentes && desglose ? ' por defecto' : ''}</label>
            <select value={banco} onChange={e => setBanco(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">Sin banco</option>
              {bancos.map(b => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
            </select>
          </div>
          {recurrentes && !desglose && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <button type="button" role="switch" aria-checked={redondeo} onClick={() => setRedondeo(v => !v)} className="w-10 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer" style={{ background: redondeo ? color : 'var(--divider)' }}>
                <span className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: redondeo ? '22px' : '4px' }} />
              </button>
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Redondear al alza</span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Redondea el total mensual real al múltiplo de 5€ superior</p>
              </div>
            </label>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold border cursor-pointer" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'transparent' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 shadow-lg cursor-pointer" style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 80%, black))` }}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

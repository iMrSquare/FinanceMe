'use client';

import { useEffect, useState } from 'react';
import { BackToModulos } from '@/components/modulos/ModulosHub';
import { SortableTh, useTableSort, type SortAccessor } from '@/components/SortableTable';
import { nextBillingDate } from '@/lib/billing';
import { PERIODICIDAD_LABEL, totalMensualRecurrentes } from '@/lib/recurrentes';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import InfoExpand from '@/components/InfoExpand';
import { PencilIcon, TrashIcon } from '@/components/icons';
import { useIsMobile } from '@/lib/useIsMobile';

type Periodicidad = 'mensual' | 'trimestral' | 'anual';

export interface Recurrente {
  id: number;
  nombre: string;
  importe: number;
  cobro: string | null;
  periodicidad: Periodicidad;
  comentario: string | null;
}

const ACCENT = '#8b5cf6';
const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const fmtNextDate = (cobro: string | null, periodicidad: string) =>
  cobro ? nextBillingDate(cobro, periodicidad).toLocaleDateString('es-ES') : '—';

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50 border transition-colors appearance-none';
const inputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };

const PERIODICIDAD_COLOR: Record<Periodicidad, string> = { mensual: ACCENT, trimestral: '#0ea5e9', anual: 'var(--color-warning)' };

type SortKey = 'nombre' | 'importe' | 'periodicidad' | 'cobro';
const COL_LABELS: Record<SortKey, string> = { nombre: 'Recurrente', importe: 'Importe', periodicidad: 'Periodicidad', cobro: 'Próximo cobro' };
const PERIODO_ORDEN: Record<string, number> = { mensual: 1, trimestral: 2, anual: 3 };
const SORT_RECURRENTES: Record<SortKey, SortAccessor<Recurrente>> = {
  nombre:       { get: r => r.nombre, type: 'text' },
  importe:      { get: r => r.importe, type: 'number' },
  periodicidad: { get: r => PERIODO_ORDEN[r.periodicidad] ?? 9, type: 'number' },
  cobro:        { get: r => (r.cobro ? nextBillingDate(r.cobro, r.periodicidad).getTime() : null), type: 'number' },
};

interface RecForm { id?: number; nombre: string; importe: string; cobro: string; periodicidad: Periodicidad; comentario: string; }
const emptyForm = (): RecForm => ({ nombre: '', importe: '', cobro: '', periodicidad: 'mensual', comentario: '' });
const toForm = (r: Recurrente): RecForm => ({ id: r.id, nombre: r.nombre, importe: String(r.importe), cobro: r.cobro ?? '', periodicidad: r.periodicidad, comentario: r.comentario ?? '' });

function RecurrenteModal({ form, setForm, onClose, onSave, saving, placeholder }: {
  form: RecForm; setForm: (f: RecForm) => void; onClose: () => void; onSave: () => void; saving: boolean; placeholder: string;
}) {
  const set = (k: keyof RecForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="rec-modal-title" className="glass-card rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 id="rec-modal-title" className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{form.id ? 'Editar recurrente' : 'Nuevo recurrente'}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer" style={{ color: 'var(--text-muted)', background: 'var(--btn-hover)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="space-y-4">
          <div><label htmlFor="rec-nombre" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nombre *</label>
            <input id="rec-nombre" value={form.nombre} onChange={set('nombre')} className={inputCls} style={inputStyle} placeholder={placeholder} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="rec-importe" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Importe (€) *</label>
              <input id="rec-importe" type="number" step="0.01" min="0" inputMode="decimal" value={form.importe} onChange={set('importe')} className={inputCls} style={inputStyle} placeholder="0.00" /></div>
            <div><label htmlFor="rec-periodicidad" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Periodicidad</label>
              <select id="rec-periodicidad" value={form.periodicidad} onChange={set('periodicidad')} className={inputCls} style={inputStyle}>
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
              </select></div>
          </div>
          <div><label htmlFor="rec-cobro" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Fecha de cobro</label>
            <input id="rec-cobro" type="date" value={form.cobro} onChange={set('cobro')} className={inputCls} style={inputStyle} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Un cobro cualquiera: a partir de él se calculan los siguientes y los avisos.</p></div>
          <div><label htmlFor="rec-comentario" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Comentario</label>
            <textarea id="rec-comentario" value={form.comentario} onChange={set('comentario')} rows={2} className={inputCls} style={inputStyle} placeholder="Opcional…" /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold border cursor-pointer" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'transparent' }}>Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.nombre.trim() || !form.importe} className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-violet-500/30 cursor-pointer" style={{ background: `linear-gradient(135deg,${ACCENT},#7c3aed)` }}>
            {saving ? 'Guardando…' : form.id ? 'Guardar' : 'Crear recurrente'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  scope: 'personal' | 'hogar';
  canEdit?: boolean;
}

export default function RecurrentesClient({ scope, canEdit = true }: Props) {
  const apiBase = scope === 'personal' ? '/api/personal/suscripciones' : '/api/hogar/recurrentes';
  const backHref = `/${scope}/modulos`;
  const isMobile = useIsMobile();
  const [items, setItems] = useState<Recurrente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<RecForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  async function fetchAll() {
    const data = await fetch(apiBase).then(r => r.json());
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchAll(); }, [apiBase]);

  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    const body = { ...modal, importe: Number(modal.importe), cobro: modal.cobro || null, comentario: modal.comentario || null };
    await fetch(modal.id ? `${apiBase}/${modal.id}` : apiBase, {
      method: modal.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false); setModal(null); fetchAll();
  }

  async function handleDelete(id: number) {
    await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
    setDeleteId(null); fetchAll();
  }

  const { sorted, sortKey, sortAsc, toggleSort } = useTableSort(items, SORT_RECURRENTES, { defaultKey: 'nombre', storageKey: `sort:${scope}-recurrentes` });

  const totalMensual = totalMensualRecurrentes(items);
  const totalAnual = totalMensual * 12;
  const openEdit = (r: Recurrente) => { if (canEdit) setModal(toForm(r)); };

  return (
    <div className="space-y-6">
      <BackToModulos href={backHref} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Recurrentes</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {scope === 'personal' ? 'Suscripciones y pagos con cobro periódico' : 'Pagos periódicos de la casa'}
            </p>
          </div>
          <InfoExpand title="¿Qué son los Recurrentes?">
            <p>
              Apunta aquí los pagos que se repiten cada mes, trimestre o año
              {scope === 'personal' ? ' (suscripciones, seguros, cuotas…)' : ' (seguros del hogar, comunidad, IBI, mantenimientos…)'}.
              En el Presupuesto aparecen como filas automáticas. Desde el botón de editar de esa fila eliges si se añaden al Mes
              como una sola línea con el total mensual (con redondeo opcional al múltiplo de 5 €) o desglosados, cada uno con su
              importe y fecha. Sus próximos cobros aparecen también en Avisos.
            </p>
          </InfoExpand>
        </div>
        {canEdit && (
          <button onClick={() => setModal(emptyForm())} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all shadow-lg shadow-violet-500/30 cursor-pointer min-h-[44px]" style={{ background: `linear-gradient(135deg,${ACCENT},#7c3aed)` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo recurrente
          </button>
        )}
      </div>

      {/* Summary cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
          <div className="glass-card rounded-2xl md:rounded-3xl p-3 md:p-5" style={{ background: `linear-gradient(135deg,${ACCENT},#7c3aed)` }}>
            <p className="text-[10px] md:text-xs font-semibold text-white/70 uppercase tracking-wide mb-0.5 md:mb-1">Coste mensual</p>
            <p className="text-lg md:text-2xl font-extrabold text-white leading-tight tabular-nums">{fmt(totalMensual)}</p>
          </div>
          <div className="glass-card rounded-2xl md:rounded-3xl p-3 md:p-5">
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wide mb-0.5 md:mb-1" style={{ color: 'var(--text-muted)' }}>Coste anual</p>
            <p className="text-lg md:text-2xl font-extrabold leading-tight tabular-nums" style={{ color: 'var(--text-primary)' }}>{fmt(totalAnual)}</p>
          </div>
          {(['mensual', 'trimestral', 'anual'] as const).map(p => (
            <div key={p} className="hidden md:block glass-card rounded-2xl md:rounded-3xl p-3 md:p-5">
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wide mb-0.5 md:mb-1" style={{ color: 'var(--text-muted)' }}>{PERIODICIDAD_LABEL[p]}es</p>
              <p className="text-lg md:text-2xl font-extrabold leading-tight tabular-nums" style={{ color: 'var(--text-primary)' }}>{items.filter(r => r.periodicidad === p).length}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
          ) : sorted.length === 0 ? (
            <p className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              {canEdit ? 'Sin recurrentes aún. ¡Añade el primero!' : 'Sin recurrentes aún.'}
            </p>
          ) : (
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--divider)' }}>
                  {(Object.keys(COL_LABELS) as SortKey[]).map(col => (
                    <SortableTh key={col} label={COL_LABELS[col]} sortKey={col} activeKey={sortKey} asc={sortAsc} onSort={toggleSort} className="text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }} />
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Comentario</th>
                  {canEdit && <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--divider)', cursor: isMobile && canEdit ? 'pointer' : undefined }}
                    onClick={() => { if (isMobile) openEdit(r); }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-page)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{r.nombre}</td>
                    <td className="px-4 py-3 font-mono font-bold tabular-nums" style={{ color: ACCENT }}>{fmt(r.importe)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: `color-mix(in srgb, ${PERIODICIDAD_COLOR[r.periodicidad]} 15%, transparent)`, color: PERIODICIDAD_COLOR[r.periodicidad] }}>
                        {PERIODICIDAD_LABEL[r.periodicidad]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>{fmtNextDate(r.cobro, r.periodicidad)}</td>
                    <td className="px-4 py-3 text-sm truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{r.comentario || '—'}</td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={e => { e.stopPropagation(); openEdit(r); }} aria-label={`Editar ${r.nombre}`} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}><PencilIcon /></button>
                          <button onClick={e => { e.stopPropagation(); setDeleteId(r.id); }} aria-label={`Eliminar ${r.nombre}`} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--color-error)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}><TrashIcon /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <RecurrenteModal form={modal} setForm={setModal} onClose={() => setModal(null)} onSave={handleSave} saving={saving}
          placeholder={scope === 'personal' ? 'Ej: Netflix' : 'Ej: Seguro del hogar'} />
      )}

      {deleteId !== null && (
        <ConfirmDialog message="¿Eliminar recurrente?" onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  );
}

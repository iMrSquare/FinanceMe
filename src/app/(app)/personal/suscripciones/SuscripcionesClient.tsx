'use client';
import { useEffect, useState } from 'react';
import { nextBillingDate } from '@/lib/billing';
import type { PersonalSuscripcion } from '@/lib/db';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import InfoExpand from '@/components/InfoExpand';
import { useIsMobile } from '@/lib/useIsMobile';

function PencilIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>;
}
function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
}

const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const fmtNextDate = (cobro: string | null, periodicidad: string) =>
  cobro ? nextBillingDate(cobro, periodicidad).toLocaleDateString('es-ES') : '—';

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50 border transition-colors appearance-none';
const inputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };

const PERIODICIDAD_LABEL: Record<PersonalSuscripcion['periodicidad'], string> = { mensual: 'Mensual', trimestral: 'Trimestral', anual: 'Anual' };
const PERIODICIDAD_COLOR: Record<PersonalSuscripcion['periodicidad'], string> = { mensual: '#8b5cf6', trimestral: '#0ea5e9', anual: '#f59e0b' };

type SortKey = 'nombre' | 'importe' | 'periodicidad' | 'cobro';
const COL_LABELS: Record<SortKey, string> = { nombre: 'Suscripción', importe: 'Importe', periodicidad: 'Periodicidad', cobro: 'Próximo cobro' };

interface SuscForm { id?: number; nombre: string; importe: string; cobro: string; periodicidad: 'mensual' | 'trimestral' | 'anual'; comentario: string; }
const emptyForm = (): SuscForm => ({ nombre: '', importe: '', cobro: '', periodicidad: 'mensual', comentario: '' });

function SuscModal({ form, setForm, onClose, onSave, saving }: { form: SuscForm; setForm: (f: SuscForm) => void; onClose: () => void; onSave: () => void; saving: boolean; }) {
  const set = (k: keyof SuscForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-card rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{form.id ? 'Editar suscripción' : 'Nueva suscripción'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: 'var(--text-muted)', background: 'var(--btn-hover)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nombre *</label>
            <input value={form.nombre} onChange={set('nombre')} className={inputCls} style={inputStyle} placeholder="Ej: Netflix" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Importe (€) *</label>
              <input type="number" step="0.01" min="0" value={form.importe} onChange={set('importe')} className={inputCls} style={inputStyle} placeholder="0.00" /></div>
            <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Periodicidad</label>
              <select value={form.periodicidad} onChange={set('periodicidad')} className={inputCls} style={inputStyle}>
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
              </select></div>
          </div>
          <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Fecha de cobro</label>
            <input type="date" value={form.cobro} onChange={set('cobro')} className={inputCls} style={inputStyle} /></div>
          <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Comentario</label>
            <textarea value={form.comentario} onChange={set('comentario')} rows={2} className={inputCls} style={inputStyle} placeholder="Opcional…" /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'transparent' }}>Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.nombre.trim() || !form.importe} className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-violet-500/30" style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
            {saving ? 'Guardando…' : form.id ? 'Guardar' : 'Crear suscripción'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuscripcionesClient() {
  const isMobile = useIsMobile();
  const [suscs, setSuscs] = useState<PersonalSuscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<SuscForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
  const [sortAsc, setSortAsc] = useState(true);

  async function fetchAll() {
    const data = await fetch('/api/personal/suscripciones').then(r => r.json());
    setSuscs(Array.isArray(data) ? data : []); setLoading(false);
  }
  useEffect(() => { fetchAll(); }, []);

  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    const body = { ...modal, importe: Number(modal.importe), cobro: modal.cobro || null, comentario: modal.comentario || null };
    if (modal.id) {
      await fetch(`/api/personal/suscripciones/${modal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/personal/suscripciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setSaving(false); setModal(null); fetchAll();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/personal/suscripciones/${id}`, { method: 'DELETE' });
    setDeleteId(null); fetchAll();
  }

  function toggleSort(k: SortKey) { if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(true); } }

  const sorted = [...suscs].sort((a, b) => {
    const va = String(a[sortKey as keyof PersonalSuscripcion] ?? '');
    const vb = String(b[sortKey as keyof PersonalSuscripcion] ?? '');
    return sortAsc ? va.localeCompare(vb, 'es') : vb.localeCompare(va, 'es');
  });

  const mensualEquivalente = (sub: PersonalSuscripcion) =>
    sub.periodicidad === 'anual' ? sub.importe / 12 : sub.periodicidad === 'trimestral' ? sub.importe / 3 : sub.importe;
  const totalMensual = suscs.reduce((s, sub) => s + mensualEquivalente(sub), 0);
  const totalAnual = totalMensual * 12;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Suscripciones</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Servicios con cobro recurrente</p>
          </div>
          <InfoExpand title="¿Qué son las Suscripciones?">
            <p>Apunta aquí tus suscripciones recurrentes (mensuales, trimestrales o anuales). Lo ideal es añadirlas después de crear tu Presupuesto, para tener una visión completa de tus gastos antes de ajustar tu objetivo de ahorro.</p>
          </InfoExpand>
        </div>
        <button onClick={() => setModal(emptyForm())} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all shadow-lg shadow-violet-500/30" style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva suscripción
        </button>
      </div>

      {/* Summary cards */}
      {suscs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
          <div className="glass-card rounded-2xl md:rounded-3xl p-3 md:p-5" style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
            <p className="text-[10px] md:text-xs font-semibold text-white/70 uppercase tracking-wide mb-0.5 md:mb-1">Coste mensual</p>
            <p className="text-lg md:text-2xl font-extrabold text-white leading-tight">{fmt(totalMensual)}</p>
          </div>
          <div className="glass-card rounded-2xl md:rounded-3xl p-3 md:p-5">
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wide mb-0.5 md:mb-1" style={{ color: 'var(--text-muted)' }}>Coste anual</p>
            <p className="text-lg md:text-2xl font-extrabold leading-tight" style={{ color: 'var(--text-primary)' }}>{fmt(totalAnual)}</p>
          </div>
          <div className="hidden md:block glass-card rounded-2xl md:rounded-3xl p-3 md:p-5">
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wide mb-0.5 md:mb-1" style={{ color: 'var(--text-muted)' }}>Mensuales</p>
            <p className="text-lg md:text-2xl font-extrabold leading-tight" style={{ color: 'var(--text-primary)' }}>{suscs.filter(s => s.periodicidad === 'mensual').length}</p>
          </div>
          <div className="hidden md:block glass-card rounded-2xl md:rounded-3xl p-3 md:p-5">
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wide mb-0.5 md:mb-1" style={{ color: 'var(--text-muted)' }}>Trimestrales</p>
            <p className="text-lg md:text-2xl font-extrabold leading-tight" style={{ color: 'var(--text-primary)' }}>{suscs.filter(s => s.periodicidad === 'trimestral').length}</p>
          </div>
          <div className="hidden md:block glass-card rounded-2xl md:rounded-3xl p-3 md:p-5">
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wide mb-0.5 md:mb-1" style={{ color: 'var(--text-muted)' }}>Anuales</p>
            <p className="text-lg md:text-2xl font-extrabold leading-tight" style={{ color: 'var(--text-primary)' }}>{suscs.filter(s => s.periodicidad === 'anual').length}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
          ) : sorted.length === 0 ? (
            <p className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Sin suscripciones aún. ¡Añade la primera!</p>
          ) : (
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--divider)' }}>
                  {(Object.keys(COL_LABELS) as SortKey[]).map(col => (
                    <th key={col} onClick={() => toggleSort(col)} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none" style={{ color: 'var(--text-muted)' }}>
                      {COL_LABELS[col]} {sortKey === col ? (sortAsc ? '↑' : '↓') : ''}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Comentario</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--divider)', cursor: isMobile ? 'pointer' : undefined }}
                    onClick={() => { if (isMobile) setModal({ id: s.id, nombre: s.nombre, importe: String(s.importe), cobro: s.cobro ?? '', periodicidad: s.periodicidad, comentario: s.comentario ?? '' }); }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-page)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{s.nombre}</td>
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: '#8b5cf6' }}>{fmt(s.importe)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: `${PERIODICIDAD_COLOR[s.periodicidad]}26`, color: PERIODICIDAD_COLOR[s.periodicidad] }}>
                        {PERIODICIDAD_LABEL[s.periodicidad]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{fmtNextDate(s.cobro, s.periodicidad)}</td>
                    <td className="px-4 py-3 text-sm truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{s.comentario || '—'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={e => { e.stopPropagation(); setModal({ id: s.id, nombre: s.nombre, importe: String(s.importe), cobro: s.cobro ?? '', periodicidad: s.periodicidad, comentario: s.comentario ?? '' }); }} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}><PencilIcon /></button>
                        <button onClick={e => { e.stopPropagation(); setDeleteId(s.id); }} className="p-1.5 rounded-lg transition-colors" style={{ color: '#ef4444' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && <SuscModal form={modal} setForm={setModal} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />}

      {deleteId !== null && (
        <ConfirmDialog
          message="¿Eliminar suscripción?"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';
import type { AhorroObjetivo } from '@/lib/db';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import InfoExpand from '@/components/InfoExpand';
import { useIsMobile } from '@/lib/useIsMobile';
import { MonthYearInput } from '@/components/MonthYearInput';
import { type EstadoObjetivo, estadoObjetivo, mensualNecesario, fmtMesAnio } from '@/lib/ahorroObjetivos';

const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 border transition-colors';
const inputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };

function PencilIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>;
}
function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
}

const ESTADO_LABEL: Record<EstadoObjetivo, string> = { completado: 'Completado', vencido: 'Vencido', en_progreso: 'En progreso' };
const ESTADO_COLOR: Record<EstadoObjetivo, string> = { completado: '#f59e0b', vencido: '#ef4444', en_progreso: '#64748b' };

interface ObjetivoForm { id?: number; nombre: string; objetivo: string; fecha_objetivo: string; }
const emptyForm = (): ObjetivoForm => ({ nombre: '', objetivo: '', fecha_objetivo: '' });

function ObjetivoModal({ form, setForm, onClose, onSave, saving }: {
  form: ObjetivoForm; setForm: (f: ObjetivoForm) => void;
  onClose: () => void; onSave: () => void; saving: boolean;
}) {
  const set = (k: keyof ObjetivoForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-card rounded-3xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{form.id ? 'Editar objetivo' : 'Nuevo objetivo'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: 'var(--text-muted)', background: 'var(--btn-hover)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nombre *</label>
            <input value={form.nombre} onChange={set('nombre')} className={inputCls} style={inputStyle} placeholder="Ej: Vacaciones" /></div>
          <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Importe objetivo (€) *</label>
            <input type="number" step="0.01" min="0" value={form.objetivo} onChange={set('objetivo')} className={inputCls} style={inputStyle} placeholder="0.00" /></div>
          <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Mes y año objetivo *</label>
            <MonthYearInput value={form.fecha_objetivo} onChange={v => setForm({ ...form, fecha_objetivo: v })} className={inputCls} style={inputStyle} /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'transparent' }}>Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.nombre.trim() || !form.objetivo || !form.fecha_objetivo} className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-amber-500/30" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            {saving ? 'Guardando…' : form.id ? 'Guardar' : 'Crear objetivo'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditableAportadoProps { value: number; onSave: (value: number) => Promise<void>; disabled?: boolean; }

function EditableAportado({ value, onSave, disabled }: EditableAportadoProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(String(value)); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  function handleBlur() {
    setEditing(false);
    const num = parseFloat(draft);
    if (!isNaN(num) && num !== value) onSave(num);
    else setDraft(String(value));
  }

  if (disabled) {
    return <span className="text-sm font-mono font-semibold" style={{ color: value > 0 ? '#f59e0b' : 'var(--text-muted)' }}>{value > 0 ? fmt(value) : '—'}</span>;
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number" step="0.01" min="0"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={e => { if (e.key === 'Enter') inputRef.current?.blur(); if (e.key === 'Escape') { setEditing(false); setDraft(String(value)); } }}
        className="w-28 rounded-xl px-2 py-1 text-sm text-right font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/50 border-2"
        style={{ background: 'var(--bg-page)', color: '#f59e0b', borderColor: '#f59e0b' }}
        autoFocus
        onClick={e => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      onClick={e => { e.stopPropagation(); setEditing(true); }}
      className="flex items-center gap-1.5 rounded-xl px-2 py-1 text-sm font-mono font-semibold border transition-all hover:border-amber-400/60"
      style={{ color: value > 0 ? '#f59e0b' : 'var(--text-muted)', borderColor: 'var(--btn-border)', background: 'var(--bg-page)' }}
      title="Clic para editar"
    >
      <span className="opacity-40"><PencilIcon /></span>
      <span>{value > 0 ? fmt(value) : '—'}</span>
    </button>
  );
}

interface Props { objetivos: AhorroObjetivo[]; canEdit: boolean; }

export default function ObjetivosHogarClient({ objetivos: initObjetivos, canEdit }: Props) {
  const isMobile = useIsMobile();
  const [objetivos, setObjetivos] = useState<AhorroObjetivo[]>(initObjetivos);
  const [modal, setModal] = useState<ObjetivoForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [verCompletados, setVerCompletados] = useState(false);

  async function fetchAll() {
    const data = await fetch('/api/ahorro/objetivos').then(r => r.json());
    setObjetivos(Array.isArray(data) ? data : []);
  }

  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    const body = { nombre: modal.nombre, objetivo: Number(modal.objetivo), fecha_objetivo: modal.fecha_objetivo };
    if (modal.id) {
      await fetch(`/api/ahorro/objetivos/${modal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/ahorro/objetivos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setSaving(false); setModal(null); fetchAll();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/ahorro/objetivos/${id}`, { method: 'DELETE' });
    setDeleteId(null); fetchAll();
  }

  async function handleSaveAportado(id: number, aportado: number) {
    await fetch(`/api/ahorro/objetivos/${id}/aportado`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aportado }) });
    fetchAll();
  }

  function openEdit(o: AhorroObjetivo) {
    setModal({ id: o.id, nombre: o.nombre, objetivo: String(o.objetivo), fecha_objetivo: o.fecha_objetivo.slice(0, 7) });
  }

  const completados = objetivos.filter(o => estadoObjetivo(o) === 'completado').length;
  const visibles = objetivos.filter(o => verCompletados || estadoObjetivo(o) !== 'completado');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Ahorro</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Objetivos de ahorro compartidos del hogar</p>
          </div>
          <InfoExpand title="¿Qué es Ahorro?">
            <p>Gestiona aquí los objetivos de ahorro del Hogar: define una meta, una fecha objetivo y registra las aportaciones realizadas.</p>
          </InfoExpand>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {completados > 0 && (
            <button onClick={() => setVerCompletados(v => !v)} className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {verCompletados ? 'Ocultar completados' : `Ver completados (${completados})`}
            </button>
          )}
          {canEdit && (
            <button onClick={() => setModal(emptyForm())} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white shadow-lg shadow-amber-500/30" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo objetivo
            </button>
          )}
        </div>
      </div>

      {objetivos.length === 0 ? (
        <p className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {canEdit ? 'Sin objetivos aún — pulsa "+ Nuevo objetivo" para crear el primero' : 'Sin objetivos de ahorro todavía'}
        </p>
      ) : visibles.length === 0 ? (
        <p className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Todos los objetivos están completados — pulsa &quot;Ver completados&quot; para verlos</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibles.map(o => {
            const estado = estadoObjetivo(o);
            const porcentaje = o.objetivo > 0 ? Math.min((o.aportado / o.objetivo) * 100, 100) : 0;
            const mensual = mensualNecesario(o);
            const pendiente = o.objetivo - o.aportado;
            return (
              <div
                key={o.id}
                className="glass-card rounded-3xl p-5"
                style={{ cursor: isMobile && canEdit ? 'pointer' : undefined }}
                onClick={() => { if (isMobile && canEdit) openEdit(o); }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{o.nombre}</h3>
                    <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>Objetivo: {fmtMesAnio(o.fecha_objetivo)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${ESTADO_COLOR[estado]}20`, color: ESTADO_COLOR[estado] }}>
                      {ESTADO_LABEL[estado]}
                    </span>
                    {canEdit && (
                      <>
                        <button onClick={e => { e.stopPropagation(); openEdit(o); }} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}><PencilIcon /></button>
                        <button onClick={e => { e.stopPropagation(); setDeleteId(o.id); }} className="p-1.5 rounded-lg transition-colors text-red-400"
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}><TrashIcon /></button>
                      </>
                    )}
                  </div>
                </div>

                <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--divider)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${porcentaje}%`, background: porcentaje >= 100 ? '#f59e0b' : porcentaje >= 50 ? '#f59e0b' : '#ef4444' }} />
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{porcentaje.toFixed(0)}% de {fmt(o.objetivo)}</span>
                  <EditableAportado value={o.aportado} onSave={v => handleSaveAportado(o.id, v)} disabled={!canEdit} />
                </div>

                {estado === 'completado' && (
                  <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>¡Objetivo conseguido!</p>
                )}
                {estado === 'vencido' && (
                  <p className="text-sm" style={{ color: '#ef4444' }}>Pendiente: <span className="font-bold">{fmt(pendiente)}</span></p>
                )}
                {estado === 'en_progreso' && mensual != null && (
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Aporta <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(mensual)}</span>/mes para conseguirlo</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && <ObjetivoModal form={modal} setForm={setModal} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />}

      {deleteId !== null && (
        <ConfirmDialog message="¿Eliminar objetivo?" onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  );
}

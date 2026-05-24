'use client';
import { useEffect, useState } from 'react';
import type { PersonalGastoFijo, PersonalCategoria, PersonalBanco } from '@/lib/db';
import { CircularColorPicker } from '@/components/ColorDots';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES') : '—';

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50 border transition-colors';
const inputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };


type SortKey = 'gasto' | 'importe' | 'categoria' | 'banco' | 'cobro' | 'vencimiento';
const COL_LABELS: Record<SortKey, string> = { gasto: 'Gasto', importe: 'Importe', categoria: 'Categoría', banco: 'Banco', cobro: 'Cobro', vencimiento: 'Vencimiento' };

interface GastoForm { id?: number; gasto: string; importe: string; categoria: string; banco: string; cobro: string; vencimiento: string; comentario: string; }
const emptyForm = (): GastoForm => ({ gasto: '', importe: '', categoria: '', banco: '', cobro: '', vencimiento: '', comentario: '' });

interface GestionItem { id?: number; nombre: string; color: string; }

function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
}

function PencilIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>;
}

// ── GestionModal ──────────────────────────────────────────────────────────

function GestionModal({ categorias, bancos, onClose, onChange }: { categorias: PersonalCategoria[]; bancos: PersonalBanco[]; onClose: () => void; onChange: () => void; }) {
  const [tab, setTab] = useState<'categorias' | 'bancos'>('categorias');
  const [newNombre, setNewNombre] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editColor, setEditColor] = useState('#6366f1');
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState<{ msg: string; fn: () => Promise<void> } | null>(null);

  const items = tab === 'categorias' ? categorias : bancos;
  const base = tab === 'categorias' ? '/api/personal/categorias' : '/api/personal/bancos';
  const label = tab === 'categorias' ? 'categoría' : 'banco';

  function startEdit(item: GestionItem) {
    setEditId(item.id!); setEditNombre(item.nombre); setEditColor(item.color);
  }

  async function saveEdit() {
    if (!editId) return;
    setSaving(true);
    await fetch(`${base}/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: editNombre, color: editColor }) });
    setEditId(null); setSaving(false); onChange();
  }

  async function addNew() {
    if (!newNombre.trim()) return;
    setSaving(true);
    await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: newNombre.trim(), color: newColor }) });
    setNewNombre(''); setSaving(false); onChange();
  }

  async function remove(id: number) {
    setConfirmState({ msg: `¿Eliminar esta ${label}?`, fn: async () => {
      await fetch(`${base}/${id}`, { method: 'DELETE' }); onChange();
    }});
  }

  return (
    <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-card rounded-3xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Gestionar</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-lg" style={{ color: 'var(--text-secondary)', background: 'var(--btn-hover)' }}>×</button>
        </div>

        {/* Tabs */}
        <div className="px-6 pb-4">
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--btn-hover)' }}>
            {(['categorias', 'bancos'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setEditId(null); }}
                className="flex-1 py-1.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: tab === t ? 'var(--bg-card)' : 'transparent', color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {t === 'categorias' ? 'Categorías' : 'Bancos'}
              </button>
            ))}
          </div>
        </div>

        {/* Items list */}
        <div className="px-6 space-y-2 max-h-64 overflow-y-auto">
          {items.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin {label}s aún</p>
          )}
          {items.map(item => (
            <div key={item.id} className="rounded-2xl p-3 space-y-2" style={{ border: '1px solid var(--divider)', background: 'var(--bg-page)' }}>
              {editId === item.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white shrink-0" style={{ background: editColor }}>{editNombre || '…'}</span>
                  <input value={editNombre} onChange={e => setEditNombre(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null); }}
                    className="flex-1 text-sm rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-400/50 border"
                    style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' }} autoFocus />
                  <CircularColorPicker value={editColor} onChange={setEditColor} />
                  <button onClick={saveEdit} disabled={saving || !editNombre.trim()} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                    {saving ? '…' : 'OK'}
                  </button>
                  <button onClick={() => setEditId(null)} className="px-2 py-1.5 rounded-xl text-xs font-medium border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)' }}>✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white shrink-0" style={{ background: item.color }}>{item.nombre}</span>
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.nombre}</span>
                  <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}><PencilIcon /></button>
                  <button onClick={() => remove(item.id!)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#ef4444' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}><TrashIcon /></button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Añadir {label}</p>
          <div className="flex items-center gap-2">
            <input value={newNombre} onChange={e => setNewNombre(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNew()}
              placeholder={`Nombre del ${label}…`}
              className="flex-1 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400/50 border"
              style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' }} />
            <CircularColorPicker value={newColor} onChange={setNewColor} />
            <button onClick={addNew} disabled={!newNombre.trim() || saving}
              className="px-4 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-40 shadow-lg shadow-red-500/30"
              style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
              +
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4" style={{ borderTop: '1px solid var(--divider)', marginTop: '12px' }}>
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold border-2 rounded-2xl"
            style={{ borderColor: 'var(--btn-border)', color: 'var(--text-secondary)' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
    {confirmState && (
      <ConfirmDialog
        message={confirmState.msg}
        onConfirm={async () => { await confirmState.fn(); setConfirmState(null); }}
        onCancel={() => setConfirmState(null)}
      />
    )}
    </>
  );
}

// ── GastoModal ────────────────────────────────────────────────────────────
function GastoModal({ form, setForm, categorias, bancos, onClose, onSave, saving }: {
  form: GastoForm; setForm: (f: GastoForm) => void;
  categorias: PersonalCategoria[]; bancos: PersonalBanco[];
  onClose: () => void; onSave: () => void; saving: boolean;
}) {
  const set = (k: keyof GastoForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-card rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{form.id ? 'Editar gasto' : 'Nuevo gasto'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: 'var(--text-muted)', background: 'var(--btn-hover)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Concepto *</label>
            <input value={form.gasto} onChange={set('gasto')} className={inputCls} style={inputStyle} placeholder="Ej: Hipoteca" /></div>
          <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Importe (€) *</label>
            <input type="number" step="0.01" min="0" value={form.importe} onChange={set('importe')} className={inputCls} style={inputStyle} placeholder="0.00" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Categoría</label>
              <select value={form.categoria} onChange={set('categoria')} className={inputCls} style={inputStyle}>
                <option value="">Sin categoría</option>
                {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select></div>
            <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Banco</label>
              <select value={form.banco} onChange={set('banco')} className={inputCls} style={inputStyle}>
                <option value="">Sin banco</option>
                {bancos.map(b => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Fecha cobro</label>
              <input type="date" value={form.cobro} onChange={set('cobro')} className={inputCls} style={inputStyle} /></div>
            <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Vencimiento</label>
              <input type="date" value={form.vencimiento} onChange={set('vencimiento')} className={inputCls} style={inputStyle} /></div>
          </div>
          <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Comentario</label>
            <textarea value={form.comentario} onChange={set('comentario')} rows={2} className={inputCls} style={inputStyle} placeholder="Opcional…" /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'transparent' }}>Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.gasto.trim() || !form.importe} className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-red-500/30" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
            {saving ? 'Guardando…' : form.id ? 'Guardar' : 'Crear gasto'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function PresupuestoClient() {
  const [gastos, setGastos] = useState<PersonalGastoFijo[]>([]);
  const [categorias, setCategorias] = useState<PersonalCategoria[]>([]);
  const [bancos, setBancos] = useState<PersonalBanco[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<GastoForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [showGestion, setShowGestion] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroBanco, setFiltroBanco] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('gasto');
  const [sortAsc, setSortAsc] = useState(true);

  async function fetchAll() {
    const [g, c, b] = await Promise.all([
      fetch('/api/personal/gastos').then(r => r.json()),
      fetch('/api/personal/categorias').then(r => r.json()),
      fetch('/api/personal/bancos').then(r => r.json()),
    ]);
    setGastos(Array.isArray(g) ? g : []); setCategorias(Array.isArray(c) ? c : []); setBancos(Array.isArray(b) ? b : []); setLoading(false);
  }
  useEffect(() => { fetchAll(); }, []);

  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    const body = { ...modal, importe: Number(modal.importe), categoria: modal.categoria || null, banco: modal.banco || null, cobro: modal.cobro || null, vencimiento: modal.vencimiento || null, comentario: modal.comentario || null };
    if (modal.id) {
      await fetch(`/api/personal/gastos/${modal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/personal/gastos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setSaving(false); setModal(null); fetchAll();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/personal/gastos/${id}`, { method: 'DELETE' });
    setDeleteId(null); fetchAll();
  }

  function toggleSort(k: SortKey) { if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(true); } }

  const catColor = (n: string) => categorias.find(c => c.nombre === n)?.color ?? '#64748b';
  const bancoColor = (n: string) => bancos.find(b => b.nombre === n)?.color ?? '#64748b';

  const filtered = gastos
    .filter(g => !filtroCategoria || g.categoria === filtroCategoria)
    .filter(g => !filtroBanco || g.banco === filtroBanco)
    .sort((a, b) => {
      const cmp = String(a[sortKey as keyof PersonalGastoFijo] ?? '').localeCompare(String(b[sortKey as keyof PersonalGastoFijo] ?? ''), 'es');
      return sortAsc ? cmp : -cmp;
    });

  const totalGeneral = gastos.reduce((s, g) => s + g.importe, 0);
  const totalFiltrado = filtered.reduce((s, g) => s + g.importe, 0);
  const porCategoria = gastos.reduce<Record<string, number>>((acc, g) => {
    const cat = g.categoria ?? 'Sin categoría';
    acc[cat] = (acc[cat] ?? 0) + g.importe;
    return acc;
  }, {});

  const selectStyle = { ...inputStyle, paddingTop: '8px', paddingBottom: '8px' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Presupuesto</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Tus gastos fijos mensuales</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGestion(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-colors" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'var(--bg-card)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Gestionar
          </button>
          <button onClick={() => setModal(emptyForm())} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all shadow-lg shadow-red-500/30" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo gasto
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {gastos.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          <div className="flex-1 glass-card rounded-2xl px-5 py-4" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-1 whitespace-nowrap">Total mensual</p>
            <p className="text-2xl font-extrabold text-white whitespace-nowrap">{fmt(totalGeneral)}</p>
          </div>
          {Object.entries(porCategoria).map(([cat, imp]) => (
            <div key={cat} className="shrink-0 glass-card rounded-2xl px-4 py-4 min-w-[130px]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: catColor(cat) }} />
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>{cat}</p>
              </div>
              <p className="text-xl font-extrabold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{fmt(imp)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className={inputCls.replace('w-full', 'w-auto')} style={selectStyle}>
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </select>
        <select value={filtroBanco} onChange={e => setFiltroBanco(e.target.value)} className={inputCls.replace('w-full', 'w-auto')} style={selectStyle}>
          <option value="">Todos los bancos</option>
          {bancos.map(b => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
        </select>
        {(filtroCategoria || filtroBanco) && (
          <>
            <button onClick={() => { setFiltroCategoria(''); setFiltroBanco(''); }} className="px-3 py-2 rounded-xl text-sm font-medium border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)' }}>✕ Limpiar</button>
            <div className="ml-auto flex items-center gap-3 px-4 py-2 rounded-2xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="text-sm font-medium" style={{ color: '#ef4444' }}>{filtered.length} de {gastos.length}</span>
              <span className="text-base font-extrabold" style={{ color: '#ef4444' }}>{fmt(totalFiltrado)}</span>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>{gastos.length === 0 ? 'Sin gastos aún. ¡Añade el primero!' : 'Ningún gasto coincide con los filtros.'}</p>
          ) : (
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--divider)' }}>
                  {(Object.keys(COL_LABELS) as SortKey[]).map(col => (
                    <th key={col} onClick={() => toggleSort(col)} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none" style={{ color: 'var(--text-muted)' }}>
                      {COL_LABELS[col]} {sortKey === col ? (sortAsc ? '↑' : '↓') : ''}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid var(--divider)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-page)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <td className="px-4 py-3">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{g.gasto}</span>
                      {g.comentario && <p className="text-xs truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{g.comentario}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: '#ef4444' }}>{fmt(g.importe)}</td>
                    <td className="px-4 py-3">
                      {g.categoria ? <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: catColor(g.categoria) }}>{g.categoria}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {g.banco ? <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: bancoColor(g.banco) }}>{g.banco}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{fmtDate(g.cobro)}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{fmtDate(g.vencimiento)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal({ id: g.id, gasto: g.gasto, importe: String(g.importe), categoria: g.categoria ?? '', banco: g.banco ?? '', cobro: g.cobro ?? '', vencimiento: g.vencimiento ?? '', comentario: g.comentario ?? '' })} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}><PencilIcon /></button>
                        <button onClick={() => setDeleteId(g.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#ef4444' }}
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

      {modal && <GastoModal form={modal} setForm={setModal} categorias={categorias} bancos={bancos} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />}
      {showGestion && <GestionModal categorias={categorias} bancos={bancos} onClose={() => setShowGestion(false)} onChange={fetchAll} />}

      {deleteId !== null && (
        <ConfirmDialog
          message="¿Eliminar gasto?"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

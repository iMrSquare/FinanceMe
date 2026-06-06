'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Fijo, Categoria } from '@/lib/db';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PencilIcon, TrashIcon, SettingsIcon } from '@/components/icons';
import GestionHogarClient from '../gestion/GestionHogarClient';

const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 border transition-colors appearance-none';
const inputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };
const selectStyle = { ...inputStyle, paddingTop: '8px', paddingBottom: '8px' };

type TipoFijo = 'gasto' | 'ingreso';
type SortKey = 'gasto' | 'importe' | 'cobro' | 'vencimiento';

interface FijoForm {
  id?: number;
  tipo: TipoFijo;
  gasto: string;
  categoria: string;
  banco: string;
  importe: string;
  cobro: string;
  vencimiento: string;
  comentario: string;
}

function emptyGasto(): FijoForm  { return { tipo: 'gasto',   gasto: '', categoria: '', banco: '', importe: '', cobro: '', vencimiento: '', comentario: '' }; }
function emptyIngreso(): FijoForm { return { tipo: 'ingreso', gasto: '', categoria: '', banco: '', importe: '', cobro: '', vencimiento: '', comentario: '' }; }

function CategoryBadge({ nombre, categorias }: { nombre: string | null; categorias: Categoria[] }) {
  if (!nombre) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const cat = categorias.find(c => c.nombre === nombre);
  const bg = cat?.color ?? '#64748b';
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: bg }}>{nombre}</span>;
}

// ── Modal añadir / editar fijo ───────────────────────────────────────────────
function FijoModal({ form, setForm, catGasto, catPrestamo, onClose, onSave, saving }: {
  form: FijoForm; setForm: (f: FijoForm) => void;
  catGasto: Categoria[]; catPrestamo: Categoria[];
  onClose: () => void; onSave: () => void; saving: boolean;
}) {
  const set = (k: keyof FijoForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const isEditing = !!form.id;
  const isIngreso = form.tipo === 'ingreso';
  const title = isEditing
    ? (isIngreso ? 'Editar ingreso' : 'Editar gasto fijo')
    : (isIngreso ? 'Nuevo ingreso' : 'Nuevo gasto fijo');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-card rounded-3xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: 'var(--text-muted)', background: 'var(--btn-hover)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {isIngreso ? 'Concepto' : 'Gasto'} *
            </label>
            <input value={form.gasto} onChange={set('gasto')} className={inputCls} style={inputStyle} placeholder={isIngreso ? 'Ej: Nómina' : 'Ej: Hipoteca'} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Importe (€) *</label>
            <input type="number" step="0.01" min="0" value={form.importe} onChange={set('importe')} className={inputCls} style={inputStyle} placeholder="0.00" />
          </div>
          {!isIngreso && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {catGasto.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Categoría</label>
                    <select value={form.categoria} onChange={set('categoria')} className={inputCls} style={inputStyle}>
                      <option value="">Sin categoría</option>
                      {catGasto.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                    </select>
                  </div>
                )}
                {catPrestamo.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Banco</label>
                    <select value={form.banco} onChange={set('banco')} className={inputCls} style={inputStyle}>
                      <option value="">Sin banco</option>
                      {catPrestamo.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Día de cobro</label>
                  <input type="number" min="1" max="31" value={form.cobro} onChange={set('cobro')} className={inputCls} style={inputStyle} placeholder="Ej: 15" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Vencimiento</label>
                  <input type="date" value={form.vencimiento} onChange={set('vencimiento')} className={inputCls} style={inputStyle} />
                </div>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Comentario</label>
            <input value={form.comentario} onChange={set('comentario')} className={inputCls} style={inputStyle} placeholder="Opcional…" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'transparent' }}>Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.gasto.trim() || !form.importe} className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 shadow-lg shadow-indigo-500/30" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
            {saving ? 'Guardando…' : isEditing ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Helpers de cabecera de tabla ─────────────────────────────────────────────
function SortTh({ label, sk, sortKey, sortAsc, onClick }: {
  label: string; sk: SortKey; sortKey: SortKey; sortAsc: boolean; onClick: () => void;
}) {
  return (
    <th onClick={onClick} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none" style={{ color: 'var(--text-muted)' }}>
      {label} {sortKey === sk ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );
}

function PlainTh({ label }: { label: string }) {
  return <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</th>;
}

// ── Componente principal ─────────────────────────────────────────────────────
interface Props {
  gastosFijos: Fijo[];
  ingresosFijos: Fijo[];
  catGasto: Categoria[];
  catPrestamo: Categoria[];
  canEdit: boolean;
}

export default function PresupuestoHogarClient({
  gastosFijos: initGastos,
  ingresosFijos: initIngresos,
  catGasto: initCatGasto,
  catPrestamo: initCatPrestamo,
  canEdit,
}: Props) {
  const router = useRouter();
  const [gastos, setGastos] = useState<Fijo[]>(initGastos);
  const [ingresos, setIngresos] = useState<Fijo[]>(initIngresos);
  const [catGasto, setCatGasto] = useState<Categoria[]>(initCatGasto);
  const [catPrestamo, setCatPrestamo] = useState<Categoria[]>(initCatPrestamo);
  const [view, setView] = useState<'main' | 'gestion'>('main');
  const [modal, setModal] = useState<FijoForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('gasto');
  const [sortAsc, setSortAsc] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroBanco, setFiltroBanco] = useState('');

  function toggleSort(k: SortKey) { if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(true); } }

  const catNames   = [...new Set(gastos.map(f => f.categoria).filter(Boolean))] as string[];
  const bancoNames = [...new Set(gastos.map(f => f.banco).filter(Boolean))] as string[];

  const gastosFiltered = gastos
    .filter(f => !filtroCategoria || f.categoria === filtroCategoria)
    .filter(f => !filtroBanco || f.banco === filtroBanco)
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'importe')          cmp = a.importe - b.importe;
      else if (sortKey === 'cobro')       cmp = (Number(a.cobro ?? 0)) - (Number(b.cobro ?? 0));
      else if (sortKey === 'vencimiento') cmp = (a.vencimiento ?? '').localeCompare(b.vencimiento ?? '', 'es');
      else                                cmp = (a.gasto ?? '').localeCompare(b.gasto ?? '', 'es');
      return sortAsc ? cmp : -cmp;
    });

  const totalGastos   = gastos.reduce((s, f) => s + f.importe, 0);
  const totalIngresos = ingresos.reduce((s, f) => s + f.importe, 0);
  const totalFiltrado = gastosFiltered.reduce((s, f) => s + f.importe, 0);

  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    const body = {
      tipo: modal.tipo,
      gasto: modal.gasto,
      categoria: modal.tipo === 'gasto' ? (modal.categoria || null) : null,
      banco: modal.tipo === 'gasto' ? (modal.banco || null) : null,
      importe: Number(modal.importe),
      cobro: modal.cobro || null,
      vencimiento: modal.vencimiento || null,
      comentario: modal.comentario || null,
    };
    const setter = modal.tipo === 'gasto' ? setGastos : setIngresos;
    if (modal.id) {
      await fetch(`/api/fijos/${modal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setter(prev => prev.map(f => f.id === modal.id ? { ...f, ...body, id: modal.id! } : f));
    } else {
      const res = await fetch('/api/fijos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const created = await res.json();
      setter(prev => [...prev, created]);
    }
    setSaving(false); setModal(null); router.refresh();
  }

  async function handleDelete(id: number) {
    const isGasto = gastos.some(f => f.id === id);
    await fetch(`/api/fijos/${id}`, { method: 'DELETE' });
    if (isGasto) setGastos(prev => prev.filter(f => f.id !== id));
    else setIngresos(prev => prev.filter(f => f.id !== id));
    setDeleteId(null);
  }

  function openEdit(f: Fijo) {
    setModal({
      id: f.id,
      tipo: f.tipo as TipoFijo,
      gasto: f.gasto,
      categoria: f.categoria ?? '',
      banco: f.banco ?? '',
      importe: String(f.importe),
      cobro: f.cobro ?? '',
      vencimiento: f.vencimiento ?? '',
      comentario: f.comentario ?? '',
    });
  }

  if (view === 'gestion') {
    return (
      <div className="space-y-6">
        <button onClick={() => setView('main')} className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl border transition-colors" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'var(--bg-card)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver a Presupuesto
        </button>
        <GestionHogarClient />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Presupuesto</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Entradas fijas que se importan al crear un nuevo mes</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => setView('gestion')} className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-sm font-semibold border transition-colors shrink-0" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'var(--bg-card)' }}>
            <SettingsIcon className="w-4 h-4" /> <span className="hidden sm:inline">Gestión</span>
          </button>
          {canEdit && (
            <button onClick={() => setModal(emptyGasto())} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white shadow-lg shadow-indigo-500/30" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo Gasto
            </button>
          )}
        </div>
      </div>

      {/* ── Cards de resumen ── */}
      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <div className="glass-card rounded-2xl md:rounded-3xl p-3 md:p-6">
          <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wide mb-1 md:mb-2" style={{ color: '#f97316' }}>Gastos fijos</p>
          <p className="text-sm md:text-3xl font-extrabold leading-tight" style={{ color: totalGastos > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{totalGastos > 0 ? fmt(totalGastos) : '—'}</p>
          <p className="hidden md:block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{gastos.length} concepto{gastos.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="glass-card rounded-2xl md:rounded-3xl p-3 md:p-6">
          <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wide mb-1 md:mb-2" style={{ color: '#10b981' }}>Ingresos</p>
          <p className="text-sm md:text-3xl font-extrabold leading-tight" style={{ color: totalIngresos > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{totalIngresos > 0 ? fmt(totalIngresos) : '—'}</p>
          <p className="hidden md:block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{ingresos.length} entrada{ingresos.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="flex gap-2 flex-wrap items-center">
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className={inputCls.replace('w-full', 'w-auto')} style={selectStyle}>
          <option value="">Todas las categorías</option>
          {catNames.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filtroBanco} onChange={e => setFiltroBanco(e.target.value)} className={inputCls.replace('w-full', 'w-auto')} style={selectStyle}>
          <option value="">Todos los bancos</option>
          {bancoNames.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        {(filtroCategoria || filtroBanco) && (
          <>
            <button onClick={() => { setFiltroCategoria(''); setFiltroBanco(''); }} className="px-3 py-2 rounded-xl text-sm font-medium border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)' }}>✕ Limpiar</button>
            <div className="ml-auto flex items-center gap-3 px-4 py-2 rounded-2xl" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <span className="text-sm font-medium" style={{ color: '#6366f1' }}>{gastosFiltered.length} de {gastos.length}</span>
              <span className="text-base font-extrabold" style={{ color: '#6366f1' }}>{fmt(totalFiltrado)}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Tabla de gastos fijos ── */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
          <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            Gastos fijos
            <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-muted)' }}>{gastos.length} concepto{gastos.length !== 1 ? 's' : ''}</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          {gastosFiltered.length === 0 ? (
            <p className="py-14 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              {gastos.length === 0 ? 'Sin gastos fijos — pulsa "+ Nuevo" para añadir' : 'Ningún gasto coincide con el filtro.'}
            </p>
          ) : (
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--divider)' }}>
                  <SortTh label="Gasto"       sk="gasto"       sortKey={sortKey} sortAsc={sortAsc} onClick={() => toggleSort('gasto')} />
                  <SortTh label="Importe"     sk="importe"     sortKey={sortKey} sortAsc={sortAsc} onClick={() => toggleSort('importe')} />
                  <PlainTh label="Categoría" />
                  <PlainTh label="Banco" />
                  <SortTh label="Cobro"       sk="cobro"       sortKey={sortKey} sortAsc={sortAsc} onClick={() => toggleSort('cobro')} />
                  <SortTh label="Vencimiento" sk="vencimiento" sortKey={sortKey} sortAsc={sortAsc} onClick={() => toggleSort('vencimiento')} />
                  {canEdit && <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {gastosFiltered.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--divider)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-page)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <td className="px-4 py-3">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{f.gasto}</span>
                      {f.comentario && <p className="text-xs truncate max-w-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{f.comentario}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: '#ef4444' }}>-{fmt(f.importe)}</td>
                    <td className="px-4 py-3"><CategoryBadge nombre={f.categoria} categorias={catGasto} /></td>
                    <td className="px-4 py-3"><CategoryBadge nombre={f.banco} categorias={catPrestamo} /></td>
                    <td className="px-4 py-3 text-sm" style={{ color: f.cobro ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {f.cobro ? `Día ${f.cobro}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: f.vencimiento ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {f.vencimiento ?? '—'}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}><PencilIcon /></button>
                          <button onClick={() => setDeleteId(f.id)} className="p-1.5 rounded-lg transition-colors text-red-400"
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

      {/* ── Tabla de ingresos ── */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
          <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            Ingresos
            <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-muted)' }}>{ingresos.length} entrada{ingresos.length !== 1 ? 's' : ''}</span>
          </h2>
          {canEdit && (
            <button onClick={() => setModal(emptyIngreso())} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          {ingresos.length === 0 ? (
            <p className="py-14 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Sin ingresos — pulsa "+ Nuevo" para añadir</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--divider)' }}>
                  <PlainTh label="Concepto" />
                  <PlainTh label="Importe" />
                  {canEdit && <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {ingresos.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--divider)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-page)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <td className="px-4 py-3">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{f.gasto}</span>
                      {f.comentario && <p className="text-xs truncate max-w-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{f.comentario}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: '#10b981' }}>{fmt(f.importe)}</td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}><PencilIcon /></button>
                          <button onClick={() => setDeleteId(f.id)} className="p-1.5 rounded-lg transition-colors text-red-400"
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
        <FijoModal
          form={modal} setForm={setModal}
          catGasto={catGasto} catPrestamo={catPrestamo}
          onClose={() => setModal(null)} onSave={handleSave} saving={saving}
        />
      )}

      {deleteId !== null && (
        <ConfirmDialog message="¿Eliminar esta entrada fija?" onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />
      )}

    </div>
  );
}

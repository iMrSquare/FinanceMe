'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PersonalGastoFijo, PersonalCategoria, PersonalBanco, PersonalAhorro, PersonalSuscripcion, PresupuestoAutoConfig } from '@/lib/db';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import GestionClient from '../gestion/GestionClient';

function roundUp5(n: number): number {
  return Math.ceil(n / 5) * 5;
}

const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES') : '—';

function fmtCobro(c: string | null): string {
  if (!c) return '—';
  const n = parseInt(c);
  if (!isNaN(n) && n >= 1 && n <= 31) return `Día ${n}`;
  const d = new Date(c);
  return isNaN(d.getTime()) ? c : `Día ${d.getDate()}`;
}

function extractDay(c: string | null): string {
  if (!c) return '';
  const n = parseInt(c);
  if (!isNaN(n) && n >= 1 && n <= 31) return String(n);
  const d = new Date(c);
  return isNaN(d.getTime()) ? '' : String(d.getDate());
}

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50 border transition-colors appearance-none';
const inputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };


type SortKey = 'gasto' | 'importe' | 'categoria' | 'banco' | 'cobro' | 'vencimiento';
const COL_LABELS: Record<SortKey, string> = { gasto: 'Gasto', importe: 'Importe', categoria: 'Categoría', banco: 'Banco', cobro: 'Cobro', vencimiento: 'Vencimiento' };

interface GastoForm { id?: number; gasto: string; importe: string; categoria: string; banco: string; cobro: string; vencimiento: string; comentario: string; }
const emptyForm = (): GastoForm => ({ gasto: '', importe: '', categoria: '', banco: '', cobro: '', vencimiento: '', comentario: '' });

function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
}

function PencilIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>;
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
            <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Día de cobro</label>
              <input type="number" min="1" max="31" placeholder="Ej: 15" value={form.cobro} onChange={set('cobro')} className={inputCls} style={inputStyle} /></div>
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
  const [suscs, setSuscs] = useState<PersonalSuscripcion[]>([]);
  const [ahorro, setAhorro] = useState<PersonalAhorro | null>(null);
  const [autoConfigs, setAutoConfigs] = useState<PresupuestoAutoConfig[]>([]);
  const [editingAuto, setEditingAuto] = useState<'suscripciones' | 'ahorro' | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<GastoForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroBanco, setFiltroBanco] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('gasto');
  const [sortAsc, setSortAsc] = useState(true);
  const [view, setView] = useState<'main' | 'gestion'>('main');

  async function fetchAll() {
    const [g, c, b, s, a, ac] = await Promise.all([
      fetch('/api/personal/gastos').then(r => r.json()),
      fetch('/api/personal/categorias').then(r => r.json()),
      fetch('/api/personal/bancos').then(r => r.json()),
      fetch('/api/personal/suscripciones').then(r => r.json()),
      fetch(`/api/personal/ahorro?year=${new Date().getFullYear()}`).then(r => r.json()),
      fetch('/api/personal/presupuesto/auto').then(r => r.json()),
    ]);
    setGastos(Array.isArray(g) ? g : []);
    setCategorias(Array.isArray(c) ? c : []);
    setBancos(Array.isArray(b) ? b : []);
    setSuscs(Array.isArray(s) ? s : []);
    setAhorro(a && typeof a === 'object' && 'objetivo_anual' in a ? a : null);
    setAutoConfigs(Array.isArray(ac) ? ac : []);
    setLoading(false);
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
  const autoConfig = (tipo: 'suscripciones' | 'ahorro') => autoConfigs.find(c => c.tipo === tipo) ?? { tipo, banco: null, categoria: null };

  const filtered = gastos
    .filter(g => !filtroCategoria || g.categoria === filtroCategoria)
    .filter(g => !filtroBanco || g.banco === filtroBanco)
    .sort((a, b) => {
      const cmp = String(a[sortKey as keyof PersonalGastoFijo] ?? '').localeCompare(String(b[sortKey as keyof PersonalGastoFijo] ?? ''), 'es');
      return sortAsc ? cmp : -cmp;
    });

  const totalGeneral = gastos.reduce((s, g) => s + g.importe, 0);
  const totalFiltrado = filtered.reduce((s, g) => s + g.importe, 0);

  const suscMensualReal = suscs.reduce((s, sub) => s + (sub.periodicidad === 'anual' ? sub.importe / 12 : sub.importe), 0);
  const suscVirtual = suscMensualReal > 0 ? roundUp5(suscMensualReal) : 0;
  const ahorroMensualReal = ahorro ? ahorro.objetivo_anual / 12 : 0;
  const ahorroVirtual = ahorroMensualReal > 0 ? ahorroMensualReal : 0;
  const totalConVirtuales = totalGeneral + suscVirtual + ahorroVirtual;

  const suscCfg  = autoConfig('suscripciones');
  const ahorroCfg = autoConfig('ahorro');

  const suscMatchesFiltro  = (!filtroCategoria || suscCfg.categoria  === filtroCategoria) && (!filtroBanco || suscCfg.banco  === filtroBanco);
  const ahorroMatchesFiltro = (!filtroCategoria || ahorroCfg.categoria === filtroCategoria) && (!filtroBanco || ahorroCfg.banco === filtroBanco);

  const totalFiltradoConVirtuales = totalFiltrado
    + (suscVirtual  > 0 && suscMatchesFiltro  ? suscVirtual  : 0)
    + (ahorroVirtual > 0 && ahorroMatchesFiltro ? ahorroVirtual : 0);

  const selectStyle = { ...inputStyle, paddingTop: '8px', paddingBottom: '8px' };

  if (view === 'gestion') {
    return (
      <div className="space-y-6">
        <button onClick={() => setView('main')} className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl border transition-colors" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'var(--bg-card)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver a Presupuesto
        </button>
        <GestionClient />
      </div>
    );
  }

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
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => setView('gestion')} className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-sm font-semibold border transition-colors" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'var(--bg-card)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span className="hidden sm:inline">Gestión</span>
          </button>
          <button onClick={() => setModal(emptyForm())} className="flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all shadow-lg shadow-red-500/30" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo gasto
          </button>
        </div>
      </div>

      {/* 3 cards principales */}
      {(gastos.length > 0 || suscVirtual > 0 || ahorroVirtual > 0) && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* Total mensual */}
          <div className="rounded-2xl sm:rounded-3xl p-3 sm:p-6 text-white shadow-2xl shadow-red-500/20" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
            <p className="text-[10px] sm:text-xs font-semibold text-white/70 uppercase tracking-wide mb-1 sm:mb-2">Total</p>
            <p className="text-sm sm:text-3xl font-extrabold leading-tight">{fmt(totalConVirtuales)}</p>
            {(suscVirtual > 0 || ahorroVirtual > 0) && (
              <p className="hidden sm:block text-xs text-white/60 mt-1">{fmt(totalGeneral)} fijos + {fmt(suscVirtual + ahorroVirtual)} auto</p>
            )}
          </div>
          {/* Suscripciones */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide" style={{ color: '#8b5cf6' }}>
                <span className="sm:hidden">Suscs.</span>
                <span className="hidden sm:inline">Suscripciones</span>
              </p>
              <Link href="/personal/suscripciones" className="hidden sm:inline text-xs font-semibold" style={{ color: '#8b5cf6' }}>Ver →</Link>
            </div>
            <p className="text-sm sm:text-3xl font-extrabold leading-tight" style={{ color: suscVirtual > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {suscVirtual > 0 ? fmt(suscVirtual) : '—'}
            </p>
            {suscVirtual > 0 && (
              <p className="hidden sm:block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Real {fmt(suscMensualReal)} → redondeado</p>
            )}
          </div>
          {/* Ahorro mensual */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide" style={{ color: '#f59e0b' }}>
                <span className="sm:hidden">Ahorro</span>
                <span className="hidden sm:inline">Ahorro mensual</span>
              </p>
              <Link href="/personal/ahorro" className="hidden sm:inline text-xs font-semibold" style={{ color: '#f59e0b' }}>Ver →</Link>
            </div>
            <p className="text-sm sm:text-3xl font-extrabold leading-tight" style={{ color: ahorroVirtual > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {ahorroVirtual > 0 ? fmt(ahorroVirtual) : '—'}
            </p>
            {ahorroVirtual > 0 && ahorro && (
              <p className="hidden sm:block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{fmt(ahorro.objetivo_anual)}/año ÷ 12 = {fmt(ahorroVirtual)}</p>
            )}
          </div>
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
              <span className="text-base font-extrabold" style={{ color: '#ef4444' }}>{fmt(totalFiltradoConVirtuales)}</span>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          {(() => {
            const hasVisibleRows = filtered.length > 0
              || (suscVirtual > 0 && suscMatchesFiltro)
              || (ahorroVirtual > 0 && ahorroMatchesFiltro);
            return loading ? (
              <p className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
            ) : !hasVisibleRows ? (
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
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{fmtCobro(g.cobro)}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{fmtDate(g.vencimiento)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal({ id: g.id, gasto: g.gasto, importe: String(g.importe), categoria: g.categoria ?? '', banco: g.banco ?? '', cobro: extractDay(g.cobro), vencimiento: g.vencimiento ?? '', comentario: g.comentario ?? '' })} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}><PencilIcon /></button>
                        <button onClick={() => setDeleteId(g.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#ef4444' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Fila virtual: Suscripciones */}
                {suscVirtual > 0 && suscMatchesFiltro && (() => {
                  const cfg = suscCfg;
                  return (
                    <tr style={{ borderBottom: '1px solid var(--divider)', background: 'rgba(139,92,246,0.04)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Suscripciones</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>Auto</span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{fmt(suscMensualReal)}/mes real → redondeado al alza</p>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold" style={{ color: '#8b5cf6' }}>{fmt(suscVirtual)}</td>
                      <td className="px-4 py-3">
                        {cfg.categoria
                          ? <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: catColor(cfg.categoria) }}>{cfg.categoria}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {cfg.banco
                          ? <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: bancoColor(cfg.banco) }}>{cfg.banco}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="px-4 py-3" colSpan={2} />
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditingAuto('suscripciones')} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}><PencilIcon /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })()}

                {/* Fila virtual: Ahorro */}
                {ahorroVirtual > 0 && ahorroMatchesFiltro && (() => {
                  const cfg = ahorroCfg;
                  return (
                    <tr style={{ background: 'rgba(245,158,11,0.04)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Ahorro mensual</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>Auto</span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{fmt(ahorro!.objetivo_anual)}/año ÷ 12</p>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold" style={{ color: '#f59e0b' }}>{fmt(ahorroVirtual)}</td>
                      <td className="px-4 py-3">
                        {cfg.categoria
                          ? <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: catColor(cfg.categoria) }}>{cfg.categoria}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {cfg.banco
                          ? <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: bancoColor(cfg.banco) }}>{cfg.banco}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="px-4 py-3" colSpan={2} />
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditingAuto('ahorro')} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}><PencilIcon /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
            );
          })()}
        </div>
      </div>

      {modal && <GastoModal form={modal} setForm={setModal} categorias={categorias} bancos={bancos} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />}
      {editingAuto && (
        <AutoConfigModal
          tipo={editingAuto}
          current={autoConfig(editingAuto)}
          categorias={categorias}
          bancos={bancos}
          onClose={() => setEditingAuto(null)}
          onSave={async (banco, categoria) => {
            await fetch('/api/personal/presupuesto/auto', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: editingAuto, banco, categoria }) });
            setAutoConfigs(prev => {
              const next = prev.filter(c => c.tipo !== editingAuto);
              return [...next, { tipo: editingAuto, banco, categoria }];
            });
            setEditingAuto(null);
          }}
        />
      )}

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

// ── Modal configuración automáticos ──────────────────────────────────────────

function AutoConfigModal({ tipo, current, categorias, bancos, onClose, onSave }: {
  tipo: 'suscripciones' | 'ahorro';
  current: { banco: string | null; categoria: string | null };
  categorias: PersonalCategoria[];
  bancos: PersonalBanco[];
  onClose: () => void;
  onSave: (banco: string | null, categoria: string | null) => Promise<void>;
}) {
  const [banco, setBanco] = useState(current.banco ?? '');
  const [categoria, setCategoria] = useState(current.categoria ?? '');
  const [saving, setSaving] = useState(false);

  const titulo = tipo === 'suscripciones' ? 'Suscripciones' : 'Ahorro mensual';
  const color  = tipo === 'suscripciones' ? '#8b5cf6' : '#f59e0b';

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(banco || null, categoria || null);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-card rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: `${color}20`, color }}>{titulo}</span>
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Configurar</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-xl" style={{ color: 'var(--text-muted)', background: 'var(--btn-hover)' }}>×</button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Categoría</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Banco</label>
            <select value={banco} onChange={e => setBanco(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">Sin banco</option>
              {bancos.map(b => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'transparent' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 shadow-lg" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

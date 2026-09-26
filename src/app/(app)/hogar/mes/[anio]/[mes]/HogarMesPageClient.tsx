'use client';
import { SortableTh, useTableSort, type SortAccessor } from '@/components/SortableTable';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Mes, Gasto, Ingreso, Categoria } from '@/lib/db';
import { BanknoteIcon, ReceiptIcon, BankIcon, PencilIcon, TrashIcon, LockIcon, UnlockIcon } from '@/components/icons';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import InfoExpand from '@/components/InfoExpand';
import { useIsMobile } from '@/lib/useIsMobile';
import { autoText } from '@/components/ColorDots';

const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 border transition-colors appearance-none';
const inputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };

interface IngresoForm {
  id?: number;
  inquilino: string;
  aportacion: string;
  comentario: string;
}

interface GastoForm {
  id?: number;
  gasto: string;
  categoria: string;
  banco: string;
  importe: string;
  fecha: string;
  comentario: string;
}

function emptyIngreso(): IngresoForm { return { inquilino: '', aportacion: '', comentario: '' }; }
function emptyGasto(): GastoForm { return { gasto: '', categoria: '', banco: '', importe: '', fecha: '', comentario: '' }; }

function CategoryBadge({ nombre, categorias }: { nombre: string | null; categorias: Categoria[] }) {
  if (!nombre) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const cat = categorias.find(c => c.nombre === nombre);
  const bg = cat?.color ?? 'var(--text-secondary)';
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: bg, color: autoText(bg) }}>{nombre}</span>;
}

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: 'var(--text-muted)', background: 'var(--btn-hover)' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  );
}

// ── Modal Ingreso ────────────────────────────────────────────────────────────
function IngresoModal({ form, setForm, onClose, onSave, saving }: {
  form: IngresoForm; setForm: (f: IngresoForm) => void;
  onClose: () => void; onSave: () => void; saving: boolean;
}) {
  const set = (k: keyof IngresoForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-card rounded-3xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{form.id ? 'Editar ingreso' : 'Nuevo ingreso'}</h2>
          <CloseBtn onClose={onClose} />
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Concepto *</label>
            <input value={form.inquilino} onChange={set('inquilino')} className={inputCls} style={inputStyle} placeholder="Ej: Nómina" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Importe (€) *</label>
            <input type="number" step="0.01" min="0" value={form.aportacion} onChange={set('aportacion')} className={inputCls} style={inputStyle} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Comentario</label>
            <input value={form.comentario} onChange={set('comentario')} className={inputCls} style={inputStyle} placeholder="Opcional…" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'transparent' }}>Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.inquilino.trim() || !form.aportacion}
            className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 shadow-lg shadow-success/30"
            style={{ background: 'linear-gradient(135deg, var(--color-success), color-mix(in srgb, var(--color-success) 75%, black))' }}>
            {saving ? 'Guardando…' : form.id ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Gasto ──────────────────────────────────────────────────────────────
function GastoModal({ form, setForm, catGasto, catBanco, onClose, onSave, saving }: {
  form: GastoForm; setForm: (f: GastoForm) => void;
  catGasto: Categoria[]; catBanco: Categoria[];
  onClose: () => void; onSave: () => void; saving: boolean;
}) {
  const set = (k: keyof GastoForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-card rounded-3xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{form.id ? 'Editar gasto' : 'Nuevo gasto'}</h2>
          <CloseBtn onClose={onClose} />
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Gasto *</label>
            <input value={form.gasto} onChange={set('gasto')} className={inputCls} style={inputStyle} placeholder="Ej: Supermercado" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Importe (€) *</label>
            <input type="number" step="0.01" min="0" value={form.importe} onChange={set('importe')} className={inputCls} style={inputStyle} placeholder="0.00" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Categoría</label>
              <select value={form.categoria} onChange={set('categoria')} className={inputCls} style={inputStyle}>
                <option value="">Sin categoría</option>
                {catGasto.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Banco</label>
              <select value={form.banco} onChange={set('banco')} className={inputCls} style={inputStyle}>
                <option value="">Sin banco</option>
                {catBanco.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Fecha</label>
            <input type="date" value={form.fecha} onChange={set('fecha')} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Comentario</label>
            <input value={form.comentario} onChange={set('comentario')} className={inputCls} style={inputStyle} placeholder="Opcional…" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'transparent' }}>Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.gasto.trim() || !form.importe}
            className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 shadow-lg shadow-accent-primary/30"
            style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-dark))' }}>
            {saving ? 'Guardando…' : form.id ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section con cabecera coloreada ───────────────────────────────────────────
function Section({ title, icon, badge, headerClass, onAdd, children }: {
  title: string; icon?: React.ReactNode; badge: string; headerClass: string;
  onAdd?: () => void; children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      <div className={`flex items-center justify-between px-5 py-4 ${headerClass}`}>
        <div className="flex items-center gap-3">
          {icon && <span className="text-white">{icon}</span>}
          <h2 className="font-bold text-white text-base">{title}</h2>
          <span className="text-sm text-white/80 font-mono">{badge}</span>
        </div>
        {onAdd && (
          <button onClick={onAdd} className="flex items-center gap-1.5 py-1.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-2xl transition-colors px-3 text-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Añadir
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

const SORT_INGRESOS: Record<'inquilino' | 'aportacion', SortAccessor<Ingreso>> = {
  inquilino:  { get: i => i.inquilino, type: 'text' },
  aportacion: { get: i => i.aportacion, type: 'number' },
};
const SORT_GASTOS: Record<'gasto' | 'fecha' | 'importe' | 'categoria' | 'banco', SortAccessor<Gasto>> = {
  gasto:     { get: g => g.gasto, type: 'text' },
  fecha:     { get: g => g.fecha, type: 'date' },
  importe:   { get: g => g.importe, type: 'number' },
  categoria: { get: g => g.categoria, type: 'text' },
  banco:     { get: g => g.banco, type: 'text' },
};
const byId = (a: { id: number }, b: { id: number }) => a.id - b.id;

function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return <th className={align === 'right' ? 'text-right' : ''}>{children}</th>;
}

// ── Componente principal ─────────────────────────────────────────────────────
interface Props {
  mesObj: Mes | null;
  mesExists: boolean;
  gastos: Gasto[];
  ingresos: Ingreso[];
  categoriasGasto: Categoria[];
  categoriasBanco: Categoria[];
  meses: Mes[];
  nombre: string;
  canEdit?: boolean;
}

const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const fieldInputCls = 'w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 border transition-colors';
const fieldInputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };

export default function HogarMesPageClient({
  mesObj, mesExists, gastos: initGastos, ingresos: initIngresos,
  categoriasGasto, categoriasBanco, meses, nombre, canEdit = true,
}: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [gastos, setGastos] = useState<Gasto[]>(initGastos);
  const [ingresos, setIngresos] = useState<Ingreso[]>(initIngresos);
  const sortIng = useTableSort(ingresos, SORT_INGRESOS, { defaultKey: 'inquilino', storageKey: 'sort:hogar-mes-ingresos', tieBreak: byId });
  const sortGas = useTableSort(gastos, SORT_GASTOS, { defaultKey: 'fecha', storageKey: 'sort:hogar-mes-gastos', tieBreak: byId });
  const [ingresoModal, setIngresoModal] = useState<IngresoForm | null>(null);
  const [gastoModal, setGastoModal] = useState<GastoForm | null>(null);
  const [nuevoMesOpen, setNuevoMesOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ msg: string; fn: () => Promise<void> } | null>(null);
  const [bloqueado, setBloqueado] = useState(!!mesObj?.bloqueado);
  const [togglingBloqueo, setTogglingBloqueo] = useState(false);

  useEffect(() => { setGastos(initGastos); }, [initGastos]);
  useEffect(() => { setIngresos(initIngresos); }, [initIngresos]);
  useEffect(() => { setBloqueado(!!mesObj?.bloqueado); }, [mesObj?.bloqueado]);

  async function toggleBloqueo() {
    setTogglingBloqueo(true);
    const next = !bloqueado;
    await fetch(`/api/meses/${mesObj!.id}/bloqueo`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bloqueado: next }),
    });
    setBloqueado(next);
    setTogglingBloqueo(false);
    router.refresh();
  }

  const puedeEditar = canEdit && !bloqueado;

  // ── Sin meses creados — pantalla de primer arranque ─────────────────────
  if (!mesExists || !mesObj) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(14,165,233,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-hogar)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Mes</h1>
        </div>
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(14,165,233,0.1)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-hogar)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Sin meses creados</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Crea tu primer mes para empezar a registrar ingresos y gastos del hogar.</p>
          {canEdit && (
            <button
              onClick={() => setNuevoMesOpen(true)}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--accent-hogar), color-mix(in srgb, var(--accent-hogar) 75%, black))' }}
            >
              + Crear primer mes
            </button>
          )}
        </div>
        {nuevoMesOpen && <NuevoMesModal meses={meses} onClose={() => setNuevoMesOpen(false)} />}
      </div>
    );
  }

  const gastosSorted = sortGas.sorted;
  const totalIngresos = ingresos.reduce((s, i) => s + (i.aportacion ?? 0), 0);
  const totalGastos = gastos.reduce((s, g) => s + (g.importe ?? 0), 0);
  const balance = totalIngresos - totalGastos;

  // ── Ingresos CRUD ────────────────────────────────────────────────────────
  async function saveIngreso() {
    if (!ingresoModal) return;
    setSaving(true);
    const body = { mes_id: mesObj!.id, inquilino: ingresoModal.inquilino, aportacion: Number(ingresoModal.aportacion) || 0, comentario: ingresoModal.comentario || null };
    if (ingresoModal.id) {
      await fetch(`/api/ingresos/${ingresoModal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setIngresos(prev => prev.map(i => i.id === ingresoModal.id ? { ...i, ...body } : i));
    } else {
      const res = await fetch('/api/ingresos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const { id } = await res.json();
      setIngresos(prev => [...prev, { id, ...body } as Ingreso]);
    }
    setSaving(false); setIngresoModal(null); router.refresh();
  }

  function editIngreso(i: Ingreso) {
    setIngresoModal({ id: i.id, inquilino: i.inquilino, aportacion: String(i.aportacion), comentario: i.comentario ?? '' });
  }

  function deleteIngreso(id: number) {
    setConfirm({ msg: '¿Eliminar este ingreso?', fn: async () => {
      await fetch(`/api/ingresos/${id}`, { method: 'DELETE' });
      setIngresos(prev => prev.filter(i => i.id !== id));
    }});
  }

  // ── Gastos CRUD ──────────────────────────────────────────────────────────
  async function saveGasto() {
    if (!gastoModal) return;
    setSaving(true);
    const body = { mes_id: mesObj!.id, gasto: gastoModal.gasto, fecha: gastoModal.fecha || null, categoria: gastoModal.categoria || null, banco: gastoModal.banco || null, importe: Number(gastoModal.importe) || 0, comentario: gastoModal.comentario || null };
    if (gastoModal.id) {
      await fetch(`/api/gastos/${gastoModal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setGastos(prev => prev.map(g => g.id === gastoModal.id ? { ...g, ...body } : g));
    } else {
      const res = await fetch('/api/gastos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const { id } = await res.json();
      setGastos(prev => [...prev, { id, ...body } as Gasto]);
    }
    setSaving(false); setGastoModal(null); router.refresh();
  }

  function editGasto(g: Gasto) {
    setGastoModal({ id: g.id, gasto: g.gasto, categoria: g.categoria ?? '', banco: g.banco ?? '', importe: String(g.importe), fecha: g.fecha?.split('T')[0] ?? '', comentario: g.comentario ?? '' });
  }

  function deleteGasto(g: Gasto) {
    setConfirm({ msg: '¿Eliminar este gasto?', fn: async () => {
      await fetch(`/api/gastos/${g.id}`, { method: 'DELETE' });
      setGastos(prev => prev.filter(x => x.id !== g.id));
    }});
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(14,165,233,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-hogar)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>{nombre}</h1>
          {bloqueado && (
            <span className="flex items-center gap-1.5 px-2 sm:px-3 py-1 text-xs font-semibold rounded-full" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              <LockIcon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Bloqueado</span>
            </span>
          )}
          <InfoExpand title="¿Qué es Mes?">
            <p>Aquí se registran todos los gastos del mes del Hogar con su categoría, fecha y banco. Al crear el mes se pueden importar automáticamente los datos del Presupuesto. Solo puedes crear el mes actual o, como máximo, el siguiente; el resto se irán habilitando a medida que avance el calendario. Usa el candado para bloquear o desbloquear la imputación de gastos e ingresos; los meses ya vencidos se bloquean automáticamente.</p>
          </InfoExpand>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <button
              onClick={toggleBloqueo}
              disabled={togglingBloqueo}
              title={bloqueado ? 'Desbloquear mes' : 'Bloquear mes'}
              className="w-10 h-10 flex items-center justify-center rounded-2xl border transition-colors disabled:opacity-50"
              style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--btn-border)', color: bloqueado ? '#ef4444' : 'var(--text-primary)' }}
            >
              {bloqueado ? <LockIcon className="w-4 h-4" /> : <UnlockIcon className="w-4 h-4" />}
            </button>
          )}
          {canEdit && (
            <button onClick={() => setNuevoMesOpen(true)} className="px-4 py-2.5 text-sm font-semibold rounded-2xl border transition-colors" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--btn-border)', color: 'var(--text-primary)' }}>
              + Nuevo mes
            </button>
          )}
          <div className="relative">
            <select className="appearance-none bg-accent-primary hover:bg-accent-primary-dark text-white font-semibold text-sm rounded-2xl pl-4 pr-8 py-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-primary transition-colors shadow-lg shadow-accent-primary/30"
              value={`${mesObj.anio}/${mesObj.mes}`}
              onChange={e => { const [a, m] = e.target.value.split('/'); router.push(`/hogar/mes/${a}/${m}`); }}>
              {meses.map(m => <option key={m.id} value={`${m.anio}/${m.mes}`}>{m.nombre}</option>)}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white text-xs">▼</span>
          </div>
        </div>
      </div>

      {/* ── Resumen ── */}
      <div className="grid grid-cols-3 gap-2 md:gap-6">
        <div className="glass-card rounded-2xl md:rounded-3xl p-3 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-[10px] md:text-sm" style={{ color: 'var(--text-secondary)' }}>Ingresos</p>
              <h3 className="text-sm md:text-3xl font-extrabold mt-1 md:mt-3 leading-tight" style={{ color: 'var(--text-primary)' }}>{fmt(totalIngresos)}</h3>
              <p className="hidden md:block font-semibold mt-2 text-success text-sm">{ingresos.length} entrada{ingresos.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="hidden md:flex w-12 h-12 rounded-2xl bg-success/10 items-center justify-center shrink-0">
              <BanknoteIcon className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl md:rounded-3xl p-3 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-[10px] md:text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="md:hidden">Gastos</span>
                <span className="hidden md:inline">Gastos totales</span>
              </p>
              <h3 className="text-sm md:text-3xl font-extrabold mt-1 md:mt-3 leading-tight text-error">-{fmt(totalGastos)}</h3>
              <p className="hidden md:block font-semibold mt-2 text-warning text-sm">{gastos.length} concepto{gastos.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="hidden md:flex w-12 h-12 rounded-2xl bg-orange-100 items-center justify-center shrink-0">
              <ReceiptIcon className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
        <div className={`rounded-2xl md:rounded-3xl p-3 md:p-6 text-white shadow-2xl ${balance > 0 ? 'bg-gradient-to-br from-success to-success-dark shadow-success/20' : balance < 0 ? 'bg-gradient-to-br from-error to-error-dark shadow-error/20' : 'bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-500/20'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 font-medium text-[10px] md:text-sm">Balance</p>
              <h3 className="text-sm md:text-3xl font-extrabold mt-1 md:mt-3 leading-tight">{fmt(balance)}</h3>
              <p className="hidden md:flex font-semibold mt-2 text-sm items-center gap-1">{balance > 0 ? '✓ Superávit' : balance < 0 ? '✗ Déficit' : '= Neutro'}</p>
            </div>
            <div className="hidden md:flex w-12 h-12 rounded-2xl bg-white/20 items-center justify-center shrink-0 backdrop-blur-md">
              <BankIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabla de Ingresos ── */}
      <Section title="Ingresos" icon={<BanknoteIcon className="w-4 h-4" />} badge={fmt(totalIngresos)} headerClass="bg-success-dark"
        onAdd={puedeEditar ? () => setIngresoModal(emptyIngreso()) : undefined}>
        <div className="overflow-x-auto">
          {ingresos.length === 0 ? (
            <p className="py-14 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Sin ingresos — pulsa "Añadir" para empezar</p>
          ) : (
            <table className="theme-table">
              <thead>
                <tr>
                  <SortableTh label="Concepto" sortKey="inquilino" activeKey={sortIng.sortKey} asc={sortIng.sortAsc} onSort={sortIng.toggleSort} />
                  <SortableTh label="Importe" sortKey="aportacion" activeKey={sortIng.sortKey} asc={sortIng.sortAsc} onSort={sortIng.toggleSort} />
                  {puedeEditar && <Th align="right">Acciones</Th>}
                </tr>
              </thead>
              <tbody>
                {sortIng.sorted.map(i => (
                  <tr key={i.id} style={{ borderBottom: '1px solid var(--divider)', cursor: isMobile && puedeEditar ? 'pointer' : undefined }}
                    onClick={() => { if (isMobile && puedeEditar) editIngreso(i); }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-page)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <td className="px-4 py-3">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{i.inquilino}</span>
                      {i.comentario && <p className="text-xs truncate max-w-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{i.comentario}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: 'var(--color-success)' }}>{fmt(i.aportacion)}</td>
                    {puedeEditar && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={e => { e.stopPropagation(); editIngreso(i); }} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}><PencilIcon /></button>
                          <button onClick={e => { e.stopPropagation(); deleteIngreso(i.id); }} className="p-1.5 rounded-lg transition-colors text-error"
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
      </Section>

      {/* ── Tabla de Gastos ── */}
      <Section title="Gastos" icon={<ReceiptIcon className="w-4 h-4" />} badge={fmt(totalGastos)} headerClass="bg-orange-600"
        onAdd={puedeEditar ? () => setGastoModal(emptyGasto()) : undefined}>
        <div className="overflow-x-auto">
          {gastosSorted.length === 0 ? (
            <p className="py-14 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Sin gastos — pulsa "Añadir" para empezar</p>
          ) : (
            <table className="theme-table min-w-[620px]">
              <thead>
                <tr>
                  <SortableTh label="Gasto" sortKey="gasto" activeKey={sortGas.sortKey} asc={sortGas.sortAsc} onSort={sortGas.toggleSort} />
                  <SortableTh label="Fecha" sortKey="fecha" activeKey={sortGas.sortKey} asc={sortGas.sortAsc} onSort={sortGas.toggleSort} />
                  <SortableTh label="Importe" sortKey="importe" activeKey={sortGas.sortKey} asc={sortGas.sortAsc} onSort={sortGas.toggleSort} />
                  <SortableTh label="Categoría" sortKey="categoria" activeKey={sortGas.sortKey} asc={sortGas.sortAsc} onSort={sortGas.toggleSort} />
                  <SortableTh label="Banco" sortKey="banco" activeKey={sortGas.sortKey} asc={sortGas.sortAsc} onSort={sortGas.toggleSort} />
                  {puedeEditar && <Th align="right">Acciones</Th>}
                </tr>
              </thead>
              <tbody>
                {gastosSorted.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid var(--divider)', cursor: isMobile && puedeEditar ? 'pointer' : undefined }}
                    onClick={() => { if (isMobile && puedeEditar) editGasto(g); }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-page)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <td className="px-4 py-3">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{g.gasto}</span>
                      {g.comentario && <p className="text-xs truncate max-w-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{g.comentario}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: g.fecha ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {g.fecha ? g.fecha.split('T')[0].split('-').reverse().join('/') : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: 'var(--color-error)' }}>-{fmt(g.importe)}</td>
                    <td className="px-4 py-3"><CategoryBadge nombre={g.categoria} categorias={categoriasGasto} /></td>
                    <td className="px-4 py-3"><CategoryBadge nombre={g.banco} categorias={categoriasBanco} /></td>
                    {puedeEditar && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={e => { e.stopPropagation(); editGasto(g); }} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}><PencilIcon /></button>
                          <button onClick={e => { e.stopPropagation(); deleteGasto(g); }} className="p-1.5 rounded-lg transition-colors text-error"
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
      </Section>

      {/* ── Modales ── */}
      {ingresoModal && (
        <IngresoModal form={ingresoModal} setForm={setIngresoModal} onClose={() => setIngresoModal(null)} onSave={saveIngreso} saving={saving} />
      )}
      {gastoModal && (
        <GastoModal form={gastoModal} setForm={setGastoModal} catGasto={categoriasGasto} catBanco={categoriasBanco} onClose={() => setGastoModal(null)} onSave={saveGasto} saving={saving} />
      )}
      {nuevoMesOpen && <NuevoMesModal meses={meses} onClose={() => setNuevoMesOpen(false)} />}
      {confirm && (
        <ConfirmDialog message={confirm.msg} onConfirm={async () => { await confirm.fn(); setConfirm(null); }} onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
}

// ── Modal nuevo mes ──────────────────────────────────────────────────────────
function NuevoMesModal({ meses, onClose }: { meses: Mes[]; onClose: () => void }) {
  const router = useRouter();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  // Solo se permite crear hasta el mes siguiente al actual
  const maxAnio = currentMonth === 12 ? currentYear + 1 : currentYear;
  const maxAnioMes = currentMonth === 12 ? 1 : currentMonth + 1;
  const [selectedAnio, setSelectedAnio] = useState(currentYear);
  const [selectedMes, setSelectedMes] = useState(currentMonth);
  const maxMes = selectedAnio === maxAnio ? maxAnioMes : selectedAnio < maxAnio ? 12 : 0;
  const [importarFijos, setImportarFijos] = useState(true);
  const [sobrescribir, setSobrescribir] = useState(false);
  const [fijosCount, setFijosCount] = useState<{ gasto: number; ingreso: number } | null>(null);
  const [creating, setCreating] = useState(false);

  const mesExistente = meses.find(m => m.mes === selectedMes && m.anio === selectedAnio) ?? null;

  useEffect(() => {
    Promise.all([
      fetch('/api/fijos?tipo=gasto').then(r => r.json()),
      fetch('/api/fijos?tipo=ingreso').then(r => r.json()),
    ]).then(([g, i]) => setFijosCount({ gasto: Array.isArray(g) ? g.length : 0, ingreso: Array.isArray(i) ? i.length : 0 }));
  }, []);

  const totalFijos = fijosCount ? fijosCount.gasto + fijosCount.ingreso : 0;

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setCreating(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/meses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mes: fd.get('mes'), anio: fd.get('anio'), importarFijos, sobrescribir }) });
    const data = await res.json();
    onClose();
    router.push(`/hogar/mes/${data.anio}/${data.mes}`);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-3xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid var(--divider)' }}>
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            {mesExistente ? 'Gestionar mes' : '+ Crear nuevo mes'}
          </h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-lg hover:bg-black/10" style={{ color: 'var(--text-secondary)' }}>×</button>
        </div>
        <form onSubmit={handleCreate}>
          <div className="px-6 py-4 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Mes</label>
              <select name="mes" value={selectedMes} onChange={e => { setSelectedMes(parseInt(e.target.value)); setSobrescribir(false); }} className={fieldInputCls} style={fieldInputStyle}>
                {MESES_NOMBRES.map((m, i) => <option key={i} value={i + 1} disabled={i + 1 > maxMes}>{m}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Año</label>
              <input name="anio" type="number" value={selectedAnio} max={maxAnio}
                onChange={e => {
                  const a = Math.min(parseInt(e.target.value) || currentYear, maxAnio);
                  setSelectedAnio(a); setSobrescribir(false);
                  const limite = a === maxAnio ? maxAnioMes : 12;
                  if (selectedMes > limite) setSelectedMes(limite);
                }}
                className={fieldInputCls} style={fieldInputStyle} />
            </div>
          </div>

          {mesExistente ? (
            <div className="px-6 pb-5" style={{ borderTop: '1px solid var(--divider)' }}>
              <div className="mt-4 mb-3 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-warning)' }}>Este mes ya existe</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div onClick={() => setSobrescribir(v => !v)} className="w-10 h-6 rounded-full transition-colors relative shrink-0" style={{ background: sobrescribir ? 'var(--color-error)' : 'var(--divider)' }}>
                  <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: sobrescribir ? '22px' : '4px' }} />
                </div>
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Sobrescribir con presupuesto</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Se borrarán todos los gastos e ingresos actuales y se importará el presupuesto</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="px-6 pb-5" style={{ borderTop: '1px solid var(--divider)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mt-4 mb-3" style={{ color: 'var(--text-muted)' }}>Presupuesto</p>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div onClick={() => setImportarFijos(v => !v)} className="w-10 h-6 rounded-full transition-colors relative shrink-0" style={{ background: importarFijos ? 'var(--accent-primary)' : 'var(--divider)' }}>
                  <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: importarFijos ? '22px' : '4px' }} />
                </div>
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Importar presupuesto</span>
                  {fijosCount !== null && totalFijos > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{fijosCount.ingreso} ingresos · {fijosCount.gasto} gastos</p>
                  )}
                  {fijosCount !== null && totalFijos === 0 && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Sin entradas —{' '}<a href="/hogar/presupuesto" className="underline" style={{ color: 'var(--accent-primary)' }}>configúralo aquí</a></p>
                  )}
                </div>
              </label>
            </div>
          )}

          <div className="flex gap-2 justify-end px-6 py-4" style={{ borderTop: '1px solid var(--divider)' }}>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border-2 rounded-2xl transition-colors" style={{ borderColor: 'var(--btn-border)', color: 'var(--text-secondary)' }}>Cancelar</button>
            {mesExistente ? (
              <button type="submit" disabled={creating || !sobrescribir} className="px-4 py-2 text-sm font-bold text-white rounded-2xl shadow-lg shadow-error/30 disabled:opacity-40 transition-colors" style={{ background: sobrescribir ? 'var(--color-error)' : 'var(--divider)' }}>
                {creating ? 'Sobrescribiendo…' : 'Sobrescribir →'}
              </button>
            ) : (
              <button type="submit" disabled={creating} className="px-4 py-2 text-sm font-bold bg-accent-primary text-white rounded-2xl shadow-lg shadow-accent-primary/30 hover:bg-accent-primary-dark disabled:opacity-50">
                {creating ? 'Creando…' : 'Crear mes →'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Mes, Gasto, Prestamo, Ingreso, Categoria } from '@/lib/db';
import { BanknoteIcon, ReceiptIcon, BankIcon, PencilIcon, TrashIcon, SettingsIcon } from '@/components/icons';
import { autoText } from '@/components/ColorDots';
import { ConfirmDialog } from '@/components/ConfirmDialog';



function CategoryBadge({ nombre, categorias }: { nombre: string | null; categorias: Categoria[] }) {
  if (!nombre) return null;
  const cat = categorias.find(c => c.nombre === nombre);
  const bg = cat?.color ?? '#e5e7eb';
  return (
    <span
      style={{ backgroundColor: bg, color: autoText(bg) }}
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
    >
      {nombre}
    </span>
  );
}

function fmt(n: number) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

interface Props {
  mesObj: Mes;
  gastos: Gasto[];
  prestamos: Prestamo[];
  ingresos: Ingreso[];
  categoriasGasto: Categoria[];
  categoriasPrestamo: Categoria[];
  meses: Mes[];
  nombre: string;
  canEdit?: boolean;
}

type SubtipoGasto = 'gasto' | 'prestamo';
type FilaGasto = ({ _tipo: 'gasto' } & Gasto) | ({ _tipo: 'prestamo' } & Prestamo);

type ModalState =
  | { type: 'none' }
  | { type: 'gasto'; subtype: SubtipoGasto; item?: FilaGasto }
  | { type: 'ingreso'; item?: Ingreso }
  | { type: 'nuevoMes' };

export default function MesPageClient({
  mesObj, gastos: initGastos, prestamos: initPrestamos, ingresos: initIngresos,
  categoriasGasto: initCatGasto, categoriasPrestamo: initCatPrestamo,
  meses, nombre, canEdit = true,
}: Props) {
  const router = useRouter();
  const [gastos, setGastos] = useState<Gasto[]>(initGastos);
  const [prestamos, setPrestamos] = useState<Prestamo[]>(initPrestamos);
  const [ingresos, setIngresos] = useState<Ingreso[]>(initIngresos);
  const [catGasto, setCatGasto] = useState<Categoria[]>(initCatGasto);
  const [catPrestamo, setCatPrestamo] = useState<Categoria[]>(initCatPrestamo);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  // Sincroniza estado local cuando router.refresh() trae nuevos datos del servidor
  useEffect(() => { setGastos(initGastos); }, [initGastos]);
  useEffect(() => { setPrestamos(initPrestamos); }, [initPrestamos]);
  useEffect(() => { setIngresos(initIngresos); }, [initIngresos]);
  const [loading, setLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<{ msg: string; fn: () => Promise<void> } | null>(null);

  const totalIngresos = ingresos.reduce((s, i) => s + (i.aportacion ?? 0), 0);
  const totalGastos = gastos.reduce((s, g) => s + (g.importe ?? 0), 0);
  const totalPrestamos = prestamos.reduce((s, p) => s + (p.importe ?? 0), 0);
  const totalGastosGeneral = totalGastos + totalPrestamos;
  const balance = totalIngresos - totalGastosGeneral;

  // ── Ingresos CRUD ─────────────────────────────────────────────────────────
  async function saveIngreso(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = { mes_id: mesObj.id, inquilino: fd.get('inquilino'), aportacion: parseFloat(fd.get('aportacion') as string) || 0 };
    if (modal.type === 'ingreso' && modal.item) {
      await fetch(`/api/ingresos/${modal.item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/ingresos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setModal({ type: 'none' }); router.refresh(); setLoading(false);
  }

  async function deleteIngreso(id: number) {
    setConfirmState({ msg: '¿Eliminar este ingreso?', fn: async () => {
      await fetch(`/api/ingresos/${id}`, { method: 'DELETE' });
      setIngresos(ingresos.filter(i => i.id !== id));
    }});
  }

  // ── Gastos + Préstamos CRUD (unificado) ──────────────────────────────────
  const filasGasto: FilaGasto[] = [
    ...gastos.map(g => ({ _tipo: 'gasto' as const, ...g })),
    ...prestamos.map(p => ({ _tipo: 'prestamo' as const, ...p })),
  ];

  async function saveGasto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true);
    if (modal.type !== 'gasto') return;
    const fd = new FormData(e.currentTarget);
    const subtype = modal.subtype;
    const body = { mes_id: mesObj.id, gasto: fd.get('gasto'), fecha: fd.get('fecha') || null, categoria: fd.get('categoria') || null, importe: parseFloat(fd.get('importe') as string) || 0, comentario: fd.get('comentario') || null };
    const base = subtype === 'gasto' ? 'gastos' : 'prestamos';
    if (modal.item) {
      await fetch(`/api/${base}/${modal.item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch(`/api/${base}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setModal({ type: 'none' }); router.refresh(); setLoading(false);
  }

  async function deleteGasto(fila: FilaGasto) {
    setConfirmState({ msg: '¿Eliminar este gasto?', fn: async () => {
      await fetch(`/api/${fila._tipo === 'gasto' ? 'gastos' : 'prestamos'}/${fila.id}`, { method: 'DELETE' });
      if (fila._tipo === 'gasto') setGastos(prev => prev.filter(g => g.id !== fila.id));
      else setPrestamos(prev => prev.filter(p => p.id !== fila.id));
    }});
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(14,165,233,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>{nombre}</h1>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <button
              onClick={() => setModal({ type: 'nuevoMes' })}
              className="px-4 py-2.5 text-sm font-semibold rounded-2xl border transition-colors"
              style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--btn-border)', color: 'var(--text-primary)' }}
            >
              + Nuevo mes
            </button>
          )}
          <div className="relative">
            <select
              className="appearance-none bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl pl-4 pr-8 py-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors shadow-lg shadow-indigo-500/30"
              value={`${mesObj.anio}/${mesObj.mes}`}
              onChange={e => {
                const [a, m] = e.target.value.split('/');
                router.push(`/hogar/mes/${a}/${m}`);
              }}
            >
              {meses.map(m => (
                <option key={m.id} value={`${m.anio}/${m.mes}`}>{m.nombre}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white text-xs">▼</span>
          </div>
        </div>
      </div>

      {/* ── Cards de resumen ── */}
      <div className="grid grid-cols-3 gap-2 md:gap-6">
        {/* Ingresos */}
        <div className="glass-card rounded-2xl md:rounded-3xl p-3 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-[10px] md:text-sm" style={{ color: 'var(--text-secondary)' }}>Ingresos</p>
              <h3 className="text-sm md:text-3xl font-extrabold mt-1 md:mt-3 leading-tight" style={{ color: 'var(--text-primary)' }}>{fmt(totalIngresos)}</h3>
              <p className="hidden md:block font-semibold mt-2 text-emerald-500 text-sm">{ingresos.length} inquilino{ingresos.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="hidden md:flex w-12 h-12 rounded-2xl bg-emerald-100 items-center justify-center shrink-0">
              <BanknoteIcon className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        {/* Gastos */}
        <div className="glass-card rounded-2xl md:rounded-3xl p-3 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-[10px] md:text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="md:hidden">Gastos</span>
                <span className="hidden md:inline">Gastos totales</span>
              </p>
              <h3 className="text-sm md:text-3xl font-extrabold mt-1 md:mt-3 leading-tight text-red-500">-{fmt(totalGastosGeneral)}</h3>
              <p className="hidden md:block font-semibold mt-2 text-amber-500 text-sm">{fmt(totalGastos)} gastos · {fmt(totalPrestamos)} préstamos</p>
            </div>
            <div className="hidden md:flex w-12 h-12 rounded-2xl bg-orange-100 items-center justify-center shrink-0">
              <ReceiptIcon className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
        {/* Balance */}
        <div className={`rounded-2xl md:rounded-3xl p-3 md:p-6 text-white shadow-2xl ${balance >= 0 ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-green-500/20' : 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 font-medium text-[10px] md:text-sm">Balance</p>
              <h3 className="text-sm md:text-3xl font-extrabold mt-1 md:mt-3 leading-tight">{fmt(balance)}</h3>
              <p className="hidden md:flex font-semibold mt-2 text-sm items-center gap-1">
                {balance >= 0 ? '✓ Superávit' : '✗ Déficit'}
              </p>
            </div>
            <div className="hidden md:flex w-12 h-12 rounded-2xl bg-white/20 items-center justify-center shrink-0 backdrop-blur-md">
              <BankIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Ingresos ── */}
      <Section
        title="Ingresos" icon={<BanknoteIcon className="w-4 h-4" />} badge={fmt(totalIngresos)}
        headerClass="bg-emerald-700"
        onAdd={canEdit ? () => setModal({ type: 'ingreso' }) : undefined}
      >
        {ingresos.length === 0 ? <EmptyRow /> : (
          <div className="overflow-x-auto">
            <table className="theme-table">
              <thead>
                <tr>
                  <Th>Inquilino</Th>
                  <Th align="right">Aportación</Th>
                  <th className="w-20 text-right pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ingresos.map((i, idx) => (
                  <tr key={i.id} className={rowCls(idx)}>
                    <td className="py-3 px-4 font-semibold">{i.inquilino}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-500">{fmt(i.aportacion)}</td>
                    <td className="py-3 pr-3 text-right">
                      {canEdit && <RowActions onEdit={() => setModal({ type: 'ingreso', item: i })} onDelete={() => deleteIngreso(i.id)} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Gastos (gastos + préstamos unificados) ── */}
      <Section
        title="Gastos" icon={<ReceiptIcon className="w-4 h-4" />} badge={fmt(totalGastosGeneral)}
        headerClass="bg-amber-600"
        onAdd={canEdit ? () => setModal({ type: 'gasto', subtype: 'gasto' }) : undefined}
        onAdd2={canEdit ? () => setModal({ type: 'gasto', subtype: 'prestamo' }) : undefined}
        add2Label="+ Préstamo"
      >
        {filasGasto.length === 0 ? <EmptyRow /> : (
          <div className="overflow-x-auto">
            <table className="theme-table">
              <thead>
                <tr>
                  <Th>Concepto</Th>
                  <Th>Fecha</Th>
                  <Th>Tipo</Th>
                  <Th>Categoría</Th>
                  <Th>Banco</Th>
                  <Th align="right">Importe</Th>
                  <Th>Comentario</Th>
                  <th className="w-20 text-right pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filasGasto.map((f, idx) => (
                  <tr key={`${f._tipo}-${f.id}`} className={rowCls(idx)}>
                    <td className="py-3 px-4 font-semibold">{f.gasto}</td>
                    <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{fmtDate(f.fecha)}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: f._tipo === 'gasto' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)', color: f._tipo === 'gasto' ? '#d97706' : '#3b82f6' }}>
                        {f._tipo === 'gasto' ? 'Gasto' : 'Préstamo'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {f._tipo === 'gasto'
                        ? <CategoryBadge nombre={f.categoria} categorias={catGasto} />
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="py-3 px-4">
                      {f._tipo === 'prestamo'
                        ? <CategoryBadge nombre={f.categoria} categorias={catPrestamo} />
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-red-500">-{fmt(f.importe)}</td>
                    <td className="py-3 px-4 text-xs max-w-[180px] truncate" style={{ color: 'var(--text-muted)' }}>{f.comentario}</td>
                    <td className="py-3 pr-3 text-right">
                      {canEdit && <RowActions onEdit={() => setModal({ type: 'gasto', subtype: f._tipo, item: f })} onDelete={() => deleteGasto(f)} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Modales ── */}
      {modal.type === 'ingreso' && (
        <Modal title={modal.item ? 'Editar Ingreso' : 'Nuevo Ingreso'} onClose={() => setModal({ type: 'none' })}>
          <form onSubmit={saveIngreso} className="space-y-3">
            <Field label="Inquilino" name="inquilino" defaultValue={modal.item?.inquilino} required />
            <Field label="Aportación (€)" name="aportacion" type="number" step="0.01" defaultValue={modal.item?.aportacion?.toString()} />
            <FormActions loading={loading} onCancel={() => setModal({ type: 'none' })} />
          </form>
        </Modal>
      )}

      {modal.type === 'gasto' && (
        <Modal
          title={modal.item ? (modal.subtype === 'gasto' ? 'Editar Gasto' : 'Editar Préstamo') : (modal.subtype === 'gasto' ? 'Nuevo Gasto' : 'Nuevo Préstamo')}
          onClose={() => setModal({ type: 'none' })}
        >
          <form onSubmit={saveGasto} className="space-y-3">
            <Field label="Concepto" name="gasto" defaultValue={modal.item?.gasto} required />
            <Field label="Fecha" name="fecha" type="date" defaultValue={modal.item?.fecha?.split('T')[0]} />
            <SelectField
              label={modal.subtype === 'gasto' ? 'Categoría' : 'Banco'}
              name="categoria"
              options={modal.subtype === 'gasto' ? catGasto.map(c => c.nombre) : catPrestamo.map(c => c.nombre)}
              defaultValue={modal.item?.categoria ?? ''}
            />
            <Field label="Importe (€)" name="importe" type="number" step="0.01" defaultValue={modal.item?.importe?.toString()} />
            <Field label="Comentario" name="comentario" defaultValue={modal.item?.comentario ?? ''} />
            <FormActions loading={loading} onCancel={() => setModal({ type: 'none' })} />
          </form>
        </Modal>
      )}

      {modal.type === 'nuevoMes' && (
        <NuevoMesModal
          onClose={() => setModal({ type: 'none' })}
        />
      )}
      {confirmState && (
        <ConfirmDialog
          message={confirmState.msg}
          onConfirm={async () => { await confirmState.fn(); setConfirmState(null); }}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function rowCls(_idx: number) {
  return 'group';
}

function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={align === 'right' ? 'text-right' : ''}>
      {children}
    </th>
  );
}

function Section({ title, icon, badge, headerClass, onAdd, onAdd2, add2Label, onGestionar, children }: {
  title: string; icon?: React.ReactNode; badge?: string; headerClass: string;
  onAdd?: () => void; onAdd2?: () => void; add2Label?: string; onGestionar?: () => void; children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      <div className={`flex items-center justify-between px-5 py-4 ${headerClass}`}>
        <div className="flex items-center gap-3">
          {icon && <span className="text-white">{icon}</span>}
          <h2 className="font-bold text-white text-base">{title}</h2>
          {badge && <span className="text-sm text-white/80 font-mono">{badge}</span>}
        </div>
        {(onAdd || onAdd2 || onGestionar) && (
          <div className="flex items-center gap-2">
            {onGestionar && (
              <button
                onClick={onGestionar}
                className="py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors font-semibold flex items-center gap-1.5 px-2 sm:px-4"
              >
                <SettingsIcon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Gestionar</span>
              </button>
            )}
            {onAdd2 && (
              <button
                onClick={onAdd2}
                className="py-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition-colors px-2 sm:px-4 text-sm"
              >
                {add2Label ?? '+ Añadir 2'}
              </button>
            )}
            {onAdd && (
              <button
                onClick={onAdd}
                className="py-1.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-2xl transition-colors px-2 sm:px-4"
              >
                <span className="sm:hidden text-base leading-none">+</span>
                <span className="hidden sm:inline text-sm">+ Gasto</span>
              </button>
            )}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function EmptyRow() {
  return <p className="text-sm font-medium py-8 text-center" style={{ color: 'var(--text-muted)' }}>Sin entradas — pulsa + Añadir para empezar</p>;
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1 justify-end">
      <button onClick={onEdit} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}><PencilIcon /></button>
      <button onClick={onDelete} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 transition-colors"><TrashIcon /></button>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-3xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-xl transition-colors" style={{ color: 'var(--text-muted)' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const fieldInputCls = 'w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 border transition-colors';
const fieldInputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };

function Field({ label, name, type = 'text', defaultValue, required, step }: {
  label: string; name: string; type?: string; defaultValue?: string; required?: boolean; step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input type={type} name={name} defaultValue={defaultValue} required={required} step={step}
        className={fieldInputCls} style={fieldInputStyle} />
    </div>
  );
}

function SelectField({ label, name, options, defaultValue }: {
  label: string; name: string; options: string[]; defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <select name={name} defaultValue={defaultValue}
        className={fieldInputCls} style={fieldInputStyle}>
        <option value="">— Sin categoría —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function FormActions({ loading, onCancel }: { loading: boolean; onCancel: () => void }) {
  return (
    <div className="flex gap-2 justify-end pt-2">
      <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium border-2 rounded-2xl transition-colors"
        style={{ borderColor: 'var(--btn-border)', color: 'var(--text-secondary)' }}>
        Cancelar
      </button>
      <button type="submit" disabled={loading}
        className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
        {loading ? 'Guardando…' : 'Guardar'}
      </button>
    </div>
  );
}

// ── Modal nuevo mes ──────────────────────────────────────────────────────────

const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function NuevoMesModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const [selectedAnio, setSelectedAnio] = useState(currentYear);
  const [selectedMes, setSelectedMes] = useState(currentMonth);
  const maxMes = selectedAnio === currentYear ? currentMonth : 12;
  const [importarFijos, setImportarFijos] = useState(true);
  const [fijosCount, setFijosCount] = useState<{ gasto: number; prestamo: number; ingreso: number } | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/fijos?tipo=gasto').then(r => r.json()),
      fetch('/api/fijos?tipo=prestamo').then(r => r.json()),
      fetch('/api/fijos?tipo=ingreso').then(r => r.json()),
    ]).then(([g, p, i]) => setFijosCount({
      gasto: Array.isArray(g) ? g.length : 0,
      prestamo: Array.isArray(p) ? p.length : 0,
      ingreso: Array.isArray(i) ? i.length : 0,
    }));
  }, []);

  const totalFijos = fijosCount ? fijosCount.gasto + fijosCount.prestamo + fijosCount.ingreso : 0;

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setCreating(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/meses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mes: fd.get('mes'), anio: fd.get('anio'), importarFijos }),
    });
    const data = await res.json();
    onClose();
    router.push(`/hogar/mes/${data.anio}/${data.mes}`);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-3xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid var(--divider)' }}>
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>+ Crear nuevo mes</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-lg hover:bg-black/10" style={{ color: 'var(--text-secondary)' }}>×</button>
        </div>

        <form onSubmit={handleCreate}>
          <div className="px-6 py-4 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Mes</label>
              <select name="mes" value={selectedMes}
                onChange={e => setSelectedMes(parseInt(e.target.value))}
                className={fieldInputCls} style={fieldInputStyle}>
                {MESES_NOMBRES.map((m, i) => (
                  <option key={i} value={i + 1} disabled={i + 1 > maxMes}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Año</label>
              <input name="anio" type="number" value={selectedAnio}
                max={currentYear}
                onChange={e => {
                  const a = parseInt(e.target.value) || currentYear;
                  setSelectedAnio(a);
                  if (a === currentYear && selectedMes > currentMonth) setSelectedMes(currentMonth);
                }}
                className={fieldInputCls} style={fieldInputStyle} />
            </div>
          </div>

          <div className="px-6 pb-5" style={{ borderTop: '1px solid var(--divider)' }}>
            <p className="text-xs font-bold uppercase tracking-wide mt-4 mb-3" style={{ color: 'var(--text-muted)' }}>
              Presupuesto
            </p>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setImportarFijos(v => !v)}
                className="w-10 h-6 rounded-full transition-colors relative shrink-0"
                style={{ background: importarFijos ? '#6366f1' : 'var(--divider)' }}
              >
                <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: importarFijos ? '22px' : '4px' }} />
              </div>
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Importar presupuesto
                </span>
                {fijosCount !== null && totalFijos > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {fijosCount.ingreso} ingresos · {fijosCount.gasto} gastos · {fijosCount.prestamo} préstamos
                  </p>
                )}
                {fijosCount !== null && totalFijos === 0 && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Sin entradas en el presupuesto —{' '}
                    <a href="/hogar/presupuesto" className="underline" style={{ color: '#6366f1' }}>configúralo aquí</a>
                  </p>
                )}
              </div>
            </label>
          </div>

          <div className="flex gap-2 justify-end px-6 py-4" style={{ borderTop: '1px solid var(--divider)' }}>
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium border-2 rounded-2xl transition-colors"
              style={{ borderColor: 'var(--btn-border)', color: 'var(--text-secondary)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={creating}
              className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 disabled:opacity-50">
              {creating ? 'Creando…' : 'Crear mes →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

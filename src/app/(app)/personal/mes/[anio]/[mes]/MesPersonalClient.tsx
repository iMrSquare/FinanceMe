'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { PersonalGastoMes, PersonalIngresoMes, PersonalCategoria, PersonalMes, PersonalGastoFijo } from '@/lib/db';
import { BanknoteIcon, ReceiptIcon, BankIcon, PencilIcon, TrashIcon, SettingsIcon } from '@/components/icons';
import type { PersonalBanco } from '@/lib/db';
import { autoText } from '@/components/ColorDots';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  const parts = iso.split('T')[0].split('-');
  return `${parts[2]}/${parts[1]}`;
}

function CategoryBadge({ nombre, categorias }: { nombre: string | null; categorias: PersonalCategoria[] }) {
  if (!nombre) return null;
  const cat = categorias.find(c => c.nombre === nombre);
  const bg = cat?.color ?? '#e5e7eb';
  return (
    <span style={{ backgroundColor: bg, color: autoText(bg) }} className="px-2 py-0.5 rounded-full text-xs font-semibold">
      {nombre}
    </span>
  );
}

interface Props {
  anio: number;
  mes: number;
  mesExists: boolean;
  meses: PersonalMes[];
  gastos: PersonalGastoMes[];
  ingresos: PersonalIngresoMes[];
  categorias: PersonalCategoria[];
  bancos: PersonalBanco[];
  gastosFijos: PersonalGastoFijo[];
}

type ModalState =
  | { type: 'none' }
  | { type: 'gasto'; item?: PersonalGastoMes }
  | { type: 'ingreso'; item?: PersonalIngresoMes }
  | { type: 'nuevoMes' };

export default function MesPersonalClient({
  anio, mes, mesExists,
  meses: initMeses,
  gastos: initGastos,
  ingresos: initIngresos,
  categorias: initCats,
  bancos,
  gastosFijos,
}: Props) {
  const router = useRouter();
  const [meses, setMeses] = useState(initMeses);
  const [gastos, setGastos] = useState(initGastos);
  const [ingresos, setIngresos] = useState(initIngresos);
  const [categorias, setCategorias] = useState(initCats);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [loading, setLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<{ msg: string; fn: () => Promise<void> } | null>(null);

  useEffect(() => { setMeses(initMeses); },   [initMeses]);
  useEffect(() => { setGastos(initGastos); },   [initGastos]);
  useEffect(() => { setIngresos(initIngresos); }, [initIngresos]);

  const totalIngresos  = ingresos.reduce((s, i) => s + i.importe, 0);
  const totalGastos    = gastos.reduce((s, g) => s + g.importe, 0);
  const balance        = totalIngresos - totalGastos;
  const nombre         = `${MESES_NOMBRES[mes - 1]} ${anio}`;

  // ── Gastos CRUD ─────────────────────────────────────────────────────────
  async function saveGasto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = { anio, mes, concepto: fd.get('concepto'), fecha: fd.get('fecha') || null, categoria: fd.get('categoria') || null, banco: fd.get('banco') || null, importe: parseFloat(fd.get('importe') as string) || 0, comentario: fd.get('comentario') || null };
    if (modal.type === 'gasto' && modal.item) {
      await fetch(`/api/personal/mes/gastos/${modal.item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/personal/mes/gastos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setModal({ type: 'none' }); router.refresh(); setLoading(false);
  }

  async function deleteGasto(id: number) {
    setConfirmState({ msg: '¿Eliminar este gasto?', fn: async () => {
      await fetch(`/api/personal/mes/gastos/${id}`, { method: 'DELETE' });
      setGastos(gastos.filter(g => g.id !== id));
    }});
  }

  // ── Ingresos CRUD ────────────────────────────────────────────────────────
  async function saveIngreso(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = { anio, mes, concepto: fd.get('concepto'), fecha: fd.get('fecha') || null, importe: parseFloat(fd.get('importe') as string) || 0, comentario: fd.get('comentario') || null };
    if (modal.type === 'ingreso' && modal.item) {
      await fetch(`/api/personal/mes/ingresos/${modal.item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/personal/mes/ingresos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setModal({ type: 'none' }); router.refresh(); setLoading(false);
  }

  async function deleteIngreso(id: number) {
    setConfirmState({ msg: '¿Eliminar este ingreso?', fn: async () => {
      await fetch(`/api/personal/mes/ingresos/${id}`, { method: 'DELETE' });
      setIngresos(ingresos.filter(i => i.id !== id));
    }});
  }

  // ── Sin meses creados — pantalla de primer arranque ─────────────────────
  if (!mesExists && meses.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(249,115,22,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Mes</h1>
        </div>
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(249,115,22,0.1)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Sin meses creados</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Crea tu primer mes para empezar a registrar ingresos y gastos personales.</p>
          <button
            onClick={() => setModal({ type: 'nuevoMes' })}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg shadow-orange-500/30"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
          >
            + Crear primer mes
          </button>
        </div>
        {modal.type === 'nuevoMes' && (
          <NuevoMesModal
            gastosFijos={gastosFijos}
            mesesCreados={meses}
            onClose={() => setModal({ type: 'none' })}
            onCreate={(a, m) => { setModal({ type: 'none' }); router.push(`/personal/mes/${a}/${m}`); }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(249,115,22,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>{nombre}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModal({ type: 'nuevoMes' })}
            className="px-4 py-2.5 text-sm font-semibold rounded-2xl border transition-colors"
            style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--btn-border)', color: 'var(--text-primary)' }}
          >
            + Nuevo mes
          </button>
          <div className="relative">
            <select
              className="appearance-none font-semibold text-sm rounded-2xl pl-4 pr-8 py-2.5 cursor-pointer focus:outline-none focus:ring-2 transition-colors shadow-lg"
              style={{ background: '#f97316', color: 'white', boxShadow: '0 2px 12px rgba(249,115,22,0.35)' }}
              value={`${anio}/${mes}`}
              onChange={e => {
                const [a, m] = e.target.value.split('/');
                router.push(`/personal/mes/${a}/${m}`);
              }}
            >
              {meses.map(m => (
                <option key={`${m.anio}/${m.mes}`} value={`${m.anio}/${m.mes}`}>
                  {MESES_NOMBRES[m.mes - 1]} {m.anio}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white text-xs">▼</span>
          </div>
        </div>
      </div>

      {/* ── Cards de resumen ── */}
      <div className="grid grid-cols-3 gap-2 md:gap-6">
        <div className="glass-card rounded-2xl md:rounded-3xl p-3 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-[10px] md:text-sm" style={{ color: 'var(--text-secondary)' }}>Ingresos</p>
              <h3 className="text-sm md:text-3xl font-extrabold mt-1 md:mt-3 leading-tight" style={{ color: 'var(--text-primary)' }}>{fmt(totalIngresos)}</h3>
              <p className="hidden md:block font-semibold mt-2 text-emerald-500 text-sm">{ingresos.length} entrada{ingresos.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="hidden md:flex w-12 h-12 rounded-2xl bg-emerald-100 items-center justify-center shrink-0">
              <BanknoteIcon className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl md:rounded-3xl p-3 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-[10px] md:text-sm" style={{ color: 'var(--text-secondary)' }}>Gastos</p>
              <h3 className="text-sm md:text-3xl font-extrabold mt-1 md:mt-3 leading-tight text-red-500">-{fmt(totalGastos)}</h3>
              <p className="hidden md:block font-semibold mt-2 text-amber-500 text-sm">{gastos.length} concepto{gastos.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="hidden md:flex w-12 h-12 rounded-2xl bg-orange-100 items-center justify-center shrink-0">
              <ReceiptIcon className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>

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
        onAdd={() => setModal({ type: 'ingreso' })}
      >
        {ingresos.length === 0 ? <EmptyRow /> : (
          <div className="overflow-x-auto">
            <table className="theme-table">
              <thead>
                <tr>
                  <Th>Concepto</Th>
                  <Th>Importe</Th>
                  <Th align="right">Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {ingresos.map(i => (
                  <tr key={i.id} className="group">
                    <td className="py-3 px-4">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{i.concepto}</span>
                      {i.comentario && <p className="text-xs truncate max-w-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{i.comentario}</p>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-emerald-500">{fmt(i.importe)}</td>
                    <td className="py-3 pr-3 text-right whitespace-nowrap">
                      <RowActions onEdit={() => setModal({ type: 'ingreso', item: i })} onDelete={() => deleteIngreso(i.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Gastos ── */}
      <Section
        title="Gastos" icon={<ReceiptIcon className="w-4 h-4" />} badge={fmt(totalGastos)}
        headerClass="bg-orange-600"
        onAdd={() => setModal({ type: 'gasto' })}
      >
        {gastos.length === 0 ? <EmptyRow /> : (
          <div className="overflow-x-auto">
            <table className="theme-table min-w-[600px]">
              <thead>
                <tr>
                  <Th>Concepto</Th>
                  <Th>Fecha</Th>
                  <Th>Importe</Th>
                  <Th>Categoría</Th>
                  <Th>Banco</Th>
                  <Th align="right">Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {gastos.map(g => {
                  const banco = bancos.find(b => b.nombre === g.banco);
                  return (
                    <tr key={g.id} className="group">
                      <td className="py-3 px-4">
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{g.concepto}</span>
                        {g.comentario && <p className="text-xs truncate max-w-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{g.comentario}</p>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>{fmtDate(g.fecha)}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-red-500">-{fmt(g.importe)}</td>
                      <td className="py-3 px-4 whitespace-nowrap"><CategoryBadge nombre={g.categoria} categorias={categorias} /></td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {banco ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: banco.color, color: autoText(banco.color) }}>{banco.nombre}</span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="py-3 pr-3 text-right whitespace-nowrap">
                        <RowActions onEdit={() => setModal({ type: 'gasto', item: g })} onDelete={() => deleteGasto(g.id)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Modales ── */}
      {modal.type === 'ingreso' && (
        <Modal title={modal.item ? 'Editar Ingreso' : 'Nuevo Ingreso'} onClose={() => setModal({ type: 'none' })}>
          <form onSubmit={saveIngreso} className="space-y-3">
            <Field label="Concepto" name="concepto" defaultValue={modal.item?.concepto} required />
            <Field label="Fecha" name="fecha" type="date" defaultValue={modal.item?.fecha?.split('T')[0]} />
            <Field label="Importe (€)" name="importe" type="number" step="0.01" defaultValue={modal.item?.importe?.toString()} />
            <Field label="Comentario" name="comentario" defaultValue={modal.item?.comentario ?? ''} />
            <FormActions loading={loading} onCancel={() => setModal({ type: 'none' })} />
          </form>
        </Modal>
      )}

      {modal.type === 'gasto' && (
        <Modal title={modal.item ? 'Editar Gasto' : 'Nuevo Gasto'} onClose={() => setModal({ type: 'none' })}>
          <form onSubmit={saveGasto} className="space-y-3">
            <Field label="Concepto" name="concepto" defaultValue={modal.item?.concepto} required />
            <Field label="Fecha" name="fecha" type="date" defaultValue={modal.item?.fecha?.split('T')[0] ?? new Date().toISOString().split('T')[0]} />
            <SelectField label="Categoría" name="categoria" options={categorias.map(c => c.nombre)} defaultValue={modal.item?.categoria ?? ''} />
            <SelectField label="Banco" name="banco" options={bancos.map(b => b.nombre)} defaultValue={modal.item?.banco ?? ''} />
            <Field label="Importe (€)" name="importe" type="number" step="0.01" defaultValue={modal.item?.importe?.toString()} />
            <Field label="Comentario" name="comentario" defaultValue={modal.item?.comentario ?? ''} />
            <FormActions loading={loading} onCancel={() => setModal({ type: 'none' })} />
          </form>
        </Modal>
      )}

      {modal.type === 'nuevoMes' && (
        <NuevoMesModal
          gastosFijos={gastosFijos}
          mesesCreados={meses}
          onClose={() => setModal({ type: 'none' })}
          onCreate={(a, m) => { setModal({ type: 'none' }); router.push(`/personal/mes/${a}/${m}`); }}
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return <th className={align === 'right' ? 'text-right' : ''}>{children}</th>;
}

function Section({ title, icon, badge, headerClass, onAdd, onGestionar, children }: {
  title: string; icon?: React.ReactNode; badge?: string; headerClass: string;
  onAdd?: () => void; onGestionar?: () => void; children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      <div className={`flex items-center justify-between px-5 py-4 ${headerClass}`}>
        <div className="flex items-center gap-3">
          {icon && <span className="text-white">{icon}</span>}
          <h2 className="font-bold text-white text-base">{title}</h2>
          {badge && <span className="text-sm text-white/80 font-mono">{badge}</span>}
        </div>
        <div className="flex items-center gap-2">
          {onGestionar && (
            <button onClick={onGestionar} className="py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors font-semibold flex items-center gap-1.5 px-2 sm:px-4">
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Gestionar</span>
            </button>
          )}
          {onAdd && (
            <button onClick={onAdd} className="py-1.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-2xl transition-colors px-2 sm:px-4">
              <span className="sm:hidden text-base leading-none">+</span>
              <span className="hidden sm:inline text-sm">+ Añadir</span>
            </button>
          )}
        </div>
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
      <button onClick={onEdit} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
        <PencilIcon />
      </button>
      <button onClick={onDelete} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 transition-colors">
        <TrashIcon />
      </button>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-xl" style={{ color: 'var(--text-muted)' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const fieldInputCls = 'w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 border transition-colors appearance-none';
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
      <select name={name} defaultValue={defaultValue} className={fieldInputCls} style={fieldInputStyle}>
        <option value="">— Sin categoría —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function FormActions({ loading, onCancel }: { loading: boolean; onCancel: () => void }) {
  return (
    <div className="flex gap-2 justify-end pt-2">
      <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium border-2 rounded-2xl"
        style={{ borderColor: 'var(--btn-border)', color: 'var(--text-secondary)' }}>
        Cancelar
      </button>
      <button type="submit" disabled={loading}
        className="px-4 py-2 text-sm font-bold text-white rounded-2xl shadow-lg shadow-orange-500/30 hover:opacity-90 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
        {loading ? 'Guardando…' : 'Guardar'}
      </button>
    </div>
  );
}

// ── Modal nuevo mes ───────────────────────────────────────────────────────────

function NuevoMesModal({ gastosFijos, mesesCreados, onClose, onCreate }: {
  gastosFijos: PersonalGastoFijo[];
  mesesCreados: PersonalMes[];
  onClose: () => void;
  onCreate: (anio: number, mes: number) => void;
}) {
  const now = new Date();
  const currentAnio = now.getFullYear();
  const currentMes  = now.getMonth() + 1;

  const [selectedAnio, setSelectedAnio] = useState(currentAnio);
  const [selectedMes,  setSelectedMes]  = useState(currentMes);
  const [importarFijos, setImportarFijos] = useState(gastosFijos.length > 0);
  const [sobrescribir, setSobrescribir] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const maxMes = selectedAnio === currentAnio ? currentMes : 12;
  const alreadyExists = mesesCreados.some(m => m.anio === selectedAnio && m.mes === selectedMes);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true); setError('');
    const res = await fetch('/api/personal/mes/meses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mes: selectedMes, anio: selectedAnio, importarFijos, sobrescribir }),
    });
    if (!res.ok) { setError((await res.json()).error ?? 'Error al crear el mes'); setCreating(false); return; }
    onCreate(selectedAnio, selectedMes);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid var(--divider)' }}>
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            {alreadyExists ? 'Gestionar mes' : '+ Crear nuevo mes'}
          </h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-lg" style={{ color: 'var(--text-secondary)' }}>×</button>
        </div>

        <form onSubmit={handleCreate}>
          <div className="px-6 py-5 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Mes</label>
              <select value={selectedMes} onChange={e => { setSelectedMes(Number(e.target.value)); setSobrescribir(false); }} className={fieldInputCls} style={fieldInputStyle}>
                {MESES_NOMBRES.map((m, i) => (
                  <option key={i} value={i + 1} disabled={i + 1 > maxMes}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Año</label>
              <input
                type="number"
                value={selectedAnio}
                max={currentAnio}
                onChange={e => {
                  const a = Math.min(parseInt(e.target.value) || currentAnio, currentAnio);
                  setSelectedAnio(a); setSobrescribir(false);
                  if (a === currentAnio && selectedMes > currentMes) setSelectedMes(currentMes);
                }}
                className={fieldInputCls} style={fieldInputStyle}
              />
            </div>
          </div>

          {alreadyExists ? (
            <div className="px-6 pb-5" style={{ borderTop: '1px solid var(--divider)' }}>
              <div className="mt-4 mb-3 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#f59e0b' }}>Este mes ya existe</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div onClick={() => setSobrescribir(v => !v)} className="w-10 h-6 rounded-full transition-colors relative shrink-0" style={{ background: sobrescribir ? '#ef4444' : 'var(--divider)' }}>
                  <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: sobrescribir ? '22px' : '4px' }} />
                </div>
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Sobrescribir con presupuesto</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Se borrarán todos los gastos actuales y se importará el presupuesto</p>
                </div>
              </label>
            </div>
          ) : gastosFijos.length > 0 ? (
            <div className="px-6 pb-4" style={{ borderTop: '1px solid var(--divider)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mt-4 mb-3" style={{ color: 'var(--text-muted)' }}>
                Gastos fijos del presupuesto
              </p>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div onClick={() => setImportarFijos(v => !v)} className="w-10 h-6 rounded-full transition-colors relative shrink-0" style={{ background: importarFijos ? '#f97316' : 'var(--divider)' }}>
                  <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: importarFijos ? '22px' : '4px' }} />
                </div>
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Importar presupuesto</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{gastosFijos.length} gasto{gastosFijos.length !== 1 ? 's' : ''} fijo{gastosFijos.length !== 1 ? 's' : ''}</p>
                </div>
              </label>
            </div>
          ) : null}

          {error && <p className="px-6 pb-3 text-sm text-red-500 font-medium">{error}</p>}

          <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--divider)' }}>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium border-2 rounded-2xl" style={{ borderColor: 'var(--btn-border)', color: 'var(--text-secondary)' }}>
              Cancelar
            </button>
            {alreadyExists ? (
              <button type="submit" disabled={creating || !sobrescribir}
                className="flex-1 py-2.5 text-sm font-bold text-white rounded-2xl shadow-lg shadow-red-500/30 disabled:opacity-40 transition-colors"
                style={{ background: sobrescribir ? '#ef4444' : 'var(--divider)' }}>
                {creating ? 'Sobrescribiendo…' : 'Sobrescribir →'}
              </button>
            ) : (
              <button type="submit" disabled={creating}
                className="flex-1 py-2.5 text-sm font-bold text-white rounded-2xl shadow-lg shadow-orange-500/30 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                {creating ? 'Creando…' : 'Crear mes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

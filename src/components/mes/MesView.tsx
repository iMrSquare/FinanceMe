'use client';

import { useState, type ReactNode } from 'react';
import { SortableTh, useTableSort, type SortAccessor } from '@/components/SortableTable';
import InfoExpand from '@/components/InfoExpand';
import { CalendarIcon, LockIcon, PencilIcon, ReceiptIcon, TrashIcon, UnlockIcon, BanknoteIcon } from '@/components/icons';
import Button, { IconButton } from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';
import Summary from '@/components/ui/Summary';
import Section from '@/components/ui/Section';
import SortSelect from '@/components/ui/SortSelect';
import Modal from '@/components/ui/Modal';
import Switch from '@/components/ui/Switch';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BankChip, CategoryBadge } from '@/components/ui/Chips';
import { EmptyState } from '@/components/ui/Feedback';
import { formatEUR, formatFechaCorta } from '@/lib/format';

export const MESES_NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export interface MesGastoRow { id: number; concepto: string; comentario: string | null; fecha: string | null; importe: number; categoria: string | null; banco: string | null; cobrado?: number | boolean }
export interface MesIngresoRow { id: number; concepto: string; comentario: string | null; fecha?: string | null; importe: number }
export interface Opcion { nombre: string; color: string; icono?: string | null }

type GastoKey = 'concepto' | 'fecha' | 'importe' | 'categoria' | 'banco';
const SORT_GASTOS: Record<GastoKey, SortAccessor<MesGastoRow>> = {
  concepto: { get: g => g.concepto, type: 'text' },
  fecha: { get: g => g.fecha, type: 'date' },
  importe: { get: g => g.importe, type: 'number' },
  categoria: { get: g => g.categoria, type: 'text' },
  banco: { get: g => g.banco, type: 'text' },
};
type IngresoKey = 'concepto' | 'fecha' | 'importe';
const SORT_INGRESOS: Record<IngresoKey, SortAccessor<MesIngresoRow>> = {
  concepto: { get: i => i.concepto, type: 'text' },
  fecha: { get: i => i.fecha ?? null, type: 'date' },
  importe: { get: i => i.importe, type: 'number' },
};
const byId = (a: { id: number }, b: { id: number }) => a.id - b.id;

const ORDEN_GASTOS = [
  { key: 'fecha', asc: true, label: 'Fecha (antiguos primero)' },
  { key: 'fecha', asc: false, label: 'Fecha (recientes primero)' },
  { key: 'importe', asc: false, label: 'Importe (mayor primero)' },
  { key: 'importe', asc: true, label: 'Importe (menor primero)' },
  { key: 'concepto', asc: true, label: 'Concepto (A–Z)' },
  { key: 'categoria', asc: true, label: 'Categoría (A–Z)' },
  { key: 'banco', asc: true, label: 'Banco (A–Z)' },
];

function CheckMark() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}

// Check de «ya ha venido» junto al nombre del concepto. Sin onToggle (mes bloqueado o sin
// permisos) solo muestra el estado
function CobradoCheck({ concepto, cobrado, onToggle }: { concepto: string; cobrado: boolean; onToggle?: () => void }) {
  const marca = (
    <span className="fm-check-box" data-on={cobrado || undefined} aria-hidden="true">
      {cobrado && <CheckMark />}
    </span>
  );
  if (!onToggle) {
    return cobrado ? <span className="fm-check" role="img" aria-label="Ya ha venido" title="Ya ha venido">{marca}</span> : null;
  }
  return (
    <button type="button" role="checkbox" aria-checked={cobrado} className="fm-check" onClick={onToggle}
      aria-label={`${concepto}: ${cobrado ? 'ya ha venido' : 'pendiente'}`} title={cobrado ? 'Ya ha venido' : 'Pendiente: marcar como venido'}>
      {marca}
    </button>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}

interface Props {
  scope: 'personal' | 'hogar';
  titulo: string;
  info: string;
  bloqueado: boolean;
  /** Puede bloquear/desbloquear y crear meses */
  canEdit: boolean;
  togglingBloqueo: boolean;
  onToggleBloqueo: () => void;
  meses: { value: string; label: string }[];
  mesActual: string;
  onSelectMes: (value: string) => void;
  onNuevoMes: () => void;
  /** Elimina el mes tras la doble confirmación; devuelve el error o null */
  onEliminarMes: (password: string) => Promise<string | null>;
  gastos: MesGastoRow[];
  ingresos: MesIngresoRow[];
  categorias: Opcion[];
  bancos: Opcion[];
  onAddGasto: () => void;
  onEditGasto: (g: MesGastoRow) => void;
  onToggleCobrado: (g: MesGastoRow) => void;
  onDeleteGasto: (g: MesGastoRow) => void;
  onAddIngreso: () => void;
  onEditIngreso: (i: MesIngresoRow) => void;
  onDeleteIngreso: (i: MesIngresoRow) => void;
}

export default function MesView(p: Props) {
  const puedeEditar = p.canEdit && !p.bloqueado;
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [eliminar, setEliminar] = useState<'aviso' | 'password' | null>(null);
  const sortGas = useTableSort(p.gastos, SORT_GASTOS, { defaultKey: 'fecha', storageKey: `sort:${p.scope}-mes-gastos`, tieBreak: byId });
  const sortIng = useTableSort(p.ingresos, SORT_INGRESOS, { defaultKey: 'concepto', storageKey: `sort:${p.scope}-mes-ingresos`, tieBreak: byId });
  const conFecha = p.ingresos.some(i => i.fecha !== undefined);

  const cat = (n: string | null) => p.categorias.find(c => c.nombre === n);
  const banco = (n: string | null) => p.bancos.find(b => b.nombre === n);

  const totalIngresos = p.ingresos.reduce((s, i) => s + (i.importe || 0), 0);
  const totalGastos = p.gastos.reduce((s, g) => s + (g.importe || 0), 0);
  const cobrados = p.gastos.filter(g => g.cobrado).length;
  const toggleCobrado = (g: MesGastoRow) => (puedeEditar ? () => p.onToggleCobrado(g) : undefined);
  const gastosVisibles = soloPendientes ? sortGas.sorted.filter(g => !g.cobrado) : sortGas.sorted;
  // En escritorio va en la cabecera de Gastos; en móvil, en la barra de «Ordenar por»
  const filtroPendientes = (
    <button type="button" className="fm-check-filter" aria-pressed={soloPendientes} onClick={() => setSoloPendientes(v => !v)}
      title={soloPendientes ? 'Mostrar todos los conceptos' : 'Mostrar solo los que faltan por venir'}>
      <span className="fm-check-box" data-on={soloPendientes || undefined} aria-hidden="true">{soloPendientes && <CheckMark />}</span>
      Solo pendientes
    </button>
  );
  const balance = totalIngresos - totalGastos;
  const margen = totalIngresos > 0 ? Math.round((balance / totalIngresos) * 100) : null;

  return (
    <div>
      <PageHeader
        title={<span className="inline-flex items-center gap-2">{p.titulo}{p.bloqueado && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium align-middle" style={{ background: 'color-mix(in srgb, var(--money-out) 12%, transparent)', color: 'var(--money-out)' }}>
            <LockIcon className="w-3 h-3" /><span className="hidden sm:inline">Bloqueado</span>
          </span>
        )}</span>}
        info={<InfoExpand title="¿Qué es Mes?"><p>{p.info}</p></InfoExpand>}
        stackOnMobile
        actions={<>
          {/* Eliminar y candado lejos del selector y de «Nuevo mes» para evitar toques accidentales */}
          {p.canEdit && (
            <IconButton label={p.bloqueado ? 'Desbloquea el mes para eliminarlo' : 'Eliminar mes'} onClick={() => setEliminar('aviso')} disabled={p.bloqueado}
              className="!w-11 !h-11 border border-[var(--btn-border)] bg-[var(--bg-card)] hover:!text-money-out">
              <TrashIcon />
            </IconButton>
          )}
          {p.canEdit && (
            <IconButton label={p.bloqueado ? 'Desbloquear mes' : 'Bloquear mes'} onClick={p.onToggleBloqueo} disabled={p.togglingBloqueo}
              className="!w-11 !h-11 border border-[var(--btn-border)] bg-[var(--bg-card)]" style={p.bloqueado ? { color: 'var(--money-out)' } : undefined}>
              {p.bloqueado ? <LockIcon /> : <UnlockIcon />}
            </IconButton>
          )}
          <label className="sr-only" htmlFor="selector-mes">Cambiar de mes</label>
          <select id="selector-mes" className="fm-input !w-auto !min-h-11 !py-2 max-w-[170px] font-medium" value={p.mesActual} onChange={e => p.onSelectMes(e.target.value)}>
            {p.meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          {p.canEdit && (
            <Button onClick={p.onNuevoMes} compactOnMobile className="max-sm:!w-auto max-sm:!px-3"
              icon={<span className="inline-flex items-center gap-0.5" aria-hidden="true"><PlusIcon /><CalendarIcon /></span>}>Nuevo mes</Button>
          )}
        </>}
      />

      <Summary
        label="Balance del mes"
        value={formatEUR(balance, { signo: true })}
        tone={balance > 0 ? 'in' : balance < 0 ? 'out' : 'neutral'}
        note={balance > 0 ? `Superávit: te sobran ${formatEUR(balance)} este mes` : balance < 0 ? `Déficit: has gastado ${formatEUR(-balance)} más de lo que ha entrado` : 'Ingresos y gastos igualados'}
        stats={[
          { label: 'Ingresos', value: formatEUR(totalIngresos), tone: 'in', sub: `${p.ingresos.length} entrada${p.ingresos.length !== 1 ? 's' : ''}` },
          { label: 'Gastos', value: formatEUR(totalGastos), tone: 'out', sub: `${p.gastos.length} concepto${p.gastos.length !== 1 ? 's' : ''}${p.gastos.length ? ` · ${cobrados} ya ${cobrados !== 1 ? 'han' : 'ha'} venido` : ''}` },
          { label: 'Margen', value: margen === null ? '—' : `${margen} %`, tone: margen !== null && margen < 0 ? 'out' : 'neutral', sub: 'de los ingresos sin gastar' },
        ]}
      />

      <Section id="sec-gastos" title="Gastos" count={p.gastos.length} total={formatEUR(totalGastos)} tone="out" toneTotal
        beforeTotal={p.gastos.length > 0 ? <div className="max-sm:hidden">{filtroPendientes}</div> : undefined}
        actions={puedeEditar ? <Button size="sm" icon={<PlusIcon />} onClick={p.onAddGasto} compactOnMobile className="shrink-0">Añadir</Button> : undefined}>
        {p.gastos.length === 0 ? (
          <EmptyState icon={<ReceiptIcon />} title="Aún no hay gastos este mes"
            text={puedeEditar ? 'Añade el primero. Al crear un mes también puedes importar los gastos fijos del Presupuesto.' : undefined}
            action={puedeEditar ? <Button variant="primary" icon={<PlusIcon />} onClick={p.onAddGasto}>Añadir gasto</Button> : undefined} />
        ) : gastosVisibles.length === 0 ? (
          <EmptyState title="Ya ha venido todo" text="No queda ningún concepto pendiente este mes."
            action={<Button onClick={() => setSoloPendientes(false)}>Mostrar todos</Button>} />
        ) : (
          <>
            <SortSelect opciones={ORDEN_GASTOS} sortKey={sortGas.sortKey} sortAsc={sortGas.sortAsc} onChange={(k, asc) => sortGas.setSort(k as GastoKey, asc)} extra={filtroPendientes} />
            <table className="fm-table">
              <thead>
                <tr>
                  <SortableTh label="Concepto" sortKey="concepto" activeKey={sortGas.sortKey} asc={sortGas.sortAsc} onSort={sortGas.toggleSort} />
                  <SortableTh label="Fecha" sortKey="fecha" activeKey={sortGas.sortKey} asc={sortGas.sortAsc} onSort={sortGas.toggleSort} />
                  <SortableTh label="Categoría" sortKey="categoria" activeKey={sortGas.sortKey} asc={sortGas.sortAsc} onSort={sortGas.toggleSort} />
                  <SortableTh label="Banco" sortKey="banco" activeKey={sortGas.sortKey} asc={sortGas.sortAsc} onSort={sortGas.toggleSort} />
                  <SortableTh label="Importe" sortKey="importe" activeKey={sortGas.sortKey} asc={sortGas.sortAsc} onSort={sortGas.toggleSort} align="right" className="fm-num" />
                  {puedeEditar && <th style={{ width: 96 }} aria-label="Acciones" />}
                </tr>
              </thead>
              <tbody>
                {gastosVisibles.map(g => (
                  <tr key={g.id}>
                    <td>
                      <span className="flex items-center gap-3">
                        <CategoryBadge color={cat(g.categoria)?.color} icono={cat(g.categoria)?.icono} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 font-medium">{g.concepto}<CobradoCheck concepto={g.concepto} cobrado={!!g.cobrado} onToggle={toggleCobrado(g)} /></span>
                          {g.comentario && <span className="block text-[13px] truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{g.comentario}</span>}
                        </span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{formatFechaCorta(g.fecha)}</td>
                    <td style={{ color: g.categoria ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{g.categoria ?? '—'}</td>
                    <td><BankChip nombre={g.banco} color={banco(g.banco)?.color} /></td>
                    <td className="fm-num text-money-out">{formatEUR(g.importe)}</td>
                    {puedeEditar && (
                      <td>
                        <div className="fm-row-actions">
                          <IconButton label={`Editar ${g.concepto}`} onClick={() => p.onEditGasto(g)}><PencilIcon /></IconButton>
                          <IconButton label={`Eliminar ${g.concepto}`} onClick={() => p.onDeleteGasto(g)} className="hover:!text-money-out"><TrashIcon /></IconButton>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="fm-list">
              {gastosVisibles.map(g => {
                const c = cat(g.categoria);
                const contenido = (
                  <>
                    <CategoryBadge color={c?.color} icono={c?.icono} />
                    <span className="fm-list-body">
                      <span className="fm-list-title-row">
                        <span className="fm-list-title">{g.concepto}</span>
                        <CobradoCheck concepto={g.concepto} cobrado={!!g.cobrado} onToggle={toggleCobrado(g)} />
                      </span>
                      <span className="fm-list-meta">
                        <span>{formatFechaCorta(g.fecha)}</span>
                        {g.categoria && <span>{g.categoria}</span>}
                        {g.banco && <BankChip nombre={g.banco} color={banco(g.banco)?.color} />}
                      </span>
                    </span>
                    <span className="fm-list-amount text-money-out">{formatEUR(g.importe)}</span>
                  </>
                );
                // El check va dentro de la fila: la edición es un botón que cubre la fila por detrás
                // (no se puede anidar un botón dentro de otro)
                return (
                  <li key={g.id}>
                    <div className="fm-list-item relative">
                      {puedeEditar && <button type="button" className="fm-list-hit" onClick={() => p.onEditGasto(g)} aria-label={`${g.concepto}, ${formatEUR(g.importe)}. Editar`} />}
                      {contenido}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Section>

      <Section id="sec-ingresos" title="Ingresos" count={p.ingresos.length} total={formatEUR(totalIngresos)} tone="in" toneTotal
        actions={puedeEditar ? <Button size="sm" icon={<PlusIcon />} onClick={p.onAddIngreso} compactOnMobile>Añadir</Button> : undefined}>
        {p.ingresos.length === 0 ? (
          <EmptyState icon={<BanknoteIcon />} title="Aún no hay ingresos este mes"
            action={puedeEditar ? <Button variant="primary" icon={<PlusIcon />} onClick={p.onAddIngreso}>Añadir ingreso</Button> : undefined} />
        ) : (
          <>
            <table className="fm-table">
              <thead>
                <tr>
                  <SortableTh label="Concepto" sortKey="concepto" activeKey={sortIng.sortKey} asc={sortIng.sortAsc} onSort={sortIng.toggleSort} />
                  {conFecha && <SortableTh label="Fecha" sortKey="fecha" activeKey={sortIng.sortKey} asc={sortIng.sortAsc} onSort={sortIng.toggleSort} />}
                  <SortableTh label="Importe" sortKey="importe" activeKey={sortIng.sortKey} asc={sortIng.sortAsc} onSort={sortIng.toggleSort} align="right" className="fm-num" />
                  {puedeEditar && <th style={{ width: 96 }} aria-label="Acciones" />}
                </tr>
              </thead>
              <tbody>
                {sortIng.sorted.map(i => (
                  <tr key={i.id}>
                    <td>
                      <span className="font-medium">{i.concepto}</span>
                      {i.comentario && <span className="block text-[13px] truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{i.comentario}</span>}
                    </td>
                    {conFecha && <td className="whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{formatFechaCorta(i.fecha)}</td>}
                    <td className="fm-num text-money-in">{formatEUR(i.importe)}</td>
                    {puedeEditar && (
                      <td>
                        <div className="fm-row-actions">
                          <IconButton label={`Editar ${i.concepto}`} onClick={() => p.onEditIngreso(i)}><PencilIcon /></IconButton>
                          <IconButton label={`Eliminar ${i.concepto}`} onClick={() => p.onDeleteIngreso(i)} className="hover:!text-money-out"><TrashIcon /></IconButton>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="fm-list">
              {sortIng.sorted.map(i => {
                const contenido = (
                  <>
                    <span className="fm-list-body">
                      <span className="fm-list-title">{i.concepto}</span>
                      {(conFecha || i.comentario) && <span className="fm-list-meta">{conFecha ? formatFechaCorta(i.fecha) : i.comentario}</span>}
                    </span>
                    <span className="fm-list-amount text-money-in">{formatEUR(i.importe)}</span>
                  </>
                );
                return (
                  <li key={i.id}>
                    {puedeEditar
                      ? <button type="button" className="fm-list-item" onClick={() => p.onEditIngreso(i)} aria-label={`${i.concepto}, ${formatEUR(i.importe)}. Editar`}>{contenido}</button>
                      : <div className="fm-list-item">{contenido}</div>}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Section>

      {eliminar === 'aviso' && (
        <ConfirmDialog message={`¿Eliminar ${p.titulo}?`} confirmLabel="Continuar"
          detail={`Se borrará el mes con sus ${p.gastos.length} gasto${p.gastos.length !== 1 ? 's' : ''} y ${p.ingresos.length} ingreso${p.ingresos.length !== 1 ? 's' : ''}. El Presupuesto y los módulos no se tocan.`}
          onConfirm={() => setEliminar('password')} onCancel={() => setEliminar(null)} />
      )}
      {eliminar === 'password' && <EliminarMesModal titulo={p.titulo} onClose={() => setEliminar(null)} onConfirm={p.onEliminarMes} />}
    </div>
  );
}

// Segundo aviso: hay que escribir la contraseña para eliminar el mes
function EliminarMesModal({ titulo, onClose, onConfirm }: { titulo: string; onClose: () => void; onConfirm: (password: string) => Promise<string | null> }) {
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  async function confirmar() {
    if (!password) return;
    setEnviando(true); setError('');
    const err = await onConfirm(password);
    if (err) { setError(err); setEnviando(false); }
  }
  return (
    <Modal title={`Eliminar ${titulo} definitivamente`} onClose={onClose} width="420px"
      footer={<>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="danger" onClick={confirmar} disabled={enviando || !password}
          className="!bg-money-out !text-[var(--on-accent)] !border-transparent hover:!brightness-95">{enviando ? 'Eliminando…' : 'Eliminar mes'}</Button>
      </>}>
      <form onSubmit={e => { e.preventDefault(); confirmar(); }}>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Esta acción no se puede deshacer. Escribe tu contraseña para confirmar que quieres eliminar {titulo}.
        </p>
        <label htmlFor="em-password" className="fm-label">Contraseña</label>
        <input id="em-password" className="fm-input" type="password" autoComplete="current-password" autoFocus
          value={password} onChange={e => setPassword(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'em-error' : undefined} />
        {error && <p id="em-error" className="mt-2 text-sm font-medium text-money-out" role="alert">{error}</p>}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

// ── Primer arranque ─────────────────────────────────────────────────────────
export function SinMeses({ canEdit, texto, onCrear, children }: { canEdit: boolean; texto: string; onCrear: () => void; children?: ReactNode }) {
  return (
    <div>
      <PageHeader title="Mes" />
      <div className="fm-card">
        <EmptyState icon={<CalendarIcon />} title="Aún no has creado ningún mes" text={texto}
          action={canEdit ? <Button variant="primary" icon={<PlusIcon />} onClick={onCrear}>Crear el primer mes</Button> : undefined} />
      </div>
      {children}
    </div>
  );
}

// ── Formularios ─────────────────────────────────────────────────────────────
export interface GastoForm { id?: number; concepto: string; importe: string; fecha: string; categoria: string; banco: string; comentario: string }
export interface IngresoForm { id?: number; concepto: string; importe: string; fecha: string; comentario: string }

const hoyISO = () => new Date().toISOString().split('T')[0];
export const gastoVacio = (): GastoForm => ({ concepto: '', importe: '', fecha: hoyISO(), categoria: '', banco: '', comentario: '' });
export const gastoAForm = (g: MesGastoRow): GastoForm => ({ id: g.id, concepto: g.concepto, importe: String(g.importe), fecha: g.fecha?.split('T')[0] ?? '', categoria: g.categoria ?? '', banco: g.banco ?? '', comentario: g.comentario ?? '' });
export const ingresoVacio = (): IngresoForm => ({ concepto: '', importe: '', fecha: '', comentario: '' });
export const ingresoAForm = (i: MesIngresoRow): IngresoForm => ({ id: i.id, concepto: i.concepto, importe: String(i.importe), fecha: i.fecha?.split('T')[0] ?? '', comentario: i.comentario ?? '' });

function Campo({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return <div className="mb-3.5"><label htmlFor={id} className="fm-label">{label}</label>{children}</div>;
}

export function GastoFormModal({ form, setForm, categorias, bancos, onClose, onSave, saving }: {
  form: GastoForm; setForm: (f: GastoForm) => void; categorias: Opcion[]; bancos: Opcion[]; onClose: () => void; onSave: () => void; saving: boolean;
}) {
  const set = (k: keyof GastoForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  const valido = form.concepto.trim() && form.importe !== '';
  return (
    <Modal title={form.id ? 'Editar gasto' : 'Nuevo gasto'} onClose={onClose}
      footer={<>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={onSave} disabled={saving || !valido}>{saving ? 'Guardando…' : 'Guardar gasto'}</Button>
      </>}>
      <form onSubmit={e => { e.preventDefault(); if (valido) onSave(); }}>
        <Campo id="g-concepto" label="Concepto"><input id="g-concepto" className="fm-input" value={form.concepto} onChange={set('concepto')} placeholder="Ej: Supermercado" /></Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo id="g-importe" label="Importe (€)"><input id="g-importe" className="fm-input" type="number" step="0.01" min="0" inputMode="decimal" value={form.importe} onChange={set('importe')} placeholder="0,00" /></Campo>
          <Campo id="g-fecha" label="Fecha"><input id="g-fecha" className="fm-input" type="date" value={form.fecha} onChange={set('fecha')} /></Campo>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo id="g-cat" label="Categoría">
            <select id="g-cat" className="fm-input" value={form.categoria} onChange={set('categoria')}>
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}
            </select>
          </Campo>
          <Campo id="g-banco" label="Banco">
            <select id="g-banco" className="fm-input" value={form.banco} onChange={set('banco')}>
              <option value="">Sin banco</option>
              {bancos.map(b => <option key={b.nombre} value={b.nombre}>{b.nombre}</option>)}
            </select>
          </Campo>
        </div>
        <Campo id="g-coment" label="Comentario"><input id="g-coment" className="fm-input" value={form.comentario} onChange={set('comentario')} placeholder="Opcional" /></Campo>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export function IngresoFormModal({ form, setForm, conFecha, onClose, onSave, saving }: {
  form: IngresoForm; setForm: (f: IngresoForm) => void; conFecha: boolean; onClose: () => void; onSave: () => void; saving: boolean;
}) {
  const set = (k: keyof IngresoForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  const valido = form.concepto.trim() && form.importe !== '';
  return (
    <Modal title={form.id ? 'Editar ingreso' : 'Nuevo ingreso'} onClose={onClose}
      footer={<>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={onSave} disabled={saving || !valido}>{saving ? 'Guardando…' : 'Guardar ingreso'}</Button>
      </>}>
      <form onSubmit={e => { e.preventDefault(); if (valido) onSave(); }}>
        <Campo id="i-concepto" label="Concepto"><input id="i-concepto" className="fm-input" value={form.concepto} onChange={set('concepto')} placeholder="Ej: Nómina" /></Campo>
        <div className={conFecha ? 'grid grid-cols-2 gap-3' : ''}>
          <Campo id="i-importe" label="Importe (€)"><input id="i-importe" className="fm-input" type="number" step="0.01" min="0" inputMode="decimal" value={form.importe} onChange={set('importe')} placeholder="0,00" /></Campo>
          {conFecha && <Campo id="i-fecha" label="Fecha"><input id="i-fecha" className="fm-input" type="date" value={form.fecha} onChange={set('fecha')} /></Campo>}
        </div>
        <Campo id="i-coment" label="Comentario"><input id="i-coment" className="fm-input" value={form.comentario} onChange={set('comentario')} placeholder="Opcional" /></Campo>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

// ── Crear / sobrescribir mes ────────────────────────────────────────────────
export function NuevoMesModal({ meses, resumenFijos, presupuestoHref, onClose, onSubmit }: {
  meses: { anio: number; mes: number }[];
  /** «3 gastos fijos · 1 ingreso fijo»; null mientras carga; '' si no hay */
  resumenFijos: string | null;
  presupuestoHref: string;
  onClose: () => void;
  onSubmit: (d: { mes: number; anio: number; importarFijos: boolean; sobrescribir: boolean }) => Promise<string | null>;
}) {
  const now = new Date();
  const anioActual = now.getFullYear();
  const mesActual = now.getMonth() + 1;

  const [anio, setAnio] = useState(anioActual);
  const [mes, setMes] = useState(mesActual);
  const [importar, setImportar] = useState(true);
  const [sobrescribir, setSobrescribir] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');

  const existe = meses.some(m => m.anio === anio && m.mes === mes);
  // Cualquier mes: diez años atrás y cinco adelante, más los años que ya tengan meses
  const rango = Array.from({ length: 16 }, (_, i) => anioActual - 10 + i);
  const anios = [...new Set([...meses.map(m => m.anio), ...rango])].sort((a, b) => b - a);

  async function enviar() {
    setCreando(true); setError('');
    const err = await onSubmit({ mes, anio, importarFijos: importar, sobrescribir });
    if (err) { setError(err); setCreando(false); }
  }

  return (
    <Modal title={existe ? 'Este mes ya existe' : 'Nuevo mes'} onClose={onClose}
      footer={<>
        <Button onClick={onClose}>Cancelar</Button>
        {existe
          ? <Button variant="danger" onClick={enviar} disabled={creando || !sobrescribir}>{creando ? 'Sobrescribiendo…' : 'Sobrescribir mes'}</Button>
          : <Button variant="primary" onClick={enviar} disabled={creando}>{creando ? 'Creando…' : 'Crear mes'}</Button>}
      </>}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label htmlFor="nm-mes" className="fm-label">Mes</label>
          <select id="nm-mes" className="fm-input" value={mes} onChange={e => { setMes(Number(e.target.value)); setSobrescribir(false); }}>
            {MESES_NOMBRES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="nm-anio" className="fm-label">Año</label>
          <select id="nm-anio" className="fm-input" value={anio} onChange={e => { setAnio(Number(e.target.value)); setSobrescribir(false); }}>
            {anios.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>
      {existe ? (
        <div className="rounded-[var(--radius-control)] p-3" style={{ background: 'color-mix(in srgb, var(--money-out) 8%, transparent)' }}>
          <Switch checked={sobrescribir} onChange={setSobrescribir} tone="danger" label="Sobrescribir con el Presupuesto"
            description="Se borrarán los gastos e ingresos actuales de este mes y se volverán a importar los del Presupuesto." />
        </div>
      ) : resumenFijos === '' ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Tu Presupuesto está vacío. <a href={presupuestoHref} className="underline font-medium" style={{ color: 'var(--accent-mode)' }}>Configúralo</a> para importar los gastos fijos al crear cada mes.
        </p>
      ) : (
        <Switch checked={importar} onChange={setImportar} label="Importar el Presupuesto" description={resumenFijos ?? 'Cargando…'} />
      )}
      {error && <p className="mt-3 text-sm font-medium text-money-out" role="alert">{error}</p>}
    </Modal>
  );
}

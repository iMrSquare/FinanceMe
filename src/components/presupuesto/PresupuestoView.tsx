'use client';

import type { ReactNode } from 'react';
import { SortableTh, useTableSort, type SortAccessor } from '@/components/SortableTable';
import InfoExpand from '@/components/InfoExpand';
import { BanknoteIcon, PencilIcon, ReceiptIcon, RepeatIcon, SettingsIcon, TrashIcon } from '@/components/icons';
import Button, { IconButton } from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';
import Summary from '@/components/ui/Summary';
import Section from '@/components/ui/Section';
import SortSelect from '@/components/ui/SortSelect';
import Modal from '@/components/ui/Modal';
import { BankChip, CategoryBadge } from '@/components/ui/Chips';
import { EmptyState, SkeletonRows } from '@/components/ui/Feedback';
import { formatEUR } from '@/lib/format';
import type { Opcion } from '@/components/mes/MesView';

export interface FijoRow { id: number; concepto: string; comentario: string | null; importe: number; categoria: string | null; banco: string | null; cobro: string | null; vencimiento: string | null }
export interface AutoRow {
  key: string; tipo: string; concepto: string; subtitulo: string; importe: number; categoria: string | null; banco: string | null;
  /** Recurrente desglosado: se edita individualmente (categoría y banco) */
  recurrenteId?: number;
  cobroTexto?: string;
}
export interface IngresoFijoRow { id: number; concepto: string; comentario: string | null; importe: number }

type Key = 'concepto' | 'importe' | 'categoria' | 'banco' | 'cobro' | 'vencimiento';
export const diaCobro = (c: string | null): number | null => {
  if (!c) return null;
  const n = parseInt(c);
  if (!isNaN(n) && n >= 1 && n <= 31 && !c.includes('-')) return n;
  const d = new Date(c);
  return isNaN(d.getTime()) ? null : d.getDate();
};
const SORT: Record<Key, SortAccessor<FijoRow>> = {
  concepto: { get: f => f.concepto, type: 'text' },
  importe: { get: f => f.importe, type: 'number' },
  categoria: { get: f => f.categoria, type: 'text' },
  banco: { get: f => f.banco, type: 'text' },
  cobro: { get: f => diaCobro(f.cobro), type: 'number' },
  vencimiento: { get: f => f.vencimiento, type: 'date' },
};
const ORDEN = [
  { key: 'concepto', asc: true, label: 'Concepto (A–Z)' },
  { key: 'importe', asc: false, label: 'Importe (mayor primero)' },
  { key: 'importe', asc: true, label: 'Importe (menor primero)' },
  { key: 'cobro', asc: true, label: 'Día de cobro' },
  { key: 'categoria', asc: true, label: 'Categoría (A–Z)' },
  { key: 'banco', asc: true, label: 'Banco (A–Z)' },
  { key: 'vencimiento', asc: true, label: 'Vencimiento' },
];

const fmtVenc = (v: string | null) => {
  if (!v) return '—';
  const d = new Date(v.split('T')[0] + 'T00:00:00');
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}

function AutoBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-px rounded-full text-xs font-medium align-middle whitespace-nowrap"
      style={{ background: 'color-mix(in srgb, var(--accent-mode) 12%, transparent)', color: 'var(--accent-mode)' }}>
      <RepeatIcon className="w-3 h-3" />Automático
    </span>
  );
}

interface Props {
  scope: 'personal' | 'hogar';
  canEdit: boolean;
  loading?: boolean;
  info: string;
  fijos: FijoRow[];
  autos: AutoRow[];
  ingresos: IngresoFijoRow[];
  categorias: Opcion[];
  bancos: Opcion[];
  filtroCategoria: string;
  filtroBanco: string;
  onFiltro: (f: { categoria?: string; banco?: string }) => void;
  onAddFijo: () => void;
  onEditFijo: (f: FijoRow) => void;
  onDeleteFijo: (f: FijoRow) => void;
  onEditAuto: (a: AutoRow) => void;
  onAddIngreso: () => void;
  onEditIngreso: (i: IngresoFijoRow) => void;
  onDeleteIngreso: (i: IngresoFijoRow) => void;
  onGestion?: () => void;
}

export default function PresupuestoView(p: Props) {
  const coincide = (x: { categoria: string | null; banco: string | null }) =>
    (!p.filtroCategoria || x.categoria === p.filtroCategoria) && (!p.filtroBanco || x.banco === p.filtroBanco);
  const fijosFiltrados = p.fijos.filter(coincide);
  const autosFiltrados = p.autos.filter(coincide);
  const sort = useTableSort(fijosFiltrados, SORT, { defaultKey: 'concepto', storageKey: `sort:${p.scope}-presupuesto` });

  const cat = (n: string | null) => p.categorias.find(c => c.nombre === n);
  const banco = (n: string | null) => p.bancos.find(b => b.nombre === n);

  const totalFijos = p.fijos.reduce((s, f) => s + f.importe, 0);
  const totalAutos = p.autos.reduce((s, a) => s + a.importe, 0);
  const totalGastos = totalFijos + totalAutos;
  const totalIngresos = p.ingresos.reduce((s, i) => s + i.importe, 0);
  const margen = totalIngresos - totalGastos;
  const filtrando = !!(p.filtroCategoria || p.filtroBanco);
  const totalVisible = [...fijosFiltrados, ...autosFiltrados].reduce((s, x) => s + x.importe, 0);
  const nVisibles = fijosFiltrados.length + autosFiltrados.length;

  const acciones = (f: FijoRow) => (
    <div className="fm-row-actions">
      <IconButton label={`Editar ${f.concepto}`} onClick={() => p.onEditFijo(f)}><PencilIcon /></IconButton>
      <IconButton label={`Eliminar ${f.concepto}`} onClick={() => p.onDeleteFijo(f)} className="hover:!text-money-out"><TrashIcon /></IconButton>
    </div>
  );

  const filaMovil = (key: string | number, contenido: ReactNode, onClick?: () => void, label?: string) => (
    <li key={key}>
      {onClick
        ? <button type="button" className="fm-list-item" onClick={onClick} aria-label={label}>{contenido}</button>
        : <div className="fm-list-item">{contenido}</div>}
    </li>
  );

  return (
    <div>
      <PageHeader
        title="Presupuesto"
        subtitle="Gastos e ingresos fijos que se importan al crear cada mes"
        info={<InfoExpand title="¿Qué es Presupuesto?"><p>{p.info}</p></InfoExpand>}
        actions={<>
          {p.onGestion && <Button onClick={p.onGestion} icon={<SettingsIcon />} compactOnMobile>Categorías y Bancos</Button>}
          {p.canEdit && <Button variant="primary" onClick={p.onAddFijo} icon={<PlusIcon />} compactOnMobile>Nuevo gasto fijo</Button>}
        </>}
      />

      <Summary
        label="Gastos fijos al mes"
        value={formatEUR(totalGastos)}
        tone="out"
        note={totalAutos > 0 ? `${formatEUR(totalFijos)} fijos + ${formatEUR(totalAutos)} automáticos` : `${p.fijos.length} concepto${p.fijos.length !== 1 ? 's' : ''}`}
        stats={[
          { label: 'Ingresos fijos', value: formatEUR(totalIngresos), tone: 'in', sub: `${p.ingresos.length} entrada${p.ingresos.length !== 1 ? 's' : ''}` },
          { label: 'Margen', value: formatEUR(margen, { signo: margen < 0 }), tone: margen < 0 ? 'out' : 'neutral', sub: 'tras los gastos fijos' },
          { label: 'Automáticos', value: formatEUR(totalAutos), sub: 'recurrentes y ahorro' },
        ]}
      />

      <Section id="sec-fijos" title="Gastos fijos" count={p.fijos.length + p.autos.length} total={formatEUR(totalGastos)} tone="out" toneTotal>
        {(p.categorias.length > 0 || p.bancos.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3" style={{ borderBottom: '1px solid var(--border-card)' }}>
            <label className="sr-only" htmlFor="f-cat">Filtrar por categoría</label>
            <select id="f-cat" className="fm-input !w-auto !min-h-10 !py-1.5 flex-1 sm:flex-none min-w-0" value={p.filtroCategoria} onChange={e => p.onFiltro({ categoria: e.target.value })}>
              <option value="">Todas las categorías</option>
              {p.categorias.map(c => <option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}
            </select>
            <label className="sr-only" htmlFor="f-banco">Filtrar por banco</label>
            <select id="f-banco" className="fm-input !w-auto !min-h-10 !py-1.5 flex-1 sm:flex-none min-w-0" value={p.filtroBanco} onChange={e => p.onFiltro({ banco: e.target.value })}>
              <option value="">Todos los bancos</option>
              {p.bancos.map(b => <option key={b.nombre} value={b.nombre}>{b.nombre}</option>)}
            </select>
            {filtrando && (
              <>
                <Button size="sm" variant="ghost" onClick={() => p.onFiltro({ categoria: '', banco: '' })}>Quitar filtros</Button>
                <span className="ml-auto text-sm" style={{ color: 'var(--text-muted)' }} aria-live="polite">
                  {nVisibles} de {p.fijos.length + p.autos.length} · <strong style={{ color: 'var(--text-primary)' }}>{formatEUR(totalVisible)}</strong>
                </span>
              </>
            )}
          </div>
        )}

        {p.loading ? <SkeletonRows /> : nVisibles === 0 ? (
          filtrando
            ? <EmptyState title="Ningún gasto coincide con los filtros" action={<Button onClick={() => p.onFiltro({ categoria: '', banco: '' })}>Quitar filtros</Button>} />
            : <EmptyState icon={<ReceiptIcon />} title="Tu presupuesto está vacío"
                text="Añade los gastos que se repiten cada mes (hipoteca, suministros, seguros…). Se importarán al crear cada mes."
                action={p.canEdit ? <Button variant="primary" icon={<PlusIcon />} onClick={p.onAddFijo}>Nuevo gasto fijo</Button> : undefined} />
        ) : (
          <>
            <SortSelect opciones={ORDEN} sortKey={sort.sortKey} sortAsc={sort.sortAsc} onChange={(k, asc) => sort.setSort(k as Key, asc)} />
            <table className="fm-table">
              <thead>
                <tr>
                  <SortableTh label="Concepto" sortKey="concepto" activeKey={sort.sortKey} asc={sort.sortAsc} onSort={sort.toggleSort} />
                  <SortableTh label="Cobro" sortKey="cobro" activeKey={sort.sortKey} asc={sort.sortAsc} onSort={sort.toggleSort} />
                  <SortableTh label="Categoría" sortKey="categoria" activeKey={sort.sortKey} asc={sort.sortAsc} onSort={sort.toggleSort} />
                  <SortableTh label="Banco" sortKey="banco" activeKey={sort.sortKey} asc={sort.sortAsc} onSort={sort.toggleSort} />
                  <SortableTh label="Vencimiento" sortKey="vencimiento" activeKey={sort.sortKey} asc={sort.sortAsc} onSort={sort.toggleSort} />
                  <SortableTh label="Importe" sortKey="importe" activeKey={sort.sortKey} asc={sort.sortAsc} onSort={sort.toggleSort} align="right" className="fm-num" />
                  {p.canEdit && <th style={{ width: 96 }} aria-label="Acciones" />}
                </tr>
              </thead>
              <tbody>
                {sort.sorted.map(f => (
                  <tr key={f.id}>
                    <td>
                      <span className="flex items-center gap-3">
                        <CategoryBadge color={cat(f.categoria)?.color} icono={cat(f.categoria)?.icono} />
                        <span className="min-w-0">
                          <span className="block font-medium">{f.concepto}</span>
                          {f.comentario && <span className="block text-[13px] truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{f.comentario}</span>}
                        </span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{diaCobro(f.cobro) ? `Día ${diaCobro(f.cobro)}` : '—'}</td>
                    <td style={{ color: f.categoria ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{f.categoria ?? '—'}</td>
                    <td><BankChip nombre={f.banco} color={banco(f.banco)?.color} /></td>
                    <td className="whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{fmtVenc(f.vencimiento)}</td>
                    <td className="fm-num text-money-out">{formatEUR(f.importe)}</td>
                    {p.canEdit && <td>{acciones(f)}</td>}
                  </tr>
                ))}
                {autosFiltrados.map(a => (
                  <tr key={a.key} style={{ background: 'color-mix(in srgb, var(--accent-mode) 4%, transparent)' }}>
                    <td>
                      <span className="flex items-center gap-3">
                        <CategoryBadge color={cat(a.categoria)?.color} icono={cat(a.categoria)?.icono ?? 'Repeat'} />
                        <span className="min-w-0">
                          <span className="font-medium">{a.concepto}</span> <AutoBadge />
                          <span className="block text-[13px]" style={{ color: 'var(--text-muted)' }}>{a.subtitulo}</span>
                        </span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{a.cobroTexto ?? '—'}</td>
                    <td style={{ color: a.categoria ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{a.categoria ?? '—'}</td>
                    <td><BankChip nombre={a.banco} color={banco(a.banco)?.color} /></td>
                    <td style={{ color: 'var(--text-muted)' }}>—</td>
                    <td className="fm-num text-money-out">{formatEUR(a.importe)}</td>
                    {p.canEdit && (
                      <td>
                        <div className="fm-row-actions">
                          {a.recurrenteId
                            ? <IconButton label={`Editar categoría y banco de ${a.concepto}`} onClick={() => p.onEditAuto(a)}><PencilIcon /></IconButton>
                            : <IconButton label={`Configurar ${a.concepto}`} onClick={() => p.onEditAuto(a)}><SettingsIcon className="w-4 h-4" /></IconButton>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="fm-list">
              {sort.sorted.map(f => {
                const c = cat(f.categoria);
                const dia = diaCobro(f.cobro);
                return filaMovil(f.id, (
                  <>
                    <CategoryBadge color={c?.color} icono={c?.icono} />
                    <span className="fm-list-body">
                      <span className="fm-list-title">{f.concepto}</span>
                      <span className="fm-list-meta">
                        <span>{dia ? `Día ${dia}` : 'Sin día'}</span>
                        {f.categoria && <span>{f.categoria}</span>}
                        {f.banco && <BankChip nombre={f.banco} color={banco(f.banco)?.color} />}
                      </span>
                    </span>
                    <span className="fm-list-amount text-money-out">{formatEUR(f.importe)}</span>
                  </>
                ), p.canEdit ? () => p.onEditFijo(f) : undefined, `${f.concepto}, ${formatEUR(f.importe)}. Editar`);
              })}
              {autosFiltrados.map(a => {
                const c = cat(a.categoria);
                return filaMovil(a.key, (
                  <>
                    <CategoryBadge color={c?.color} icono={c?.icono ?? 'Repeat'} />
                    <span className="fm-list-body">
                      <span className="fm-list-title">{a.concepto}</span>
                      <span className="fm-list-meta">
                        <AutoBadge />
                        {a.cobroTexto && <span>{a.cobroTexto}</span>}
                        {a.categoria && <span>{a.categoria}</span>}
                        {a.banco && <BankChip nombre={a.banco} color={banco(a.banco)?.color} />}
                      </span>
                    </span>
                    <span className="fm-list-amount text-money-out">{formatEUR(a.importe)}</span>
                  </>
                ), p.canEdit ? () => p.onEditAuto(a) : undefined, `${a.concepto}, ${formatEUR(a.importe)}. ${a.recurrenteId ? 'Editar categoría y banco' : 'Configurar'}`);
              })}
            </ul>
          </>
        )}
      </Section>

      <Section id="sec-ingresos-fijos" title="Ingresos fijos" count={p.ingresos.length} total={formatEUR(totalIngresos)} tone="in" toneTotal
        actions={p.canEdit ? <Button size="sm" icon={<PlusIcon />} onClick={p.onAddIngreso} compactOnMobile>Añadir</Button> : undefined}>
        {p.loading ? <SkeletonRows rows={2} /> : p.ingresos.length === 0 ? (
          <EmptyState icon={<BanknoteIcon />} title="Sin ingresos fijos" text="Añade tu nómina u otros ingresos que se repiten cada mes."
            action={p.canEdit ? <Button variant="primary" icon={<PlusIcon />} onClick={p.onAddIngreso}>Añadir ingreso fijo</Button> : undefined} />
        ) : (
          <>
            <table className="fm-table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th className="fm-num">Importe</th>
                  {p.canEdit && <th style={{ width: 96 }} aria-label="Acciones" />}
                </tr>
              </thead>
              <tbody>
                {p.ingresos.map(i => (
                  <tr key={i.id}>
                    <td>
                      <span className="font-medium">{i.concepto}</span>
                      {i.comentario && <span className="block text-[13px] truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{i.comentario}</span>}
                    </td>
                    <td className="fm-num text-money-in">{formatEUR(i.importe)}</td>
                    {p.canEdit && (
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
              {p.ingresos.map(i => filaMovil(i.id, (
                <>
                  <span className="fm-list-body">
                    <span className="fm-list-title">{i.concepto}</span>
                    {i.comentario && <span className="fm-list-meta">{i.comentario}</span>}
                  </span>
                  <span className="fm-list-amount text-money-in">{formatEUR(i.importe)}</span>
                </>
              ), p.canEdit ? () => p.onEditIngreso(i) : undefined, `${i.concepto}, ${formatEUR(i.importe)}. Editar`))}
            </ul>
          </>
        )}
      </Section>
    </div>
  );
}

// ── Formulario de gasto fijo ────────────────────────────────────────────────
export interface FijoForm { id?: number; concepto: string; importe: string; categoria: string; banco: string; cobro: string; vencimiento: string; comentario: string }
export const fijoVacio = (): FijoForm => ({ concepto: '', importe: '', categoria: '', banco: '', cobro: '', vencimiento: '', comentario: '' });
export const fijoAForm = (f: FijoRow): FijoForm => ({
  id: f.id, concepto: f.concepto, importe: String(f.importe), categoria: f.categoria ?? '', banco: f.banco ?? '',
  cobro: diaCobro(f.cobro)?.toString() ?? '', vencimiento: f.vencimiento?.split('T')[0] ?? '', comentario: f.comentario ?? '',
});

export function FijoFormModal({ form, setForm, categorias, bancos, onClose, onSave, saving }: {
  form: FijoForm; setForm: (f: FijoForm) => void; categorias: Opcion[]; bancos: Opcion[]; onClose: () => void; onSave: () => void; saving: boolean;
}) {
  const set = (k: keyof FijoForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  const valido = form.concepto.trim() && form.importe !== '';
  const campo = (id: string, label: string, el: ReactNode) => <div className="mb-3.5"><label htmlFor={id} className="fm-label">{label}</label>{el}</div>;
  return (
    <Modal title={form.id ? 'Editar gasto fijo' : 'Nuevo gasto fijo'} onClose={onClose}
      footer={<>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={onSave} disabled={saving || !valido}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </>}>
      <form onSubmit={e => { e.preventDefault(); if (valido) onSave(); }}>
        {campo('pf-concepto', 'Concepto', <input id="pf-concepto" className="fm-input" value={form.concepto} onChange={set('concepto')} placeholder="Ej: Hipoteca" />)}
        <div className="grid grid-cols-2 gap-3">
          {campo('pf-importe', 'Importe (€)', <input id="pf-importe" className="fm-input" type="number" step="0.01" min="0" inputMode="decimal" value={form.importe} onChange={set('importe')} placeholder="0,00" />)}
          {campo('pf-cobro', 'Día de cobro', <input id="pf-cobro" className="fm-input" type="number" min="1" max="31" inputMode="numeric" value={form.cobro} onChange={set('cobro')} placeholder="Ej: 15" />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {campo('pf-cat', 'Categoría', (
            <select id="pf-cat" className="fm-input" value={form.categoria} onChange={set('categoria')}>
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}
            </select>
          ))}
          {campo('pf-banco', 'Banco', (
            <select id="pf-banco" className="fm-input" value={form.banco} onChange={set('banco')}>
              <option value="">Sin banco</option>
              {bancos.map(b => <option key={b.nombre} value={b.nombre}>{b.nombre}</option>)}
            </select>
          ))}
        </div>
        {campo('pf-venc', 'Vencimiento (opcional)', <input id="pf-venc" className="fm-input" type="date" value={form.vencimiento} onChange={set('vencimiento')} />)}
        {campo('pf-coment', 'Comentario', <input id="pf-coment" className="fm-input" value={form.comentario} onChange={set('comentario')} placeholder="Opcional" />)}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

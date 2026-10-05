'use client';

import { useEffect, useState } from 'react';
import { BackToModulos } from '@/components/modulos/ModulosHub';
import { SortableTh, useTableSort, type SortAccessor } from '@/components/SortableTable';
import { nextBillingDate } from '@/lib/billing';
import { admiteExclusionMeses, PERIODICIDAD_LABEL, totalMensualRecurrentes } from '@/lib/recurrentes';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import InfoExpand from '@/components/InfoExpand';
import { PencilIcon, RepeatIcon, TrashIcon } from '@/components/icons';
import Button, { IconButton } from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';
import Summary from '@/components/ui/Summary';
import Section from '@/components/ui/Section';
import SortSelect from '@/components/ui/SortSelect';
import Modal from '@/components/ui/Modal';
import Segmented from '@/components/ui/Segmented';
import { EmptyState, SkeletonRows, useToast } from '@/components/ui/Feedback';
import { formatEUR } from '@/lib/format';
import { CategoryBadge, BankChip } from '@/components/ui/Chips';
import { cobroTexto } from './RecurrentesPresupuesto';

type Periodicidad = 'mensual' | 'bimensual' | 'trimestral' | 'anual';
const PERIODICIDADES: Periodicidad[] = ['mensual', 'bimensual', 'trimestral', 'anual'];
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const TODOS_LOS_MESES = MESES_CORTOS.map((_, i) => i + 1);

export interface Recurrente {
  id: number;
  nombre: string;
  importe: number;
  cobro: string | null;
  periodicidad: Periodicidad;
  /** Meses (1-12) en que se cobra, separados por comas; null = todos */
  meses: string | null;
  comentario: string | null;
  categoria: string | null;
  banco: string | null;
}

interface Opcion { nombre: string; color?: string; icono?: string | null }

const proximo = (r: Recurrente) => nextBillingDate(r);
const fmtProximo = (r: Recurrente) => proximo(r)?.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) ?? '—';

type SortKey = 'nombre' | 'importe' | 'periodicidad' | 'cobro';
const PERIODO_ORDEN: Record<string, number> = { mensual: 1, bimensual: 2, trimestral: 3, anual: 4 };
const SORT: Record<SortKey, SortAccessor<Recurrente>> = {
  nombre: { get: r => r.nombre, type: 'text' },
  importe: { get: r => r.importe, type: 'number' },
  periodicidad: { get: r => PERIODO_ORDEN[r.periodicidad] ?? 9, type: 'number' },
  cobro: { get: r => proximo(r)?.getTime() ?? null, type: 'number' },
};
const ORDEN = [
  { key: 'cobro', asc: true, label: 'Próximo cobro' },
  { key: 'nombre', asc: true, label: 'Nombre (A–Z)' },
  { key: 'importe', asc: false, label: 'Importe (mayor primero)' },
  { key: 'importe', asc: true, label: 'Importe (menor primero)' },
  { key: 'periodicidad', asc: true, label: 'Periodicidad' },
];

interface RecForm { id?: number; nombre: string; importe: string; cobro: string; periodicidad: Periodicidad; meses: number[]; comentario: string; categoria: string; banco: string }
const emptyForm = (): RecForm => ({ nombre: '', importe: '', cobro: '', periodicidad: 'mensual', meses: TODOS_LOS_MESES, comentario: '', categoria: '', banco: '' });
const toForm = (r: Recurrente): RecForm => ({
  id: r.id, nombre: r.nombre, importe: String(r.importe), cobro: r.cobro ?? '', periodicidad: r.periodicidad,
  meses: r.meses ? r.meses.split(',').map(Number) : TODOS_LOS_MESES, comentario: r.comentario ?? '', categoria: r.categoria ?? '', banco: r.banco ?? '',
});

/** «Sin ago, dic» o «Solo ene, jul»; vacío si se cobra todos los meses */
function textoMeses(r: Pick<Recurrente, 'meses' | 'periodicidad'>): string {
  if (!r.meses || !admiteExclusionMeses(r.periodicidad)) return '';
  const marcados = r.meses.split(',').map(Number);
  const lista = (ms: number[]) => ms.map(m => MESES_CORTOS[m - 1].toLowerCase()).join(', ');
  return marcados.length <= 6 ? `Solo ${lista(marcados)}` : `Sin ${lista(TODOS_LOS_MESES.filter(m => !marcados.includes(m)))}`;
}

/** Endpoints según el ámbito */
const API = {
  personal: { rec: '/api/personal/suscripciones', cats: '/api/personal/categorias', bancos: '/api/personal/bancos', auto: '/api/personal/presupuesto/auto', tipo: 'suscripciones' },
  hogar: { rec: '/api/hogar/recurrentes', cats: '/api/categorias?tipo=gasto', bancos: '/api/categorias?tipo=prestamo', auto: '/api/presupuesto/auto', tipo: 'recurrentes' },
};

function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}

function PeriodoBadge({ p }: { p: Periodicidad }) {
  return (
    <span className="inline-flex px-2 py-px rounded-full text-xs font-medium whitespace-nowrap"
      style={p === 'mensual'
        ? { background: 'var(--btn-hover)', color: 'var(--text-secondary)' }
        : { background: 'color-mix(in srgb, var(--accent-mode) 12%, transparent)', color: 'var(--accent-mode)' }}>
      {PERIODICIDAD_LABEL[p]}
    </span>
  );
}

function RecurrenteModal({ form, setForm, onClose, onSave, saving, placeholder, categorias, bancos, conCategoriaBanco }: {
  form: RecForm; setForm: (f: RecForm) => void; onClose: () => void; onSave: () => void; saving: boolean; placeholder: string;
  categorias: Opcion[]; bancos: Opcion[];
  /** En «Total mensual» la categoría y el banco los pone la fila del Presupuesto */
  conCategoriaBanco: boolean;
}) {
  const set = (k: keyof RecForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  const conMeses = admiteExclusionMeses(form.periodicidad);
  const valido = form.nombre.trim() && form.importe !== '' && (!conMeses || form.meses.length > 0);
  const toggleMes = (m: number) => setForm({ ...form, meses: form.meses.includes(m) ? form.meses.filter(x => x !== m) : [...form.meses, m].sort((a, b) => a - b) });
  return (
    <Modal title={form.id ? 'Editar recurrente' : 'Nuevo recurrente'} onClose={onClose}
      footer={<>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={onSave} disabled={saving || !valido}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </>}>
      <form onSubmit={e => { e.preventDefault(); if (valido) onSave(); }}>
        <div className="mb-3.5">
          <label htmlFor="rec-nombre" className="fm-label">Nombre</label>
          <input id="rec-nombre" className="fm-input" value={form.nombre} onChange={set('nombre')} placeholder={placeholder} />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3.5">
          <div>
            <label htmlFor="rec-importe" className="fm-label">Importe (€)</label>
            <input id="rec-importe" className="fm-input" type="number" step="0.01" min="0" inputMode="decimal" value={form.importe} onChange={set('importe')} placeholder="0,00" />
          </div>
          <div>
            <label htmlFor="rec-periodicidad" className="fm-label">Periodicidad</label>
            <select id="rec-periodicidad" className="fm-input" value={form.periodicidad} onChange={set('periodicidad')}>
              <option value="mensual">Mensual</option>
              <option value="bimensual">Bimensual (cada 2 meses)</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>
        </div>
        <div className="mb-3.5">
          <label htmlFor="rec-cobro" className="fm-label">Fecha de un cobro</label>
          <input id="rec-cobro" className="fm-input" type="date" value={form.cobro} onChange={set('cobro')} />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>A partir de esta fecha se calculan los siguientes cobros, los avisos y el día con que se añade al Mes.</p>
        </div>
        {conMeses && (
          <fieldset className="mb-3.5">
            <legend className="fm-label">Meses en que se cobra</legend>
            <div className="grid grid-cols-6 gap-1.5">
              {MESES_CORTOS.map((nombre, i) => {
                const activo = form.meses.includes(i + 1);
                return (
                  <button key={nombre} type="button" aria-pressed={activo} onClick={() => toggleMes(i + 1)} className="fm-mes-chip">
                    {nombre}
                  </button>
                );
              })}
            </div>
            <p className="text-xs mt-1.5" style={{ color: form.meses.length ? 'var(--text-muted)' : 'var(--money-out)' }}>
              {form.meses.length === 0 ? 'Marca al menos un mes.'
                : form.periodicidad === 'bimensual' ? 'Solo se añade en los meses de su ciclo que estén marcados.'
                : 'Desmarca los meses en que no se cobra: en esos meses no se añade al Mes ni avisa.'}
            </p>
          </fieldset>
        )}
        {conCategoriaBanco && <div className="grid grid-cols-2 gap-3 mb-3.5">
          <div>
            <label htmlFor="rec-categoria" className="fm-label">Categoría</label>
            <select id="rec-categoria" className="fm-input" value={form.categoria} onChange={set('categoria')}>
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="rec-banco" className="fm-label">Banco</label>
            <select id="rec-banco" className="fm-input" value={form.banco} onChange={set('banco')}>
              <option value="">Sin banco</option>
              {bancos.map(b => <option key={b.nombre} value={b.nombre}>{b.nombre}</option>)}
            </select>
          </div>
        </div>}
        <div>
          <label htmlFor="rec-comentario" className="fm-label">Comentario</label>
          <input id="rec-comentario" className="fm-input" value={form.comentario} onChange={set('comentario')} placeholder="Opcional" />
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export default function RecurrentesClient({ scope, canEdit = true }: { scope: 'personal' | 'hogar'; canEdit?: boolean }) {
  const api = API[scope];
  const apiBase = api.rec;
  const toast = useToast();
  const [items, setItems] = useState<Recurrente[] | null>(null);
  const [modal, setModal] = useState<RecForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [borrar, setBorrar] = useState<Recurrente | null>(null);

  const [categorias, setCategorias] = useState<Opcion[]>([]);
  const [bancos, setBancos] = useState<Opcion[]>([]);
  const [desglose, setDesglose] = useState<boolean | null>(null);

  const arr = (d: unknown) => (Array.isArray(d) ? d : []);
  const cargar = () => fetch(apiBase).then(r => r.json()).catch(() => []).then(d => setItems(arr(d)));
  useEffect(() => {
    cargar();
    fetch(api.cats).then(r => r.json()).catch(() => []).then(d => setCategorias(arr(d)));
    fetch(api.bancos).then(r => r.json()).catch(() => []).then(d => setBancos(arr(d)));
    fetch(api.auto).then(r => r.json()).catch(() => []).then(d => {
      const cfg = arr(d).find((c: { tipo: string }) => c.tipo === api.tipo) as { desglose?: number } | undefined;
      setDesglose(cfg?.desglose === 1);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  async function cambiarModo(next: boolean) {
    const anterior = desglose;
    setDesglose(next);
    const res = await fetch(api.auto, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: api.tipo, desglose: next }) }).catch(() => null);
    if (!res?.ok) { setDesglose(anterior); toast('No se pudo cambiar el modo', 'error'); return; }
    toast(next ? 'Se añadirán desglosados' : 'Se añadirán como total mensual');
  }

  // En «Total mensual» la categoría y el banco los pone la fila del Presupuesto: no se muestran por recurrente
  const conCatBanco = desglose !== false;
  const cat = (n: string | null) => (conCatBanco ? categorias.find(c => c.nombre === n) : undefined);
  const banco = (n: string | null) => bancos.find(b => b.nombre === n);

  const lista = items ?? [];
  const sort = useTableSort(lista, SORT, { defaultKey: 'cobro', storageKey: `sort:${scope}-recurrentes` });
  const totalMensual = totalMensualRecurrentes(lista);
  const siguiente = [...lista].filter(proximo).sort((a, b) => proximo(a)!.getTime() - proximo(b)!.getTime())[0];

  async function guardar() {
    if (!modal) return;
    setSaving(true);
    const body = { ...modal, importe: Number(modal.importe), cobro: modal.cobro || null, meses: modal.meses, comentario: modal.comentario || null, categoria: modal.categoria || null, banco: modal.banco || null };
    const res = await fetch(modal.id ? `${apiBase}/${modal.id}` : apiBase, {
      method: modal.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { toast('No se pudo guardar el recurrente', 'error'); return; }
    setModal(null);
    toast('Recurrente guardado');
    cargar();
  }

  async function eliminar(r: Recurrente) {
    await fetch(`${apiBase}/${r.id}`, { method: 'DELETE' });
    setBorrar(null);
    toast('Recurrente eliminado');
    cargar();
  }

  const nuevo = () => setModal(emptyForm());
  const editar = (r: Recurrente) => { if (canEdit) setModal(toForm(r)); };

  return (
    <div>
      <div className="mb-3"><BackToModulos href={`/${scope}/modulos`} /></div>
      <PageHeader
        title="Recurrentes"
        subtitle={scope === 'personal' ? 'Suscripciones y pagos con cobro periódico' : 'Pagos periódicos de la casa'}
        info={
          <InfoExpand title="¿Qué son los Recurrentes?">
            <p>
              Pagos que se repiten cada mes, cada 2 meses, cada trimestre o cada año
              {scope === 'personal' ? ' (suscripciones, seguros, cuotas…)' : ' (seguros, comunidad, IBI…)'}.
              Puedes quitar los meses en que no se cobran. Abajo eliges si van al Presupuesto en una sola línea o uno a uno.
              También salen en Avisos.
            </p>
          </InfoExpand>
        }
        actions={canEdit ? <Button variant="primary" icon={<PlusIcon />} onClick={nuevo} compactOnMobile>Nuevo recurrente</Button> : undefined}
      />

      <Summary
        label="Coste mensual"
        value={formatEUR(totalMensual)}
        note={`${formatEUR(totalMensual * 12)} al año${siguiente ? ` · próximo: ${siguiente.nombre}, ${fmtProximo(siguiente)}` : ''}`}
        stats={PERIODICIDADES.map(p => {
          const grupo = lista.filter(r => r.periodicidad === p);
          const suma = grupo.reduce((t, r) => t + r.importe, 0);
          return {
            label: { mensual: 'Mensuales', bimensual: 'Bimensuales', trimestral: 'Trimestrales', anual: 'Anuales' }[p],
            value: String(grupo.length),
            sub: grupo.length ? `${formatEUR(suma)} ${{ mensual: 'al mes', bimensual: 'cada 2 meses', trimestral: 'al trimestre', anual: 'al año' }[p]}` : 'ninguno',
          };
        })}
      />

      <section className="fm-card p-4 sm:p-5 mb-7" aria-labelledby="rec-modo">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
          <div className="flex-1 min-w-0">
            <h2 id="rec-modo" className="font-semibold" style={{ color: 'var(--text-primary)' }}>En el Presupuesto y el Mes</h2>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {desglose === null ? 'Cargando…' : desglose
                ? 'Una línea por recurrente, con su fecha, categoría y banco, solo en los meses en que se cobra.'
                : 'Una sola línea con lo que cuestan todos al mes. Su categoría y banco se eligen en el Presupuesto.'}
            </p>
          </div>
          <div className="md:w-80 shrink-0" role="group" aria-labelledby="rec-modo">
            <Segmented<'total' | 'desglose'>
              options={[{ id: 'total', label: 'Total mensual' }, { id: 'desglose', label: 'Desglosado' }]}
              value={desglose ? 'desglose' : 'total'}
              onChange={v => { if ((v === 'desglose') !== desglose) cambiarModo(v === 'desglose'); }}
              disabled={() => !canEdit || desglose === null} />
          </div>
        </div>
      </section>

      <Section id="sec-recurrentes" title="Recurrentes" count={lista.length} total={formatEUR(totalMensual)}>
        {items === null ? <SkeletonRows rows={4} /> : lista.length === 0 ? (
          <EmptyState icon={<RepeatIcon />} title="Aún no tienes recurrentes"
            text="Añade suscripciones, seguros o cualquier pago periódico para tenerlos controlados y recibir avisos."
            action={canEdit ? <Button variant="primary" icon={<PlusIcon />} onClick={nuevo}>Nuevo recurrente</Button> : undefined} />
        ) : (
          <>
            <SortSelect opciones={ORDEN} sortKey={sort.sortKey} sortAsc={sort.sortAsc} onChange={(k, asc) => sort.setSort(k as SortKey, asc)} />
            <table className="fm-table">
              <thead>
                <tr>
                  <SortableTh label="Recurrente" sortKey="nombre" activeKey={sort.sortKey} asc={sort.sortAsc} onSort={sort.toggleSort} />
                  <SortableTh label="Periodicidad" sortKey="periodicidad" activeKey={sort.sortKey} asc={sort.sortAsc} onSort={sort.toggleSort} />
                  <SortableTh label="Próximo cobro" sortKey="cobro" activeKey={sort.sortKey} asc={sort.sortAsc} onSort={sort.toggleSort} />
                  {conCatBanco && <th>Categoría</th>}
                  {conCatBanco && <th>Banco</th>}
                  <SortableTh label="Importe" sortKey="importe" activeKey={sort.sortKey} asc={sort.sortAsc} onSort={sort.toggleSort} align="right" className="fm-num" />
                  {canEdit && <th style={{ width: 96 }} aria-label="Acciones" />}
                </tr>
              </thead>
              <tbody>
                {sort.sorted.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span className="flex items-center gap-3">
                        <CategoryBadge color={cat(r.categoria)?.color ?? 'var(--accent-mode)'} icono={cat(r.categoria)?.icono ?? 'Repeat'} />
                        <span className="min-w-0">
                          <span className="block font-medium">{r.nombre}</span>
                          {r.comentario && <span className="block text-[13px] truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{r.comentario}</span>}
                        </span>
                      </span>
                    </td>
                    <td>
                      <PeriodoBadge p={r.periodicidad} />
                      {textoMeses(r) && <span className="block text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{textoMeses(r)}</span>}
                    </td>
                    <td className="whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{fmtProximo(r)}</td>
                    {conCatBanco && <td style={{ color: r.categoria ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{r.categoria ?? '—'}</td>}
                    {conCatBanco && <td><BankChip nombre={r.banco} color={banco(r.banco)?.color} /></td>}
                    <td className="fm-num">{formatEUR(r.importe)}</td>
                    {canEdit && (
                      <td>
                        <div className="fm-row-actions">
                          <IconButton label={`Editar ${r.nombre}`} onClick={() => editar(r)}><PencilIcon /></IconButton>
                          <IconButton label={`Eliminar ${r.nombre}`} onClick={() => setBorrar(r)} className="hover:!text-money-out"><TrashIcon /></IconButton>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="fm-list">
              {sort.sorted.map(r => {
                const contenido = (
                  <>
                    <CategoryBadge color={cat(r.categoria)?.color ?? 'var(--accent-mode)'} icono={cat(r.categoria)?.icono ?? 'Repeat'} />
                    <span className="fm-list-body">
                      <span className="fm-list-title">{r.nombre}</span>
                      <span className="fm-list-meta">
                        {r.periodicidad !== 'mensual' && <span>{PERIODICIDAD_LABEL[r.periodicidad]}</span>}
                        {textoMeses(r) && <span>{textoMeses(r)}</span>}
                        <span>{r.periodicidad === 'mensual' ? cobroTexto(r) ?? 'Sin fecha' : `Próximo: ${fmtProximo(r)}`}</span>
                        {conCatBanco && r.categoria && <span>{r.categoria}</span>}
                        {conCatBanco && r.banco && <BankChip nombre={r.banco} color={banco(r.banco)?.color} />}
                      </span>
                    </span>
                    <span className="fm-list-amount">{formatEUR(r.importe)}</span>
                  </>
                );
                return (
                  <li key={r.id}>
                    {canEdit
                      ? <button type="button" className="fm-list-item" onClick={() => editar(r)} aria-label={`${r.nombre}, ${formatEUR(r.importe)}. Editar`}>{contenido}</button>
                      : <div className="fm-list-item">{contenido}</div>}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Section>

      {modal && <RecurrenteModal form={modal} setForm={setModal} onClose={() => setModal(null)} onSave={guardar} saving={saving}
        placeholder={scope === 'personal' ? 'Ej: Netflix' : 'Ej: Seguro del hogar'} categorias={categorias} bancos={bancos} conCategoriaBanco={conCatBanco} />}
      {borrar && <ConfirmDialog message={`¿Eliminar «${borrar.nombre}»?`} onConfirm={() => eliminar(borrar)} onCancel={() => setBorrar(null)} />}
    </div>
  );
}

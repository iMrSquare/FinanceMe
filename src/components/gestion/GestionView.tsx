'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PencilIcon, TrashIcon } from '@/components/icons';
import Button, { IconButton } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import { CategoryBadge } from '@/components/ui/Chips';
import IconPicker from '@/components/ui/IconPicker';
import { EmptyState, SkeletonRows, useToast } from '@/components/ui/Feedback';
import { sugerirIcono } from '@/lib/categoryIcons';

type Scope = 'personal' | 'hogar';
type Kind = 'categoria' | 'banco';

interface Item { id: number; nombre: string; color: string; icono?: string | null }

export const PALETA = ['#2d5b88', '#1d6f68', '#1e7a55', '#3f8f8b', '#6b8e23', '#9a6212', '#c2410c', '#b3412e', '#a23b72', '#8a4f9e', '#5b6b8c', '#44607a'];

function endpoints(scope: Scope, kind: Kind) {
  if (scope === 'personal') {
    const base = kind === 'categoria' ? '/api/personal/categorias' : '/api/personal/bancos';
    return { list: base, create: base, item: (id: number) => `${base}/${id}`, tipo: undefined };
  }
  const tipo = kind === 'categoria' ? 'gasto' : 'prestamo';
  return { list: `/api/categorias?tipo=${tipo}`, create: '/api/categorias', item: (id: number) => `/api/categorias/${id}`, tipo };
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}

interface FormState { id?: number; nombre: string; color: string; icono: string | null; iconoTocado: boolean; original?: string }

function ItemModal({ kind, form, setForm, onClose, onSave, saving }: {
  kind: Kind; form: FormState; setForm: (f: FormState) => void; onClose: () => void; onSave: () => void; saving: boolean;
}) {
  const esCategoria = kind === 'categoria';
  const titulo = `${form.id ? 'Editar' : esCategoria ? 'Nueva' : 'Nuevo'} ${esCategoria ? 'categoría' : 'banco'}`;
  return (
    <Modal title={titulo} onClose={onClose} width={esCategoria ? '560px' : '440px'}
      footer={<>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={onSave} disabled={saving || !form.nombre.trim()}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </>}>
      <form onSubmit={e => { e.preventDefault(); onSave(); }}>
        <div className="flex items-center gap-3 p-3 mb-4 rounded-[var(--radius-control)]" style={{ background: 'var(--row-hover)' }} aria-live="polite">
          <CategoryBadge color={form.color} icono={form.icono} bank={!esCategoria} />
          <span className="font-medium truncate">{form.nombre || 'Sin nombre'}</span>
        </div>
        <div className="mb-4">
          <label htmlFor="g-nombre" className="fm-label">Nombre</label>
          <input id="g-nombre" className="fm-input" value={form.nombre} placeholder={esCategoria ? 'Ej: Mascotas' : 'Ej: BBVA'}
            onChange={e => {
              const nombre = e.target.value;
              // Mientras no se elija un icono a mano, se sugiere según el nombre
              setForm({ ...form, nombre, icono: esCategoria && !form.iconoTocado ? sugerirIcono(nombre) : form.icono });
            }} />
        </div>
        <fieldset className="mb-4">
          <legend className="fm-label">Color</legend>
          <div className="flex flex-wrap items-center gap-2">
            {PALETA.map(c => (
              <button key={c} type="button" aria-pressed={form.color.toLowerCase() === c} aria-label={`Color ${c}`}
                onClick={() => setForm({ ...form, color: c })}
                className="w-8 h-8 rounded-full cursor-pointer"
                style={{ background: c, border: '2px solid var(--bg-card)', boxShadow: form.color.toLowerCase() === c ? '0 0 0 2px var(--text-primary)' : '0 0 0 1px var(--btn-border)' }} />
            ))}
            <label className="relative w-8 h-8 rounded-full cursor-pointer grid place-items-center text-xs overflow-hidden"
              title="Color personalizado" style={{ border: '1px dashed var(--btn-border)', color: 'var(--text-muted)' }}>
              <span aria-hidden="true">+</span>
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(form.color) ? form.color : '#2d5b88'} onChange={e => setForm({ ...form, color: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Color personalizado" />
            </label>
          </div>
        </fieldset>
        {esCategoria && (
          <div>
            <span className="fm-label" id="g-icono">Icono</span>
            <IconPicker value={form.icono} color={form.color} onChange={icono => setForm({ ...form, icono, iconoTocado: true })} />
          </div>
        )}
      </form>
    </Modal>
  );
}

function Lista({ scope, kind, canEdit }: { scope: Scope; kind: Kind; canEdit: boolean }) {
  const ep = endpoints(scope, kind);
  const toast = useToast();
  const [items, setItems] = useState<Item[] | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [borrar, setBorrar] = useState<Item | null>(null);
  const esCategoria = kind === 'categoria';

  const cargar = useCallback(() => fetch(ep.list).then(r => r.json()).catch(() => []).then(data => {
    setItems(Array.isArray(data) ? data : []);
  }), [ep.list]);
  useEffect(() => { cargar(); }, [cargar]);

  async function guardar() {
    if (!form) return;
    setSaving(true);
    const body = {
      nombre: form.nombre.trim(), color: form.color,
      ...(esCategoria ? { icono: form.icono } : {}),
      ...(ep.tipo ? { tipo: ep.tipo } : {}),
      ...(form.id && ep.tipo ? { nombreAnterior: form.original } : {}),
    };
    const res = await fetch(form.id ? ep.item(form.id) : ep.create, {
      method: form.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast(err.error ?? 'No se pudo guardar', 'error');
      return;
    }
    toast(esCategoria ? 'Categoría guardada' : 'Banco guardado');
    setForm(null);
    cargar();
  }

  async function eliminar(item: Item) {
    await fetch(ep.item(item.id), { method: 'DELETE' });
    setBorrar(null);
    toast(esCategoria ? 'Categoría eliminada' : 'Banco eliminado');
    cargar();
  }

  const nuevo = () => setForm({ nombre: '', color: PALETA[0], icono: esCategoria ? 'Tag' : null, iconoTocado: false });
  const editar = (i: Item) => setForm({ id: i.id, nombre: i.nombre, color: i.color, icono: i.icono ?? (esCategoria ? sugerirIcono(i.nombre) : null), iconoTocado: true, original: i.nombre });
  const titulo = esCategoria ? 'Categorías' : 'Bancos';
  const id = `gestion-${kind}`;

  return (
    <section className="fm-card fm-section" aria-labelledby={id}>
      <div className="fm-section-head">
        <h2 id={id} className="fm-section-title">
          {titulo}
          {items && <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>{items.length}</span>}
        </h2>
        {canEdit && <Button size="sm" icon={<PlusIcon />} onClick={nuevo}>{esCategoria ? 'Nueva' : 'Nuevo'}</Button>}
      </div>
      {items === null ? <SkeletonRows rows={4} /> : items.length === 0 ? (
        <EmptyState title={esCategoria ? 'Sin categorías' : 'Sin bancos'}
          text={esCategoria ? 'Crea categorías para agrupar tus gastos; los filtros y las estadísticas se basan en ellas.' : 'Añade los bancos o tarjetas con los que pagas.'}
          action={canEdit ? <Button variant="primary" icon={<PlusIcon />} onClick={nuevo}>{esCategoria ? 'Nueva categoría' : 'Nuevo banco'}</Button> : undefined} />
      ) : (
        <ul className="fm-list fm-list-always">
          {items.map(i => (
            <li key={i.id}>
              <div className="fm-list-item">
                <CategoryBadge color={i.color} icono={i.icono} bank={!esCategoria} />
                <span className="fm-list-body"><span className="fm-list-title">{i.nombre}</span></span>
                {canEdit && (
                  <span className="flex gap-0.5">
                    <IconButton label={`Editar ${i.nombre}`} onClick={() => editar(i)}><PencilIcon /></IconButton>
                    <IconButton label={`Eliminar ${i.nombre}`} onClick={() => setBorrar(i)} className="hover:!text-money-out"><TrashIcon /></IconButton>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {form && <ItemModal kind={kind} form={form} setForm={setForm} onClose={() => setForm(null)} onSave={guardar} saving={saving} />}
      {borrar && <ConfirmDialog message={`¿Eliminar «${borrar.nombre}»?`} onConfirm={() => eliminar(borrar)} onCancel={() => setBorrar(null)} />}
    </section>
  );
}

export default function GestionView({ scope, canEdit = true }: { scope: Scope; canEdit?: boolean }) {
  return (
    <div>
      <Link href={`/${scope}/presupuesto`} className="inline-flex items-center gap-1.5 mb-3 text-sm font-medium min-h-11 hover:underline" style={{ color: 'var(--text-secondary)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        Volver a Presupuesto
      </Link>
      <PageHeader title="Categorías y Bancos" subtitle="Los usan el Presupuesto, el Mes y las Estadísticas" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Lista scope={scope} kind="categoria" canEdit={canEdit} />
        <Lista scope={scope} kind="banco" canEdit={canEdit} />
      </div>
    </div>
  );
}

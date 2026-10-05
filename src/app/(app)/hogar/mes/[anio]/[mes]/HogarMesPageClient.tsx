'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Mes, Gasto, Ingreso, Categoria } from '@/lib/db';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ui/Feedback';
import MesView, {
  SinMeses, GastoFormModal, IngresoFormModal, NuevoMesModal,
  gastoVacio, gastoAForm, ingresoVacio, ingresoAForm,
  type GastoForm, type IngresoForm, type MesGastoRow, type MesIngresoRow,
} from '@/components/mes/MesView';

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

const INFO = 'Aquí se apuntan los gastos e ingresos de la casa en el mes. Al crearlo se puede importar el Presupuesto. Marca el check de cada gasto cuando ya haya venido. El candado bloquea el mes; los meses pasados se bloquean solos. Para eliminar un mes, desbloquéalo antes: se pide tu contraseña.';
const plural = (n: number, s: string) => `${n} ${s}${n !== 1 ? 's' : ''}`;

const aGastoRow = (g: Gasto): MesGastoRow => ({ id: g.id, concepto: g.gasto, comentario: g.comentario, fecha: g.fecha, importe: g.importe, categoria: g.categoria, banco: g.banco, cobrado: g.cobrado });
const aIngresoRow = (i: Ingreso): MesIngresoRow => ({ id: i.id, concepto: i.inquilino, comentario: i.comentario, importe: i.aportacion });

export default function HogarMesPageClient({
  mesObj, mesExists, gastos: initGastos, ingresos: initIngresos, categoriasGasto, categoriasBanco, meses, nombre, canEdit = true,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [gastos, setGastos] = useState<Gasto[]>(initGastos);
  const [ingresos, setIngresos] = useState<Ingreso[]>(initIngresos);
  const [bloqueado, setBloqueado] = useState(!!mesObj?.bloqueado);
  const [togglingBloqueo, setTogglingBloqueo] = useState(false);
  const [gastoForm, setGastoForm] = useState<GastoForm | null>(null);
  const [ingresoForm, setIngresoForm] = useState<IngresoForm | null>(null);
  const [nuevoMes, setNuevoMes] = useState(false);
  const [resumenFijos, setResumenFijos] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ msg: string; fn: () => Promise<void> } | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- sincroniza con los datos del servidor tras router.refresh() */
  useEffect(() => { setGastos(initGastos); }, [initGastos]);
  useEffect(() => { setIngresos(initIngresos); }, [initIngresos]);
  useEffect(() => { setBloqueado(!!mesObj?.bloqueado); }, [mesObj?.bloqueado]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function abrirNuevoMes() {
    setNuevoMes(true);
    Promise.all([
      fetch('/api/fijos?tipo=gasto').then(r => r.json()),
      fetch('/api/fijos?tipo=ingreso').then(r => r.json()),
    ]).then(([g, i]) => {
      const ng = Array.isArray(g) ? g.length : 0;
      const ni = Array.isArray(i) ? i.length : 0;
      setResumenFijos(ng || ni ? `${plural(ng, 'gasto fijo')} · ${plural(ni, 'ingreso fijo')}` : '');
    }).catch(() => setResumenFijos(''));
  }

  async function crearMes(d: { mes: number; anio: number; importarFijos: boolean; sobrescribir: boolean }) {
    const res = await fetch('/api/meses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error ?? 'No se pudo crear el mes';
    setNuevoMes(false);
    toast(d.sobrescribir ? 'Mes sobrescrito con el Presupuesto' : 'Mes creado');
    router.push(`/hogar/mes/${data.anio}/${data.mes}`);
    router.refresh();
    return null;
  }

  const modalNuevoMes = nuevoMes && (
    <NuevoMesModal meses={meses} resumenFijos={resumenFijos} presupuestoHref="/hogar/presupuesto" onClose={() => setNuevoMes(false)} onSubmit={crearMes} />
  );

  if (!mesExists || !mesObj) {
    return (
      <SinMeses canEdit={canEdit} texto="Crea el primer mes para empezar a registrar los gastos e ingresos de la casa." onCrear={abrirNuevoMes}>
        {modalNuevoMes}
      </SinMeses>
    );
  }
  const mesId = mesObj.id;

  async function toggleBloqueo() {
    setTogglingBloqueo(true);
    const next = !bloqueado;
    await fetch(`/api/meses/${mesId}/bloqueo`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bloqueado: next }) });
    setBloqueado(next);
    setTogglingBloqueo(false);
    toast(next ? 'Mes bloqueado' : 'Mes desbloqueado');
    router.refresh();
  }

  async function guardarGasto() {
    if (!gastoForm) return;
    setSaving(true);
    const body = {
      mes_id: mesId, gasto: gastoForm.concepto.trim(), fecha: gastoForm.fecha || null, categoria: gastoForm.categoria || null,
      banco: gastoForm.banco || null, importe: Number(gastoForm.importe) || 0, comentario: gastoForm.comentario || null,
    };
    const res = await fetch(gastoForm.id ? `/api/gastos/${gastoForm.id}` : '/api/gastos', {
      method: gastoForm.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { toast((await res.json().catch(() => ({}))).error ?? 'No se pudo guardar el gasto', 'error'); return; }
    if (gastoForm.id) setGastos(prev => prev.map(g => g.id === gastoForm.id ? { ...g, ...body } : g));
    else { const { id } = await res.json(); setGastos(prev => [...prev, { id, ...body } as Gasto]); }
    setGastoForm(null);
    toast('Gasto guardado');
    router.refresh();
  }

  async function guardarIngreso() {
    if (!ingresoForm) return;
    setSaving(true);
    const body = { mes_id: mesId, inquilino: ingresoForm.concepto.trim(), aportacion: Number(ingresoForm.importe) || 0, comentario: ingresoForm.comentario || null };
    const res = await fetch(ingresoForm.id ? `/api/ingresos/${ingresoForm.id}` : '/api/ingresos', {
      method: ingresoForm.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { toast((await res.json().catch(() => ({}))).error ?? 'No se pudo guardar el ingreso', 'error'); return; }
    if (ingresoForm.id) setIngresos(prev => prev.map(i => i.id === ingresoForm.id ? { ...i, ...body } : i));
    else { const { id } = await res.json(); setIngresos(prev => [...prev, { id, ...body } as Ingreso]); }
    setIngresoForm(null);
    toast('Ingreso guardado');
    router.refresh();
  }

  // Check «ya ha venido»: se marca al instante y se revierte si el servidor lo rechaza
  async function toggleCobrado(g: MesGastoRow) {
    const cobrado = g.cobrado ? 0 : 1;
    setGastos(prev => prev.map(x => x.id === g.id ? { ...x, cobrado } : x));
    const res = await fetch(`/api/gastos/${g.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cobrado: !!cobrado }) }).catch(() => null);
    if (!res?.ok) {
      setGastos(prev => prev.map(x => x.id === g.id ? { ...x, cobrado: cobrado ? 0 : 1 } : x));
      toast((await res?.json().catch(() => ({})))?.error ?? 'No se pudo guardar', 'error');
    }
  }

  // Segundo paso del borrado del mes (tras el aviso): el servidor valida la contraseña
  async function eliminarMes(password: string): Promise<string | null> {
    const res = await fetch(`/api/meses/${mesObj?.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }).catch(() => null);
    if (!res?.ok) return (await res?.json().catch(() => ({})))?.error ?? 'No se pudo eliminar el mes';
    toast('Mes eliminado');
    router.replace('/hogar/mes');
    router.refresh();
    return null;
  }

  const borrarGasto = (g: MesGastoRow) => setConfirm({ msg: `¿Eliminar «${g.concepto}»?`, fn: async () => {
    await fetch(`/api/gastos/${g.id}`, { method: 'DELETE' });
    setGastos(prev => prev.filter(x => x.id !== g.id));
    toast('Gasto eliminado');
  }});
  const borrarIngreso = (i: MesIngresoRow) => setConfirm({ msg: `¿Eliminar «${i.concepto}»?`, fn: async () => {
    await fetch(`/api/ingresos/${i.id}`, { method: 'DELETE' });
    setIngresos(prev => prev.filter(x => x.id !== i.id));
    toast('Ingreso eliminado');
  }});

  return (
    <>
      <MesView
        scope="hogar"
        titulo={nombre}
        info={INFO}
        bloqueado={bloqueado}
        canEdit={canEdit}
        togglingBloqueo={togglingBloqueo}
        onToggleBloqueo={toggleBloqueo}
        meses={meses.map(m => ({ value: `${m.anio}/${m.mes}`, label: m.nombre }))}
        mesActual={`${mesObj.anio}/${mesObj.mes}`}
        onSelectMes={v => router.push(`/hogar/mes/${v}`)}
        onNuevoMes={abrirNuevoMes}
        gastos={gastos.map(aGastoRow)}
        ingresos={ingresos.map(aIngresoRow)}
        categorias={categoriasGasto}
        bancos={categoriasBanco}
        onAddGasto={() => setGastoForm(gastoVacio())}
        onEditGasto={g => setGastoForm(gastoAForm(g))}
        onToggleCobrado={toggleCobrado}
        onEliminarMes={eliminarMes}
        onDeleteGasto={borrarGasto}
        onAddIngreso={() => setIngresoForm(ingresoVacio())}
        onEditIngreso={i => setIngresoForm(ingresoAForm(i))}
        onDeleteIngreso={borrarIngreso}
      />
      {gastoForm && <GastoFormModal form={gastoForm} setForm={setGastoForm} categorias={categoriasGasto} bancos={categoriasBanco} onClose={() => setGastoForm(null)} onSave={guardarGasto} saving={saving} />}
      {ingresoForm && <IngresoFormModal form={ingresoForm} setForm={setIngresoForm} conFecha={false} onClose={() => setIngresoForm(null)} onSave={guardarIngreso} saving={saving} />}
      {modalNuevoMes}
      {confirm && <ConfirmDialog message={confirm.msg} onConfirm={async () => { await confirm.fn(); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
    </>
  );
}

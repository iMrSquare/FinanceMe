'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { PersonalGastoMes, PersonalIngresoMes, PersonalCategoria, PersonalMes, PersonalGastoFijo, PersonalIngresoFijo, PersonalBanco } from '@/lib/db';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ui/Feedback';
import MesView, {
  MESES_NOMBRES, SinMeses, GastoFormModal, IngresoFormModal, NuevoMesModal,
  gastoVacio, gastoAForm, ingresoVacio, ingresoAForm,
  type GastoForm, type IngresoForm, type MesGastoRow, type MesIngresoRow,
} from '@/components/mes/MesView';

interface Props {
  anio: number;
  mes: number;
  mesExists: boolean;
  bloqueado: boolean;
  meses: PersonalMes[];
  gastos: PersonalGastoMes[];
  ingresos: PersonalIngresoMes[];
  categorias: PersonalCategoria[];
  bancos: PersonalBanco[];
  gastosFijos: PersonalGastoFijo[];
  ingresosFijos: PersonalIngresoFijo[];
}

const INFO = 'Aquí apuntas los gastos e ingresos del mes. Al crearlo puedes importar el Presupuesto. Marca el check de cada gasto cuando ya haya venido. El candado bloquea el mes; los meses pasados se bloquean solos. Para eliminar un mes, desbloquéalo antes: se pide tu contraseña.';
const plural = (n: number, s: string) => `${n} ${s}${n !== 1 ? 's' : ''}`;

export default function MesPersonalClient({
  anio, mes, mesExists, bloqueado: initBloqueado, meses, gastos: initGastos, ingresos: initIngresos,
  categorias, bancos, gastosFijos, ingresosFijos,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [gastos, setGastos] = useState(initGastos);
  const [ingresos, setIngresos] = useState(initIngresos);
  const [bloqueado, setBloqueado] = useState(initBloqueado);
  const [togglingBloqueo, setTogglingBloqueo] = useState(false);
  const [gastoForm, setGastoForm] = useState<GastoForm | null>(null);
  const [ingresoForm, setIngresoForm] = useState<IngresoForm | null>(null);
  const [nuevoMes, setNuevoMes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ msg: string; fn: () => Promise<void> } | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- sincroniza con los datos del servidor tras router.refresh() */
  useEffect(() => { setGastos(initGastos); }, [initGastos]);
  useEffect(() => { setIngresos(initIngresos); }, [initIngresos]);
  useEffect(() => { setBloqueado(initBloqueado); }, [initBloqueado]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const resumenFijos = gastosFijos.length || ingresosFijos.length
    ? `${plural(gastosFijos.length, 'gasto fijo')} · ${plural(ingresosFijos.length, 'ingreso fijo')}`
    : '';

  async function crearMes(d: { mes: number; anio: number; importarFijos: boolean; sobrescribir: boolean }) {
    const res = await fetch('/api/personal/mes/meses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    if (!res.ok) return (await res.json().catch(() => ({}))).error ?? 'No se pudo crear el mes';
    setNuevoMes(false);
    toast(d.sobrescribir ? 'Mes sobrescrito con el Presupuesto' : 'Mes creado');
    router.push(`/personal/mes/${d.anio}/${d.mes}`);
    router.refresh();
    return null;
  }

  const modalNuevoMes = nuevoMes && (
    <NuevoMesModal meses={meses} resumenFijos={resumenFijos} presupuestoHref="/personal/presupuesto" onClose={() => setNuevoMes(false)} onSubmit={crearMes} />
  );

  if (!mesExists && meses.length === 0) {
    return (
      <SinMeses canEdit texto="Crea tu primer mes para empezar a registrar tus gastos e ingresos." onCrear={() => setNuevoMes(true)}>
        {modalNuevoMes}
      </SinMeses>
    );
  }

  async function toggleBloqueo() {
    setTogglingBloqueo(true);
    const next = !bloqueado;
    await fetch('/api/personal/mes/bloqueo', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ anio, mes, bloqueado: next }) });
    setBloqueado(next);
    setTogglingBloqueo(false);
    toast(next ? 'Mes bloqueado' : 'Mes desbloqueado');
    router.refresh();
  }

  async function guardarGasto() {
    if (!gastoForm) return;
    setSaving(true);
    const body = {
      anio, mes, concepto: gastoForm.concepto.trim(), fecha: gastoForm.fecha || null, categoria: gastoForm.categoria || null,
      banco: gastoForm.banco || null, importe: parseFloat(gastoForm.importe) || 0, comentario: gastoForm.comentario || null,
    };
    const res = await fetch(gastoForm.id ? `/api/personal/mes/gastos/${gastoForm.id}` : '/api/personal/mes/gastos', {
      method: gastoForm.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { toast('No se pudo guardar el gasto', 'error'); return; }
    setGastoForm(null);
    toast('Gasto guardado');
    router.refresh();
  }

  async function guardarIngreso() {
    if (!ingresoForm) return;
    setSaving(true);
    const body = { anio, mes, concepto: ingresoForm.concepto.trim(), fecha: ingresoForm.fecha || null, importe: parseFloat(ingresoForm.importe) || 0, comentario: ingresoForm.comentario || null };
    const res = await fetch(ingresoForm.id ? `/api/personal/mes/ingresos/${ingresoForm.id}` : '/api/personal/mes/ingresos', {
      method: ingresoForm.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { toast('No se pudo guardar el ingreso', 'error'); return; }
    setIngresoForm(null);
    toast('Ingreso guardado');
    router.refresh();
  }

  // Check «ya ha venido»: se marca al instante y se revierte si el servidor lo rechaza
  async function toggleCobrado(g: MesGastoRow) {
    const cobrado = g.cobrado ? 0 : 1;
    setGastos(prev => prev.map(x => x.id === g.id ? { ...x, cobrado } : x));
    const res = await fetch(`/api/personal/mes/gastos/${g.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cobrado: !!cobrado }) }).catch(() => null);
    if (!res?.ok) {
      setGastos(prev => prev.map(x => x.id === g.id ? { ...x, cobrado: cobrado ? 0 : 1 } : x));
      toast((await res?.json().catch(() => ({})))?.error ?? 'No se pudo guardar', 'error');
    }
  }

  // Segundo paso del borrado del mes (tras el aviso): el servidor valida la contraseña
  async function eliminarMes(password: string): Promise<string | null> {
    const res = await fetch('/api/personal/mes/meses', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ anio, mes, password }) }).catch(() => null);
    if (!res?.ok) return (await res?.json().catch(() => ({})))?.error ?? 'No se pudo eliminar el mes';
    toast('Mes eliminado');
    router.replace('/personal/mes');
    router.refresh();
    return null;
  }

  const borrarGasto = (g: MesGastoRow) => setConfirm({ msg: `¿Eliminar «${g.concepto}»?`, fn: async () => {
    await fetch(`/api/personal/mes/gastos/${g.id}`, { method: 'DELETE' });
    setGastos(prev => prev.filter(x => x.id !== g.id));
    toast('Gasto eliminado');
  }});
  const borrarIngreso = (i: MesIngresoRow) => setConfirm({ msg: `¿Eliminar «${i.concepto}»?`, fn: async () => {
    await fetch(`/api/personal/mes/ingresos/${i.id}`, { method: 'DELETE' });
    setIngresos(prev => prev.filter(x => x.id !== i.id));
    toast('Ingreso eliminado');
  }});

  const opcionesMeses = meses.map(m => ({ value: `${m.anio}/${m.mes}`, label: `${MESES_NOMBRES[m.mes - 1]} ${m.anio}` }));

  return (
    <>
      <MesView
        scope="personal"
        titulo={`${MESES_NOMBRES[mes - 1]} ${anio}`}
        info={INFO}
        bloqueado={bloqueado}
        canEdit
        togglingBloqueo={togglingBloqueo}
        onToggleBloqueo={toggleBloqueo}
        meses={opcionesMeses}
        mesActual={`${anio}/${mes}`}
        onSelectMes={v => router.push(`/personal/mes/${v}`)}
        onNuevoMes={() => setNuevoMes(true)}
        gastos={gastos}
        ingresos={ingresos.map(i => ({ id: i.id, concepto: i.concepto, comentario: i.comentario, fecha: i.fecha, importe: i.importe }))}
        categorias={categorias}
        bancos={bancos}
        onAddGasto={() => setGastoForm(gastoVacio())}
        onEditGasto={g => setGastoForm(gastoAForm(g))}
        onToggleCobrado={toggleCobrado}
        onEliminarMes={eliminarMes}
        onDeleteGasto={borrarGasto}
        onAddIngreso={() => setIngresoForm(ingresoVacio())}
        onEditIngreso={i => setIngresoForm(ingresoAForm(i))}
        onDeleteIngreso={borrarIngreso}
      />
      {gastoForm && <GastoFormModal form={gastoForm} setForm={setGastoForm} categorias={categorias} bancos={bancos} onClose={() => setGastoForm(null)} onSave={guardarGasto} saving={saving} />}
      {ingresoForm && <IngresoFormModal form={ingresoForm} setForm={setIngresoForm} conFecha onClose={() => setIngresoForm(null)} onSave={guardarIngreso} saving={saving} />}
      {modalNuevoMes}
      {confirm && <ConfirmDialog message={confirm.msg} onConfirm={async () => { await confirm.fn(); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
    </>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Fijo, Categoria, AhorroObjetivo, Ahorro, PresupuestoAutoConfig, HogarRecurrente } from '@/lib/db';
import AutoConfigModal from '@/components/AutoConfigModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ui/Feedback';
import PresupuestoView, { FijoFormModal, fijoVacio, fijoAForm, type AutoRow, type FijoForm, type FijoRow, type IngresoFijoRow } from '@/components/presupuesto/PresupuestoView';
import { IngresoFormModal, ingresoVacio, type IngresoForm } from '@/components/mes/MesView';
import { filasRecurrentes, RecurrenteAjustesModal } from '@/components/recurrentes/RecurrentesPresupuesto';
import { mensualNecesario } from '@/lib/ahorroObjetivos';
import { objetivoMensualAhorro } from '@/lib/ahorro';
import { formatEUR } from '@/lib/format';

type AutoTipo = 'recurrentes' | 'ahorro' | 'objetivos';
const AUTO_TITULOS: Record<AutoTipo, string> = { recurrentes: 'Recurrentes', ahorro: 'Ahorro mensual', objetivos: 'Objetivos' };
const INFO = 'El Presupuesto son los gastos e ingresos fijos del Hogar que se repiten cada mes. Crea antes las categorías y bancos: los filtros y las estadísticas se basan en ellos. Al crear un Mes, estos datos se importan automáticamente. Un gasto con fecha de vencimiento deja de importarse cuando esa fecha queda atrás.';

interface Props {
  gastosFijos: Fijo[];
  ingresosFijos: Fijo[];
  catGasto: Categoria[];
  catPrestamo: Categoria[];
  objetivosAhorro: AhorroObjetivo[];
  ahorro: Ahorro;
  autoConfigs: PresupuestoAutoConfig[];
  recurrentes: HogarRecurrente[];
  canEdit: boolean;
}

const aFijoRow = (f: Fijo): FijoRow => ({ id: f.id, concepto: f.gasto, comentario: f.comentario, importe: f.importe, categoria: f.categoria, banco: f.banco, cobro: f.cobro, vencimiento: f.vencimiento });

export default function PresupuestoHogarClient({
  gastosFijos, ingresosFijos, catGasto, catPrestamo, objetivosAhorro, ahorro, autoConfigs: initAutoConfigs, recurrentes, canEdit,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [autoConfigs, setAutoConfigs] = useState(initAutoConfigs);
  const [filtros, setFiltros] = useState({ categoria: '', banco: '' });
  const [fijoForm, setFijoForm] = useState<FijoForm | null>(null);
  const [ingresoForm, setIngresoForm] = useState<IngresoForm | null>(null);
  const [editingAuto, setEditingAuto] = useState<AutoTipo | null>(null);
  const [recEdit, setRecEdit] = useState<HogarRecurrente | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ msg: string; fn: () => Promise<void> } | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con los datos del servidor tras router.refresh()
  useEffect(() => { setAutoConfigs(initAutoConfigs); }, [initAutoConfigs]);

  const autoConfig = (tipo: AutoTipo): PresupuestoAutoConfig =>
    autoConfigs.find(c => c.tipo === tipo) ?? { tipo, banco: null, categoria: null, redondeo: 1, desglose: 0 };

  // ── Filas automáticas ──
  const autos: AutoRow[] = [];
  const recCfg = autoConfig('recurrentes');
  autos.push(...filasRecurrentes(recurrentes, recCfg, 'recurrentes'));
  const ahorroMensual = objetivoMensualAhorro(ahorro.objetivo_anual, ahorro.meses, new Date().getFullYear());
  if (ahorroMensual > 0) {
    const cfg = autoConfig('ahorro');
    autos.push({ key: 'ahorro', tipo: 'ahorro', concepto: 'Ahorro mensual', importe: ahorroMensual, categoria: cfg.categoria, banco: cfg.banco,
      subtitulo: `Objetivo de ${formatEUR(ahorro.objetivo_anual)} al año, recalculado según lo aportado` });
  }
  const objetivosMensual = objetivosAhorro.reduce((s, o) => s + (mensualNecesario(o) ?? 0), 0);
  if (objetivosMensual > 0) {
    const cfg = autoConfig('objetivos');
    autos.push({ key: 'objetivos', tipo: 'objetivos', concepto: 'Objetivos', importe: objetivosMensual, categoria: cfg.categoria, banco: cfg.banco,
      subtitulo: 'Aportación mensual para los objetivos en curso' });
  }

  const ingresosRows: IngresoFijoRow[] = ingresosFijos.map(i => ({ id: i.id, concepto: i.gasto, comentario: i.comentario, importe: i.importe }));

  async function guardar(tipo: 'gasto' | 'ingreso', id: number | undefined, body: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(id ? `/api/fijos/${id}` : '/api/fijos', {
      method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo, ...body }),
    });
    setSaving(false);
    if (!res.ok) { toast((await res.json().catch(() => ({}))).error ?? 'No se pudo guardar', 'error'); return false; }
    router.refresh();
    return true;
  }

  async function guardarFijo() {
    if (!fijoForm) return;
    const ok = await guardar('gasto', fijoForm.id, {
      gasto: fijoForm.concepto.trim(), importe: Number(fijoForm.importe) || 0, categoria: fijoForm.categoria || null, banco: fijoForm.banco || null,
      cobro: fijoForm.cobro || null, vencimiento: fijoForm.vencimiento || null, comentario: fijoForm.comentario || null,
    });
    if (ok) { setFijoForm(null); toast('Gasto fijo guardado'); }
  }

  async function guardarIngreso() {
    if (!ingresoForm) return;
    const ok = await guardar('ingreso', ingresoForm.id, {
      gasto: ingresoForm.concepto.trim(), importe: Number(ingresoForm.importe) || 0, categoria: null, banco: null, cobro: null, vencimiento: null, comentario: ingresoForm.comentario || null,
    });
    if (ok) { setIngresoForm(null); toast('Ingreso fijo guardado'); }
  }

  const borrar = (id: number, concepto: string, aviso: string) => setConfirm({ msg: `¿Eliminar «${concepto}»?`, fn: async () => {
    await fetch(`/api/fijos/${id}`, { method: 'DELETE' });
    toast(aviso);
    router.refresh();
  }});

  return (
    <>
      <PresupuestoView
        scope="hogar"
        canEdit={canEdit}
        info={INFO}
        fijos={gastosFijos.map(aFijoRow)}
        autos={autos}
        ingresos={ingresosRows}
        categorias={catGasto}
        bancos={catPrestamo}
        filtroCategoria={filtros.categoria}
        filtroBanco={filtros.banco}
        onFiltro={f => setFiltros(prev => ({ ...prev, ...f }))}
        onAddFijo={() => setFijoForm(fijoVacio())}
        onEditFijo={f => setFijoForm(fijoAForm(f))}
        onDeleteFijo={f => borrar(f.id, f.concepto, 'Gasto fijo eliminado')}
        onEditAuto={a => {
          const r = a.recurrenteId ? recurrentes.find(x => x.id === a.recurrenteId) : undefined;
          if (r) setRecEdit(r); else setEditingAuto(a.tipo as AutoTipo);
        }}
        onAddIngreso={() => setIngresoForm(ingresoVacio())}
        onEditIngreso={i => setIngresoForm({ id: i.id, concepto: i.concepto, importe: String(i.importe), fecha: '', comentario: i.comentario ?? '' })}
        onDeleteIngreso={i => borrar(i.id, i.concepto, 'Ingreso fijo eliminado')}
        onGestion={canEdit ? () => router.push('/hogar/gestion') : undefined}
      />

      {fijoForm && <FijoFormModal form={fijoForm} setForm={setFijoForm} categorias={catGasto} bancos={catPrestamo} onClose={() => setFijoForm(null)} onSave={guardarFijo} saving={saving} />}
      {ingresoForm && <IngresoFormModal form={ingresoForm} setForm={setIngresoForm} conFecha={false} onClose={() => setIngresoForm(null)} onSave={guardarIngreso} saving={saving} />}
      {editingAuto && (
        <AutoConfigModal
          titulo={AUTO_TITULOS[editingAuto]}
          color={editingAuto === 'recurrentes' ? 'var(--accent-mode)' : 'var(--saving)'}
          current={autoConfig(editingAuto)}
          categorias={catGasto}
          bancos={catPrestamo}
          recurrentes={editingAuto === 'recurrentes'}
          onClose={() => setEditingAuto(null)}
          recurrentesHref={`/hogar/modulos/recurrentes`}
          onSave={async ({ banco, categoria, redondeo }) => {
            await fetch('/api/presupuesto/auto', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: editingAuto, banco, categoria, redondeo }) });
            const prev = autoConfig(editingAuto);
            setAutoConfigs(list => [
              ...list.filter(c => c.tipo !== editingAuto),
              { tipo: editingAuto, banco, categoria, redondeo: redondeo !== undefined ? (redondeo ? 1 : 0) : prev.redondeo, desglose: prev.desglose },
            ]);
            setEditingAuto(null);
            toast('Configuración guardada');
          }}
        />
      )}
      {recEdit && (
        <RecurrenteAjustesModal recurrente={recEdit} apiBase="/api/hogar/recurrentes" recurrentesHref={`/hogar/modulos/recurrentes`}
          categorias={catGasto} bancos={catPrestamo} onClose={() => setRecEdit(null)}
          onSaved={() => { setRecEdit(null); toast('Recurrente guardado'); router.refresh(); }} />
      )}
      {confirm && <ConfirmDialog message={confirm.msg} onConfirm={async () => { await confirm.fn(); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
    </>
  );
}

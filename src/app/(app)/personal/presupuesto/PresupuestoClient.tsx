'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PersonalGastoFijo, PersonalIngresoFijo, PersonalCategoria, PersonalBanco, PersonalAhorro, PersonalAhorroObjetivo, PersonalSuscripcion, PresupuestoAutoConfig } from '@/lib/db';
import AutoConfigModal from '@/components/AutoConfigModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ui/Feedback';
import PresupuestoView, { FijoFormModal, fijoVacio, fijoAForm, type AutoRow, type FijoForm, type FijoRow, type IngresoFijoRow } from '@/components/presupuesto/PresupuestoView';
import { IngresoFormModal, ingresoVacio, type IngresoForm } from '@/components/mes/MesView';
import { filasRecurrentes, RecurrenteAjustesModal } from '@/components/recurrentes/RecurrentesPresupuesto';
import { mensualNecesario } from '@/lib/ahorroObjetivos';
import { descripcionCuotaAhorro, objetivoMensualAhorro } from '@/lib/ahorro';
import { formatEUR } from '@/lib/format';

type AutoTipo = 'suscripciones' | 'ahorro' | 'objetivos';
const AUTO_TITULOS: Record<AutoTipo, string> = { suscripciones: 'Recurrentes', ahorro: 'Ahorro mensual', objetivos: 'Objetivos' };
const INFO = 'Tus gastos e ingresos fijos de cada mes; se copian al crear un Mes. Las filas Modulares vienen de Recurrentes, Ahorro anual y Objetivos. Un gasto con vencimiento deja de copiarse cuando pasa esa fecha. Crea antes tus categorías y bancos.';

export default function PresupuestoClient() {
  const router = useRouter();
  const toast = useToast();
  const [gastos, setGastos] = useState<PersonalGastoFijo[]>([]);
  const [ingresos, setIngresos] = useState<PersonalIngresoFijo[]>([]);
  const [categorias, setCategorias] = useState<PersonalCategoria[]>([]);
  const [bancos, setBancos] = useState<PersonalBanco[]>([]);
  const [recurrentes, setRecurrentes] = useState<PersonalSuscripcion[]>([]);
  const [ahorro, setAhorro] = useState<PersonalAhorro | null>(null);
  const [objetivos, setObjetivos] = useState<PersonalAhorroObjetivo[]>([]);
  const [autoConfigs, setAutoConfigs] = useState<PresupuestoAutoConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ categoria: '', banco: '' });
  const [fijoForm, setFijoForm] = useState<FijoForm | null>(null);
  const [ingresoForm, setIngresoForm] = useState<IngresoForm | null>(null);
  const [editingAuto, setEditingAuto] = useState<AutoTipo | null>(null);
  const [recEdit, setRecEdit] = useState<PersonalSuscripcion | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ msg: string; fn: () => Promise<void> } | null>(null);

  function fetchAll() {
    return Promise.all([
      fetch('/api/personal/gastos').then(r => r.json()),
      fetch('/api/personal/ingresos').then(r => r.json()),
      fetch('/api/personal/categorias').then(r => r.json()),
      fetch('/api/personal/bancos').then(r => r.json()),
      fetch('/api/personal/suscripciones').then(r => r.json()),
      fetch(`/api/personal/ahorro?year=${new Date().getFullYear()}`).then(r => r.json()),
      fetch('/api/personal/presupuesto/auto').then(r => r.json()),
      fetch('/api/personal/ahorro/objetivos').then(r => r.json()),
    ]).then(([g, ig, c, b, s, a, ac, ob]) => {
      const arr = <T,>(x: unknown) => (Array.isArray(x) ? x : []) as T[];
      setGastos(arr(g)); setIngresos(arr(ig)); setCategorias(arr(c)); setBancos(arr(b)); setRecurrentes(arr(s));
      setAhorro(a && typeof a === 'object' && 'objetivo_anual' in a ? a : null);
      setAutoConfigs(arr(ac)); setObjetivos(arr(ob));
      setLoading(false);
    });
  }
  useEffect(() => { fetchAll(); }, []);

  const autoConfig = (tipo: AutoTipo): PresupuestoAutoConfig =>
    autoConfigs.find(c => c.tipo === tipo) ?? { tipo, banco: null, categoria: null, redondeo: 1, desglose: 0 };

  // ── Filas automáticas ──
  const autos: AutoRow[] = [];
  const recCfg = autoConfig('suscripciones');
  autos.push(...filasRecurrentes(recurrentes, recCfg, 'suscripciones'));
  const ahorroMensual = ahorro ? objetivoMensualAhorro(ahorro, new Date().getFullYear()) : 0;
  if (ahorroMensual > 0 && ahorro) {
    const cfg = autoConfig('ahorro');
    autos.push({ key: 'ahorro', tipo: 'ahorro', concepto: 'Ahorro mensual', importe: ahorroMensual, categoria: cfg.categoria, banco: cfg.banco,
      subtitulo: descripcionCuotaAhorro(ahorro, formatEUR) });
  }
  const objetivosMensual = objetivos.reduce((s, o) => s + (mensualNecesario(o) ?? 0), 0);
  if (objetivosMensual > 0) {
    const cfg = autoConfig('objetivos');
    autos.push({ key: 'objetivos', tipo: 'objetivos', concepto: 'Objetivos', importe: objetivosMensual, categoria: cfg.categoria, banco: cfg.banco,
      subtitulo: 'Aportación mensual para tus objetivos en curso' });
  }

  const fijos: FijoRow[] = gastos.map(g => ({ id: g.id, concepto: g.gasto, comentario: g.comentario, importe: g.importe, categoria: g.categoria, banco: g.banco, cobro: g.cobro, vencimiento: g.vencimiento }));
  const ingresosRows: IngresoFijoRow[] = ingresos.map(i => ({ id: i.id, concepto: i.concepto, comentario: i.comentario, importe: i.importe }));

  async function guardarFijo() {
    if (!fijoForm) return;
    setSaving(true);
    const body = {
      gasto: fijoForm.concepto.trim(), importe: Number(fijoForm.importe) || 0, categoria: fijoForm.categoria || null, banco: fijoForm.banco || null,
      cobro: fijoForm.cobro || null, vencimiento: fijoForm.vencimiento || null, comentario: fijoForm.comentario || null,
    };
    const res = await fetch(fijoForm.id ? `/api/personal/gastos/${fijoForm.id}` : '/api/personal/gastos', {
      method: fijoForm.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { toast('No se pudo guardar el gasto fijo', 'error'); return; }
    setFijoForm(null);
    toast('Gasto fijo guardado');
    fetchAll();
  }

  async function guardarIngreso() {
    if (!ingresoForm) return;
    setSaving(true);
    const body = { concepto: ingresoForm.concepto.trim(), importe: Number(ingresoForm.importe) || 0, comentario: ingresoForm.comentario || null };
    const res = await fetch(ingresoForm.id ? `/api/personal/ingresos/${ingresoForm.id}` : '/api/personal/ingresos', {
      method: ingresoForm.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { toast('No se pudo guardar el ingreso', 'error'); return; }
    setIngresoForm(null);
    toast('Ingreso fijo guardado');
    fetchAll();
  }

  return (
    <>
      <PresupuestoView
        scope="personal"
        canEdit
        loading={loading}
        info={INFO}
        fijos={fijos}
        autos={autos}
        ingresos={ingresosRows}
        categorias={categorias}
        bancos={bancos}
        filtroCategoria={filtros.categoria}
        filtroBanco={filtros.banco}
        onFiltro={f => setFiltros(prev => ({ ...prev, ...f }))}
        onAddFijo={() => setFijoForm(fijoVacio())}
        onEditFijo={f => setFijoForm(fijoAForm(f))}
        onDeleteFijo={f => setConfirm({ msg: `¿Eliminar «${f.concepto}»?`, fn: async () => {
          await fetch(`/api/personal/gastos/${f.id}`, { method: 'DELETE' }); toast('Gasto fijo eliminado'); fetchAll();
        }})}
        onEditAuto={a => {
          const r = a.recurrenteId ? recurrentes.find(x => x.id === a.recurrenteId) : undefined;
          if (r) setRecEdit(r); else setEditingAuto(a.tipo as AutoTipo);
        }}
        onAddIngreso={() => setIngresoForm(ingresoVacio())}
        onEditIngreso={i => setIngresoForm({ id: i.id, concepto: i.concepto, importe: String(i.importe), fecha: '', comentario: i.comentario ?? '' })}
        onDeleteIngreso={i => setConfirm({ msg: `¿Eliminar «${i.concepto}»?`, fn: async () => {
          await fetch(`/api/personal/ingresos/${i.id}`, { method: 'DELETE' }); toast('Ingreso fijo eliminado'); fetchAll();
        }})}
        onGestion={() => router.push('/personal/gestion')}
      />

      {fijoForm && <FijoFormModal form={fijoForm} setForm={setFijoForm} categorias={categorias} bancos={bancos} onClose={() => setFijoForm(null)} onSave={guardarFijo} saving={saving} />}
      {ingresoForm && <IngresoFormModal form={ingresoForm} setForm={setIngresoForm} conFecha={false} onClose={() => setIngresoForm(null)} onSave={guardarIngreso} saving={saving} />}
      {editingAuto && (
        <AutoConfigModal
          titulo={AUTO_TITULOS[editingAuto]}
          color={editingAuto === 'suscripciones' ? 'var(--accent-mode)' : 'var(--saving)'}
          current={autoConfig(editingAuto)}
          categorias={categorias}
          bancos={bancos}
          recurrentes={editingAuto === 'suscripciones'}
          onClose={() => setEditingAuto(null)}
          recurrentesHref={`/personal/modulos/recurrentes`}
          onSave={async ({ banco, categoria, redondeo }) => {
            await fetch('/api/personal/presupuesto/auto', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: editingAuto, banco, categoria, redondeo }) });
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
        <RecurrenteAjustesModal recurrente={recEdit} apiBase="/api/personal/suscripciones" recurrentesHref={`/personal/modulos/recurrentes`}
          categorias={categorias} bancos={bancos} onClose={() => setRecEdit(null)}
          onSaved={() => { setRecEdit(null); toast('Recurrente guardado'); fetchAll(); }} />
      )}
      {confirm && <ConfirmDialog message={confirm.msg} onConfirm={async () => { await confirm.fn(); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
    </>
  );
}

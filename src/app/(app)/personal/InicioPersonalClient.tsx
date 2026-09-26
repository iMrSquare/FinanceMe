'use client';
import { useEffect, useState } from 'react';
import { billingDayInMonth } from '@/lib/billing';
import { importeVirtualRecurrentes, totalMensualRecurrentes, type RecurrentesConfig } from '@/lib/recurrentes';
import { objetivoMensualAhorro } from '@/lib/ahorro';
import { mensualNecesario } from '@/lib/ahorroObjetivos';
import InfoExpand from '@/components/InfoExpand';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Summary from '@/components/ui/Summary';
import { CalendarioPagos, ProximosPagos, RecurrentesResumen, TopCategorias, EvolucionChart, MESES, IngresosGastos, type Pago } from '@/components/resumen/ResumenParts';
import { formatEUR } from '@/lib/format';
import type {
  PersonalGastoFijo, PersonalGastoMes, PersonalSuscripcion, PersonalAhorro, PersonalAhorroObjetivo,
  PersonalMesEvolucion, PresupuestoAutoConfig, EstadisticasData, PersonalCategoria,
} from '@/lib/db';

const EstadisticasIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

export default function InicioPersonalClient() {
  const [gastos, setGastos] = useState<PersonalGastoFijo[]>([]);
  const [suscs, setSuscs] = useState<PersonalSuscripcion[]>([]);
  const [autoConfigs, setAutoConfigs] = useState<PresupuestoAutoConfig[]>([]);
  const [ahorro, setAhorro] = useState<PersonalAhorro | null>(null);
  const [objetivos, setObjetivos] = useState<PersonalAhorroObjetivo[]>([]);
  const [mesGastos, setMesGastos] = useState<PersonalGastoMes[]>([]);
  const [categorias, setCategorias] = useState<PersonalCategoria[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasData | null>(null);
  const [evolucion, setEvolucion] = useState<PersonalMesEvolucion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const anio = now.getFullYear();
    const mes = now.getMonth() + 1;
    const json = (url: string) => fetch(url).then(r => r.json()).catch(() => null);
    const arr = <T,>(x: unknown) => (Array.isArray(x) ? x : []) as T[];
    Promise.all([
      json('/api/personal/gastos'),
      json('/api/personal/suscripciones'),
      json(`/api/personal/ahorro?year=${anio}`),
      json(`/api/personal/mes/gastos?anio=${anio}&mes=${mes}`),
      json('/api/personal/evolucion'),
      json('/api/personal/presupuesto/auto'),
      json('/api/personal/estadisticas'),
      json('/api/personal/ahorro/objetivos'),
      json('/api/personal/categorias'),
    ]).then(([g, s, a, mg, ev, ac, est, ob, cat]) => {
      setGastos(arr(g)); setSuscs(arr(s)); setAutoConfigs(arr(ac)); setEvolucion(arr(ev)); setObjetivos(arr(ob)); setCategorias(arr(cat));
      setAhorro(a && typeof a === 'object' && !Array.isArray(a) && 'meses' in a ? a : null);
      setMesGastos(arr(mg?.gastos));
      setEstadisticas(est && typeof est === 'object' && !Array.isArray(est) && 'categorias' in est ? est : null);
      setLoading(false);
    });
  }, []);

  const hoy = new Date();
  const mesNombre = MESES[hoy.getMonth()];

  // Mes en curso (último punto de la evolución)
  const actual = evolucion.find(e => e.anio === hoy.getFullYear() && e.mes === hoy.getMonth() + 1);
  const ingresosMes = actual?.totalIngresos ?? 0;
  const gastosMes = actual?.totalGastos ?? 0;
  const balance = ingresosMes - gastosMes;
  const hayMovimientos = ingresosMes > 0 || gastosMes > 0;

  // Presupuesto mensual: fijos + filas automáticas (recurrentes, ahorro y objetivos)
  const suscCfg: RecurrentesConfig = autoConfigs.find(c => c.tipo === 'suscripciones') ?? { banco: null, categoria: null };
  const suscVirtual = importeVirtualRecurrentes(suscs, suscCfg);
  const ahorroVirtual = ahorro ? objetivoMensualAhorro(ahorro.objetivo_anual, ahorro.meses, hoy.getFullYear()) : 0;
  const objetivosVirtual = objetivos.reduce((s, o) => s + (mensualNecesario(o) ?? 0), 0);
  const presupuestoTotal = gastos.reduce((s, g) => s + g.importe, 0) + suscVirtual + ahorroVirtual + objetivosVirtual;
  const presupuestoConceptos = gastos.length + (suscVirtual > 0 ? (suscCfg.desglose ? suscs.filter(r => r.importe > 0).length : 1) : 0)
    + (ahorroVirtual > 0 ? 1 : 0) + (objetivosVirtual > 0 ? 1 : 0);

  const aportado = ahorro?.meses.reduce((s, m) => s + m.aportado, 0) ?? 0;
  const objetivoAnual = ahorro?.objetivo_anual ?? 0;
  const enCurso = objetivos.filter(o => o.aportado < o.objetivo);

  // Pagos del mes: gastos con fecha + recurrentes que se cobran este mes (sin repetir los ya anotados)
  const pagos: Pago[] = [
    ...mesGastos.filter(g => g.fecha).map(g => ({ day: Number(g.fecha!.split('-')[2]), nombre: g.concepto, importe: g.importe, tipo: 'gasto' as const })),
    ...suscs.flatMap(s => {
      const day = s.cobro ? billingDayInMonth(s.cobro, s.periodicidad, hoy.getFullYear(), hoy.getMonth()) : null;
      if (day === null || mesGastos.some(g => g.concepto === s.nombre && g.fecha && Number(g.fecha.split('-')[2]) === day)) return [];
      return [{ day, nombre: s.nombre, importe: s.importe, tipo: 'recurrente' as const }];
    }),
  ];

  const v = (x: string) => (loading ? '—' : x);

  return (
    <div className="flex flex-col gap-6 [&_section]:mb-0">
      <PageHeader
        title="Resumen"
        subtitle="Tus finanzas personales de un vistazo"
        info={<InfoExpand title="¿Qué es Resumen?"><p>Tu portada: el balance del mes, lo que tienes presupuestado y cómo va tu ahorro. Toca cualquier cifra para ir a su sección. Debajo, los próximos pagos del mes, tus recurrentes y en qué categorías gastas más.</p></InfoExpand>}
        actions={<Button href="/personal/estadisticas" icon={<EstadisticasIcon />} compactOnMobile>Estadísticas</Button>}
      />

      <Summary
        label={`Balance de ${mesNombre.toLowerCase()}`}
        value={loading ? '—' : formatEUR(balance, { signo: balance !== 0 })}
        tone={!hayMovimientos || loading ? 'neutral' : balance < 0 ? 'out' : 'in'}
        note={loading ? 'Cargando…' : hayMovimientos ? <IngresosGastos ingresos={ingresosMes} gastos={gastosMes} /> : 'Aún no hay movimientos este mes'}
        href="/personal/mes"
        stats={[
          { label: 'Presupuesto', value: v(formatEUR(presupuestoTotal)), tone: 'out', sub: `${presupuestoConceptos} conceptos al mes`, href: '/personal/presupuesto' },
          { label: 'Recurrentes', value: v(formatEUR(totalMensualRecurrentes(suscs))), sub: `${suscs.length} activos · al mes`, href: '/personal/modulos/recurrentes' },
          { label: 'Ahorro anual', value: v(formatEUR(aportado)), tone: 'saving', sub: objetivoAnual > 0 ? `${Math.round((aportado / objetivoAnual) * 100)} % de ${formatEUR(objetivoAnual)}` : 'Sin objetivo', href: '/personal/modulos/ahorro' },
          { label: 'Objetivos', value: v(formatEUR(enCurso.reduce((s, o) => s + o.aportado, 0))), tone: 'saving', sub: enCurso.length ? `${enCurso.length} en curso` : 'Ninguno en curso', href: '/personal/modulos/objetivos' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:[&>div>section]:h-full lg:[&>section]:h-full">
        <div className="lg:col-span-2 lg:order-last"><ProximosPagos pagos={pagos} scope="personal" /></div>
        <div className="lg:col-span-3"><CalendarioPagos pagos={pagos} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:[&>div>section]:h-full lg:[&>section]:h-full">
        <RecurrentesResumen items={suscs} categorias={categorias} scope="personal" />
        <TopCategorias categorias={estadisticas?.categorias ?? []} scope="personal" cargando={loading} />
      </div>

      {evolucion.length > 0 && (
        <EvolucionChart labels={evolucion.map(e => e.nombre)} ingresos={evolucion.map(e => e.totalIngresos)} gastos={evolucion.map(e => e.totalGastos)} />
      )}
    </div>
  );
}

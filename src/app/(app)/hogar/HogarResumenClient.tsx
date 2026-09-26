'use client';
import InfoExpand from '@/components/InfoExpand';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Summary from '@/components/ui/Summary';
import {
  CalendarioPagos, ProximosPagos, RecurrentesResumen, TopCategorias, RegistrosResumen, EvolucionChart, MESES, IngresosGastos, type Pago,
} from '@/components/resumen/ResumenParts';
import { formatEUR } from '@/lib/format';
import { mensualNecesario } from '@/lib/ahorroObjetivos';
import { objetivoMensualAhorro } from '@/lib/ahorro';
import { importeVirtualRecurrentes, totalMensualRecurrentes } from '@/lib/recurrentes';
import { billingDayInMonth } from '@/lib/billing';
import type {
  Fijo, AhorroObjetivo, Ahorro, Mes, Gasto, EstadisticasData, RegistroLuz, RegistroAgua, MesBalance, HogarRecurrente,
  PresupuestoAutoConfig, Categoria,
} from '@/lib/db';

const fmtNum = (n: number) => n.toLocaleString('es-ES', { maximumFractionDigits: 2 });
const fmtFecha = (iso: string | null) => (iso ? new Date(iso.split('T')[0] + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

function recencyKey(r: { anio: number; fecha_lectura_fin: string | null; fecha_cobro: string | null; id: number }) {
  return `${r.fecha_lectura_fin ?? r.fecha_cobro ?? `${r.anio}-01-01`}#${String(r.id).padStart(8, '0')}`;
}
const ultimo = <T extends { anio: number; fecha_lectura_fin: string | null; fecha_cobro: string | null; id: number }>(l: T[]) =>
  l.length ? [...l].sort((a, b) => recencyKey(b).localeCompare(recencyKey(a)))[0] : null;

const EstadisticasIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

interface Props {
  anioActual: number;
  mesActual: Mes | null;
  mesGastos: Gasto[];
  fijosGasto: Fijo[];
  objetivosAhorro: AhorroObjetivo[];
  ahorro: Ahorro;
  estadisticas: EstadisticasData;
  registrosLuz: RegistroLuz[];
  registrosAgua: RegistroAgua[];
  historial: MesBalance[];
  recurrentes: HogarRecurrente[];
  autoConfigs: PresupuestoAutoConfig[];
  categorias: Categoria[];
}

export default function HogarResumenClient({
  anioActual, mesActual, mesGastos, fijosGasto, objetivosAhorro, ahorro,
  estadisticas, registrosLuz, registrosAgua, historial, recurrentes, autoConfigs, categorias,
}: Props) {
  const hoy = new Date();
  const mesNombre = MESES[hoy.getMonth()];

  // Mes en curso
  const actual = mesActual ? historial.find(h => h.id === mesActual.id) : undefined;
  const ingresosMes = actual?.totalIngresos ?? 0;
  const gastosMes = (actual?.totalGastos ?? 0) + (actual?.totalPrestamos ?? 0);
  const balance = ingresosMes - gastosMes;

  // Presupuesto mensual: fijos + filas automáticas (recurrentes, ahorro y objetivos)
  const recCfg = autoConfigs.find(c => c.tipo === 'recurrentes') ?? { banco: null, categoria: null, redondeo: 1, desglose: 0 };
  const recVirtual = importeVirtualRecurrentes(recurrentes, recCfg);
  const objetivosVirtual = objetivosAhorro.reduce((s, o) => s + (mensualNecesario(o) ?? 0), 0);
  const ahorroVirtual = objetivoMensualAhorro(ahorro.objetivo_anual, ahorro.meses, anioActual);
  const presupuestoTotal = fijosGasto.reduce((s, f) => s + f.importe, 0) + recVirtual + objetivosVirtual + ahorroVirtual;
  const presupuestoConceptos = fijosGasto.length + (recVirtual > 0 ? (recCfg.desglose ? recurrentes.filter(r => r.importe > 0).length : 1) : 0)
    + (objetivosVirtual > 0 ? 1 : 0) + (ahorroVirtual > 0 ? 1 : 0);

  const aportado = ahorro.meses.reduce((s, m) => s + m.aportado, 0);
  const enCurso = objetivosAhorro.filter(o => o.aportado < o.objetivo);

  // Pagos del mes: gastos con fecha + recurrentes que se cobran este mes (sin repetir los ya anotados)
  const gastoPagos: Pago[] = mesGastos.filter(g => g.fecha)
    .map(g => ({ day: Number(g.fecha!.split('T')[0].split('-')[2]), nombre: g.gasto, importe: g.importe, tipo: 'gasto' as const }));
  const pagos: Pago[] = [
    ...gastoPagos,
    ...recurrentes.flatMap(r => {
      const day = r.cobro ? billingDayInMonth(r.cobro, r.periodicidad, hoy.getFullYear(), hoy.getMonth()) : null;
      if (day === null || gastoPagos.some(g => g.nombre === r.nombre && g.day === day)) return [];
      return [{ day, nombre: r.nombre, importe: r.importe, tipo: 'recurrente' as const }];
    }),
  ];

  const luz = ultimo(registrosLuz);
  const agua = ultimo(registrosAgua);

  return (
    <div className="flex flex-col gap-6 [&_section]:mb-0">
      <PageHeader
        title="Resumen"
        subtitle="Las finanzas de la casa de un vistazo"
        info={<InfoExpand title="¿Qué es Resumen?"><p>La portada del Hogar: el balance del mes, lo presupuestado y cómo va el ahorro de la casa. Toca cualquier cifra para ir a su sección. Debajo, los próximos pagos, los recurrentes, las categorías con más gasto y los últimos registros de luz y agua.</p></InfoExpand>}
        actions={<Button href="/hogar/estadisticas" icon={<EstadisticasIcon />} compactOnMobile>Estadísticas</Button>}
      />

      <Summary
        label={`Balance de ${mesNombre.toLowerCase()}`}
        value={mesActual ? formatEUR(balance, { signo: balance !== 0 }) : '—'}
        tone={!mesActual || (ingresosMes === 0 && gastosMes === 0) ? 'neutral' : balance < 0 ? 'out' : 'in'}
        note={mesActual ? <IngresosGastos ingresos={ingresosMes} gastos={gastosMes} /> : `${mesNombre} aún no está creado`}
        href="/hogar/mes"
        stats={[
          { label: 'Presupuesto', value: formatEUR(presupuestoTotal), tone: 'out', sub: `${presupuestoConceptos} conceptos al mes`, href: '/hogar/presupuesto' },
          { label: 'Recurrentes', value: formatEUR(totalMensualRecurrentes(recurrentes)), sub: `${recurrentes.length} activos · al mes`, href: '/hogar/modulos/recurrentes' },
          { label: 'Ahorro anual', value: formatEUR(aportado), tone: 'saving', sub: ahorro.objetivo_anual > 0 ? `${Math.round((aportado / ahorro.objetivo_anual) * 100)} % de ${formatEUR(ahorro.objetivo_anual)}` : 'Sin objetivo', href: '/hogar/modulos/ahorro' },
          { label: 'Objetivos', value: formatEUR(enCurso.reduce((s, o) => s + o.aportado, 0)), tone: 'saving', sub: enCurso.length ? `${enCurso.length} en curso` : 'Ninguno en curso', href: '/hogar/modulos/objetivos' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:[&>div>section]:h-full lg:[&>section]:h-full">
        <div className="lg:col-span-2 lg:order-last"><ProximosPagos pagos={pagos} scope="hogar" /></div>
        <div className="lg:col-span-3"><CalendarioPagos pagos={pagos} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:[&>div>section]:h-full lg:[&>section]:h-full">
        <RecurrentesResumen items={recurrentes} categorias={categorias} scope="hogar" />
        <TopCategorias categorias={estadisticas.categorias} scope="hogar" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:[&>div>section]:h-full lg:[&>section]:h-full">
        <div className="lg:col-span-2">
          <RegistrosResumen
            luz={luz && { nombre: luz.nombre, importe: luz.importe, fecha: fmtFecha(luz.fecha_cobro ?? luz.fecha_lectura_fin), consumo: luz.kwh != null ? `${fmtNum(luz.kwh)} kWh` : null }}
            agua={agua && { nombre: agua.nombre, importe: agua.importe, fecha: fmtFecha(agua.fecha_cobro ?? agua.fecha_lectura_fin), consumo: agua.m3 != null ? `${fmtNum(agua.m3)} m³` : null }}
          />
        </div>
        <div className="lg:col-span-3">
          <EvolucionChart
            labels={historial.map(h => `${MESES[h.mes - 1].slice(0, 3)} ${h.anio}`)}
            ingresos={historial.map(h => h.totalIngresos)}
            gastos={historial.map(h => h.totalGastos + h.totalPrestamos)}
          />
        </div>
      </div>
    </div>
  );
}

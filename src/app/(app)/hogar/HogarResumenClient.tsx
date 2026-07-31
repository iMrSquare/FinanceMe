'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import InfoExpand from '@/components/InfoExpand';
import { BoltIcon, DropletIcon } from '@/components/icons';
import { mensualNecesario } from '@/lib/ahorroObjetivos';
import type { Fijo, AhorroObjetivo, Ahorro, Mes, Gasto, EstadisticasData, RegistroLuz, RegistroAgua, MesBalance } from '@/lib/db';
import {
  Chart, LineElement, LineController, PointElement,
  CategoryScale, LinearScale, Filler, Tooltip,
} from 'chart.js';

Chart.register(LineElement, LineController, PointElement, CategoryScale, LinearScale, Filler, Tooltip);

function fmt(n: number) { return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }); }
function fmtNum(n: number | null) { return n == null ? null : n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEMANA = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

interface CalEvHogar { day: number; nombre: string; importe: number; }

function CalendarioHogar({ events }: { events: CalEvHogar[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;

  const byDay: Record<number, CalEvHogar[]> = {};
  events.forEach(e => { if (!byDay[e.day]) byDay[e.day] = []; byDay[e.day].push(e); });

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="glass-card rounded-3xl p-6">
      <h2 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
        Calendario de pagos — {MESES_NOMBRES[month]} {year}
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{events.length} pagos este mes</p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: 'var(--text-muted)' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const evs = byDay[day] ?? [];
          const isToday = day === today.getDate();
          return (
            <div key={i} className="rounded-xl p-1.5 min-h-[52px] flex flex-col"
              style={{ background: isToday ? 'var(--sidebar-hover-bg)' : evs.length > 0 ? 'var(--bg-page)' : 'transparent', border: isToday ? '1px solid var(--sidebar-hover-c)' : '1px solid transparent' }}>
              <span className="text-xs font-semibold mb-1" style={{ color: isToday ? 'var(--sidebar-hover-c)' : 'var(--text-secondary)' }}>{day}</span>
              {evs.slice(0, 2).map((e, j) => (
                <div key={j} className="rounded px-1 py-0.5 mb-0.5 truncate text-xs" style={{ background: 'rgba(var(--color-error-rgb),0.12)', color: 'var(--color-error)', fontSize: '10px' }}>
                  {e.nombre}
                </div>
              ))}
              {evs.length > 2 && <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>+{evs.length - 2}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function recencyKey(r: { anio: number; fecha_lectura_fin: string | null; fecha_cobro: string | null; id: number }) {
  return `${r.fecha_lectura_fin ?? r.fecha_cobro ?? `${r.anio}-01-01`}#${String(r.id).padStart(8, '0')}`;
}

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
}

export default function HogarResumenClient({
  anioActual, mesActual, mesGastos, fijosGasto, objetivosAhorro, ahorro,
  estadisticas, registrosLuz, registrosAgua, historial,
}: Props) {
  const balanceRef = useRef<HTMLCanvasElement>(null);
  const balanceChart = useRef<Chart | null>(null);

  const totalFijosGasto = fijosGasto.reduce((s, f) => s + f.importe, 0);
  const objetivosVirtual = objetivosAhorro.reduce((s, o) => s + (mensualNecesario(o) ?? 0), 0);
  const ahorroVirtual = ahorro.objetivo_anual > 0 ? ahorro.objetivo_anual / 12 : 0;
  const presupuestoTotal = totalFijosGasto + objetivosVirtual + ahorroVirtual;
  const presupuestoConceptos = fijosGasto.length + (objetivosVirtual > 0 ? 1 : 0) + (ahorroVirtual > 0 ? 1 : 0);

  const totalMesGastos = mesGastos.reduce((s, g) => s + g.importe, 0);

  const totalAportado = ahorro.meses.reduce((s, m) => s + m.aportado, 0);
  const objetivoAnual = ahorro.objetivo_anual;
  const porcentaje = objetivoAnual > 0 ? Math.min((totalAportado / objetivoAnual) * 100, 100) : 0;

  const topCategorias = estadisticas.categorias.slice(0, 5);

  const today = new Date();
  const mesNombreActual = MESES_NOMBRES[today.getMonth()];

  const calEvents: CalEvHogar[] = mesGastos
    .filter(g => g.fecha)
    .map(g => ({ day: Number(g.fecha!.split('T')[0].split('-')[2]), nombre: g.gasto, importe: g.importe }));
  const proximos = [...calEvents].sort((a, b) => a.day - b.day).filter(e => e.day >= today.getDate()).slice(0, 5);

  const ultimaLuz = registrosLuz.length > 0 ? [...registrosLuz].sort((a, b) => recencyKey(b).localeCompare(recencyKey(a)))[0] : null;
  const ultimaAgua = registrosAgua.length > 0 ? [...registrosAgua].sort((a, b) => recencyKey(b).localeCompare(recencyKey(a)))[0] : null;

  useEffect(() => {
    if (historial.length < 2) return;

    function build() {
      const cs = getComputedStyle(document.documentElement);
      const grid = cs.getPropertyValue('--sidebar-border').trim();
      const tick = cs.getPropertyValue('--text-secondary').trim();
      const success = cs.getPropertyValue('--color-success').trim();
      const successRgb = cs.getPropertyValue('--color-success-rgb').trim();

      balanceChart.current?.destroy();
      if (balanceRef.current) {
        balanceChart.current = new Chart(balanceRef.current, {
          type: 'line',
          data: {
            labels: historial.map(h => h.nombre),
            datasets: [{
              label: 'Balance',
              data: historial.map(h => h.balance),
              borderColor: success,
              backgroundColor: `rgba(${successRgb},0.12)`,
              tension: 0.4, fill: true, pointBackgroundColor: success, pointRadius: 4,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed.y as number)}` } } },
            scales: {
              y: { grid: { color: grid }, ticks: { color: tick, callback: v => fmt(Number(v)) } },
              x: { grid: { display: false }, ticks: { color: tick } },
            },
          },
        });
      }
    }

    build();
    const obs = new MutationObserver(build);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
    return () => { obs.disconnect(); balanceChart.current?.destroy(); };
  }, [historial]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(var(--accent-hogar-rgb),0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-hogar)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Resumen</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>de tus finanzas compartidas</p>
          </div>
          <InfoExpand title="¿Qué es Resumen?">
            <p>Vista general de las finanzas compartidas del Hogar: presupuesto, gastos del mes y objetivo anual de ahorro. El calendario de próximos pagos toma los gastos de vuestro Mes (con la fecha real en la que se registraron). Debajo tenéis vuestras categorías con más gasto de los últimos 6 meses, los últimos registros de Luz y Agua, y acceso a las Estadísticas.</p>
          </InfoExpand>
        </div>
        <Link
          href="/hogar/estadisticas"
          className="px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-colors"
          style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0, color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'var(--bg-card)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span>Estadísticas</span>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Link href="/hogar/presupuesto" className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6 block transition-transform hover:-translate-y-0.5">
          <div className="sm:flex sm:items-start sm:justify-between sm:mb-4">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-0.5 sm:mb-1" style={{ color: 'var(--text-muted)' }}>
                <span className="hidden sm:inline">Gastos fijos del mes</span>
                <span className="sm:hidden">Gastos fijos</span>
              </p>
              <p className="text-sm sm:text-3xl font-extrabold leading-tight sm:mt-2" style={{ color: 'var(--color-error)' }}>
                {fmt(presupuestoTotal)}
              </p>
              <p className="hidden sm:block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {presupuestoConceptos} conceptos
              </p>
            </div>
            <div className="hidden sm:flex w-11 h-11 rounded-2xl items-center justify-center shrink-0" style={{ background: 'rgba(var(--color-error-rgb),0.12)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
          </div>
        </Link>

        <Link href="/hogar/mes" className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6 block transition-transform hover:-translate-y-0.5">
          <div className="sm:flex sm:items-start sm:justify-between sm:mb-4">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-0.5 sm:mb-1" style={{ color: 'var(--text-muted)' }}>
                <span className="hidden sm:inline">Gastos — {mesNombreActual} {today.getFullYear()}</span>
                <span className="sm:hidden">Gastos</span>
              </p>
              <p className="text-sm sm:text-3xl font-extrabold leading-tight sm:mt-2" style={{ color: '#f97316' }}>
                {mesActual ? fmt(totalMesGastos) : '—'}
              </p>
              <p className="hidden sm:block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {mesActual ? `${mesGastos.length} conceptos` : 'Sin mes creado'}
              </p>
            </div>
            <div className="hidden sm:flex w-11 h-11 rounded-2xl items-center justify-center shrink-0" style={{ background: 'rgba(249,115,22,0.12)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
          </div>
        </Link>

        <Link href="/hogar/ahorro" className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6 block transition-transform hover:-translate-y-0.5">
          <div className="sm:flex sm:items-start sm:justify-between sm:mb-4">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-0.5 sm:mb-1" style={{ color: 'var(--text-muted)' }}>
                <span className="hidden sm:inline">Objetivo Anual de Ahorro</span>
                <span className="sm:hidden">Ahorro</span>
              </p>
              <p className="text-sm sm:text-3xl font-extrabold leading-tight sm:mt-2" style={{ color: 'var(--color-warning)' }}>
                {fmt(totalAportado)}
              </p>
              {objetivoAnual > 0 && (
                <p className="hidden sm:block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{porcentaje.toFixed(0)}% de {fmt(objetivoAnual)}</p>
              )}
            </div>
            <div className="hidden sm:flex w-11 h-11 rounded-2xl items-center justify-center shrink-0" style={{ background: 'rgba(var(--color-warning-rgb),0.12)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          {objetivoAnual > 0 && (
            <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--divider)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${porcentaje}%`, background: porcentaje >= 100 ? 'var(--color-warning)' : porcentaje >= 50 ? 'var(--color-warning)' : 'var(--color-error)' }} />
            </div>
          )}
        </Link>
      </div>

      {/* Calendar + upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl p-6 order-first lg:order-last">
          <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Próximos pagos</h2>
          {proximos.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin pagos pendientes este mes</p>
          ) : (
            <div className="space-y-3">
              {proximos.map((e, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: 'rgba(var(--color-error-rgb),0.12)', color: 'var(--color-error)' }}>
                    {e.day}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{e.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Gasto</p>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: 'var(--color-error)' }}>-{fmt(e.importe)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-2 order-last lg:order-first">
          <CalendarioHogar events={calEvents} />
        </div>
      </div>

      {/* Categorías con más gasto */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Categorías con más gasto</h2>
          <span className="text-xs font-medium px-3 py-1 rounded-xl" style={{ background: 'var(--bg-page)', color: 'var(--text-secondary)' }}>
            Últimos 6 meses
          </span>
        </div>
        {topCategorias.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin gastos registrados en este periodo</p>
        ) : (
          <div className="space-y-4">
            {topCategorias.map(c => {
              const maxTotal = topCategorias[0].total || 1;
              const pct = (c.total / maxTotal) * 100;
              return (
                <div key={c.categoria}>
                  <div className="flex items-center justify-between mb-1.5 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.categoria}</span>
                    </div>
                    <span className="text-sm font-bold shrink-0" style={{ color: 'var(--text-primary)' }}>{fmt(c.total)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Últimos registros (Luz y Agua) + Evolución del balance */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Link href="/hogar/registros" className="glass-card rounded-3xl p-6 xl:col-span-2 block transition-transform hover:-translate-y-0.5">
          <h2 className="font-bold text-lg mb-5" style={{ color: 'var(--text-primary)' }}>Últimos registros</h2>
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(var(--color-warning-rgb),0.12)' }}>
                  <BoltIcon className="w-4 h-4 text-warning" />
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Luz</span>
              </div>
              {ultimaLuz ? (
                <div className="flex items-center justify-between pl-10">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{ultimaLuz.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {fmtDate(ultimaLuz.fecha_cobro ?? ultimaLuz.fecha_lectura_fin)}
                      {ultimaLuz.kwh != null && ` · ${fmtNum(ultimaLuz.kwh)} kWh`}
                    </p>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: 'var(--text-primary)' }}>{fmt(ultimaLuz.importe)}</span>
                </div>
              ) : (
                <p className="text-sm pl-10" style={{ color: 'var(--text-muted)' }}>Sin registros</p>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(var(--color-info-rgb),0.12)' }}>
                  <DropletIcon className="w-4 h-4 text-info" />
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Agua</span>
              </div>
              {ultimaAgua ? (
                <div className="flex items-center justify-between pl-10">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{ultimaAgua.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {fmtDate(ultimaAgua.fecha_cobro ?? ultimaAgua.fecha_lectura_fin)}
                      {ultimaAgua.m3 != null && ` · ${fmtNum(ultimaAgua.m3)} m³`}
                    </p>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: 'var(--text-primary)' }}>{fmt(ultimaAgua.importe)}</span>
                </div>
              ) : (
                <p className="text-sm pl-10" style={{ color: 'var(--text-muted)' }}>Sin registros</p>
              )}
            </div>
          </div>
        </Link>

        <div className="glass-card rounded-3xl p-6 xl:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Evolución del balance</h2>
            <span className="text-xs font-medium px-3 py-1 rounded-xl" style={{ background: 'var(--bg-page)', color: 'var(--text-secondary)' }}>
              Últimos {historial.length} meses
            </span>
          </div>
          {historial.length < 2 ? (
            <p className="text-sm text-center py-16" style={{ color: 'var(--text-muted)' }}>Sin historial suficiente</p>
          ) : (
            <div style={{ height: 280 }}>
              <canvas ref={balanceRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

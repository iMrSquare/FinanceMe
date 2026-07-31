'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { nextBillingDate, monthlyEquivalent } from '@/lib/billing';
import InfoExpand from '@/components/InfoExpand';
import type { PersonalGastoFijo, PersonalGastoMes, PersonalSuscripcion, PersonalAhorro, PersonalMesEvolucion, PresupuestoAutoConfig, EstadisticasData } from '@/lib/db';
import {
  Chart, LineElement, LineController, PointElement,
  CategoryScale, LinearScale, Filler, Tooltip,
} from 'chart.js';

Chart.register(LineElement, LineController, PointElement, CategoryScale, LinearScale, Filler, Tooltip);

const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const roundUp5 = (n: number) => Math.ceil(n / 5) * 5;

const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEMANA = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

interface CalEvent { day: number; nombre: string; importe: number; tipo: 'gasto' | 'suscripcion'; }

function Calendario({ events }: { events: CalEvent[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0

  const byDay: Record<number, CalEvent[]> = {};
  events.forEach(e => { if (!byDay[e.day]) byDay[e.day] = []; byDay[e.day].push(e); });

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="glass-card rounded-3xl p-6">
      <h2 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
        Calendario de pagos — {MESES_NOMBRES[month]} {year}
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        {events.length} pagos este mes
      </p>
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
            <div
              key={i}
              className="rounded-xl p-1.5 min-h-[52px] flex flex-col"
              style={{ background: isToday ? 'var(--sidebar-hover-bg)' : evs.length > 0 ? 'var(--bg-page)' : 'transparent', border: isToday ? '1px solid var(--sidebar-hover-c)' : '1px solid transparent' }}
            >
              <span className="text-xs font-semibold mb-1" style={{ color: isToday ? 'var(--sidebar-hover-c)' : 'var(--text-secondary)' }}>{day}</span>
              {evs.slice(0, 2).map((e, j) => (
                <div key={j} className="rounded px-1 py-0.5 mb-0.5 truncate text-xs" style={{ background: e.tipo === 'gasto' ? 'rgba(var(--color-error-rgb),0.12)' : 'rgba(139,92,246,0.12)', color: e.tipo === 'gasto' ? 'var(--color-error)' : '#8b5cf6', fontSize: '10px' }}>
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

export default function InicioPersonalClient() {
  const [gastos, setGastos] = useState<PersonalGastoFijo[]>([]);
  const [suscs, setSuscs] = useState<PersonalSuscripcion[]>([]);
  const [autoConfigs, setAutoConfigs] = useState<PresupuestoAutoConfig[]>([]);
  const [ahorro, setAhorro] = useState<PersonalAhorro | null>(null);
  const [mesGastos, setMesGastos] = useState<PersonalGastoMes[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasData | null>(null);
  const [evolucion, setEvolucion] = useState<PersonalMesEvolucion[]>([]);
  const [loading, setLoading] = useState(true);
  const balanceRef = useRef<HTMLCanvasElement>(null);
  const ingresosRef = useRef<HTMLCanvasElement>(null);
  const balanceChart = useRef<Chart | null>(null);
  const ingresosChart = useRef<Chart | null>(null);

  useEffect(() => {
    const now = new Date();
    const anio = now.getFullYear();
    const mes = now.getMonth() + 1;
    Promise.all([
      fetch('/api/personal/gastos').then(r => r.json()),
      fetch('/api/personal/suscripciones').then(r => r.json()),
      fetch(`/api/personal/ahorro?year=${anio}`).then(r => r.json()),
      fetch(`/api/personal/mes/gastos?anio=${anio}&mes=${mes}`).then(r => r.json()),
      fetch('/api/personal/evolucion').then(r => r.json()),
      fetch('/api/personal/presupuesto/auto').then(r => r.json()),
      fetch('/api/personal/estadisticas').then(r => r.json()),
    ]).then(([g, s, a, mg, ev, ac, est]) => {
      setGastos(Array.isArray(g) ? g : []);
      setSuscs(Array.isArray(s) ? s : []);
      setAutoConfigs(Array.isArray(ac) ? ac : []);
      setAhorro(a && typeof a === 'object' && !Array.isArray(a) && 'meses' in a ? a : null);
      setMesGastos(Array.isArray(mg?.gastos) ? mg.gastos : []);
      setEvolucion(Array.isArray(ev) ? ev : []);
      setEstadisticas(est && typeof est === 'object' && !Array.isArray(est) && 'categorias' in est ? est : null);
      setLoading(false);
    });
  }, []);

  const totalGastos = gastos.reduce((s, g) => s + g.importe, 0);
  const totalSuscMensual = suscs.reduce((s, sub) => s + monthlyEquivalent(sub.importe, sub.periodicidad), 0);
  const totalAportado = ahorro?.meses.reduce((s, m) => s + m.aportado, 0) ?? 0;
  const objetivoAnual = ahorro?.objetivo_anual ?? 0;
  const porcentaje = objetivoAnual > 0 ? Math.min((totalAportado / objetivoAnual) * 100, 100) : 0;

  const suscRedondeo  = (autoConfigs.find(c => c.tipo === 'suscripciones')?.redondeo ?? 1) === 1;
  const suscVirtual   = totalSuscMensual > 0 ? (suscRedondeo ? roundUp5(totalSuscMensual) : totalSuscMensual) : 0;
  const ahorroVirtual = (ahorro?.objetivo_anual ?? 0) > 0 ? ahorro!.objetivo_anual / 12 : 0;
  const presupuestoTotal = totalGastos + suscVirtual + ahorroVirtual;

  const topCategorias = (estadisticas?.categorias ?? []).slice(0, 5);

  const currentMonth = new Date().getMonth();
  const calEvents: CalEvent[] = [
    ...mesGastos.filter(g => g.fecha).map(g => ({
      day: Number(g.fecha!.split('-')[2]),
      nombre: g.concepto, importe: g.importe, tipo: 'gasto' as const,
    })),
    ...suscs.filter(s => s.cobro)
      .map(s => ({ next: nextBillingDate(s.cobro!, s.periodicidad), nombre: s.nombre, importe: s.importe, tipo: 'suscripcion' as const }))
      .filter(({ next }) => next.getMonth() === currentMonth)
      .map(({ next, nombre, importe, tipo }) => ({ day: next.getDate(), nombre, importe, tipo })),
  ];

  const proximos = [...calEvents].sort((a, b) => a.day - b.day).filter(e => e.day >= new Date().getDate()).slice(0, 5);

  // Charts de evolución
  useEffect(() => {
    if (evolucion.length < 2) return;

    function build() {
      const cs = getComputedStyle(document.documentElement);
      const grid = cs.getPropertyValue('--sidebar-border').trim();
      const tick = cs.getPropertyValue('--text-secondary').trim();
      const successColor = cs.getPropertyValue('--color-success').trim();
      const successRgb = cs.getPropertyValue('--color-success-rgb').trim();
      const labels = evolucion.map(m => m.nombre);

      balanceChart.current?.destroy();
      if (balanceRef.current) {
        balanceChart.current = new Chart(balanceRef.current, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Balance',
              data: evolucion.map(m => m.balance),
              borderColor: '#f97316',
              backgroundColor: 'rgba(249,115,22,0.1)',
              tension: 0.4, fill: true, pointBackgroundColor: '#f97316', pointRadius: 4,
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

      ingresosChart.current?.destroy();
      if (ingresosRef.current) {
        ingresosChart.current = new Chart(ingresosRef.current, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Ingresos',
              data: evolucion.map(m => m.totalIngresos),
              borderColor: successColor,
              backgroundColor: `rgba(${successRgb},0.1)`,
              tension: 0.4, fill: true, pointBackgroundColor: successColor, pointRadius: 4,
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
    return () => { obs.disconnect(); balanceChart.current?.destroy(); ingresosChart.current?.destroy(); };
  }, [evolucion]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(var(--accent-personal-rgb),0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-personal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Resumen</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>de tus finanzas personales</p>
          </div>
          <InfoExpand title="¿Qué es Resumen?">
            <p>Aquí tienes una vista general de tus finanzas personales: tu presupuesto, suscripciones y objetivo anual de ahorro. El calendario de próximos pagos toma los gastos de tu Mes (con la fecha real en la que los registraste) y las suscripciones según su día de cobro habitual. Debajo tienes tus categorías con más gasto de los últimos 6 meses y acceso a tus Estadísticas.</p>
          </InfoExpand>
        </div>
        <Link
          href="/personal/estadisticas"
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
        <Link href="/personal/presupuesto" className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6 block transition-transform hover:-translate-y-0.5">
          <div className="sm:flex sm:items-start sm:justify-between sm:mb-4">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-0.5 sm:mb-1" style={{ color: 'var(--text-muted)' }}>
                <span className="hidden sm:inline">Gastos fijos del mes</span>
                <span className="sm:hidden">Gastos</span>
              </p>
              <p className="text-sm sm:text-3xl font-extrabold leading-tight sm:mt-2" style={{ color: loading ? 'var(--text-muted)' : 'var(--color-error)' }}>
                {loading ? '—' : fmt(presupuestoTotal)}
              </p>
              <p className="hidden sm:block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {gastos.length + (suscVirtual > 0 ? 1 : 0) + (ahorroVirtual > 0 ? 1 : 0)} conceptos
              </p>
            </div>
            <div className="hidden sm:flex w-11 h-11 rounded-2xl items-center justify-center shrink-0" style={{ background: 'rgba(var(--color-error-rgb),0.12)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
          </div>
        </Link>

        <Link href="/personal/suscripciones" className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6 block transition-transform hover:-translate-y-0.5">
          <div className="sm:flex sm:items-start sm:justify-between sm:mb-4">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-0.5 sm:mb-1" style={{ color: 'var(--text-muted)' }}>
                <span className="hidden sm:inline">Suscripciones activas</span>
                <span className="sm:hidden">Suscs.</span>
              </p>
              <p className="text-sm sm:text-3xl font-extrabold leading-tight sm:mt-2" style={{ color: loading ? 'var(--text-muted)' : '#8b5cf6' }}>
                {loading ? '—' : suscs.length}
              </p>
              {!loading && totalSuscMensual > 0 && (
                <p className="hidden sm:block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{fmt(totalSuscMensual)}/mes</p>
              )}
            </div>
            <div className="hidden sm:flex w-11 h-11 rounded-2xl items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.12)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </div>
          </div>
        </Link>

        <Link href="/personal/ahorro" className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6 block transition-transform hover:-translate-y-0.5">
          <div className="sm:flex sm:items-start sm:justify-between sm:mb-4">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-0.5 sm:mb-1" style={{ color: 'var(--text-muted)' }}>
                <span className="hidden sm:inline">Objetivo Anual de Ahorro</span>
                <span className="sm:hidden">Ahorro</span>
              </p>
              <p className="text-sm sm:text-3xl font-extrabold leading-tight sm:mt-2" style={{ color: loading ? 'var(--text-muted)' : 'var(--color-warning)' }}>
                {loading ? '—' : fmt(totalAportado)}
              </p>
              {!loading && objetivoAnual > 0 && (
                <p className="hidden sm:block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{porcentaje.toFixed(0)}% de {fmt(objetivoAnual)}</p>
              )}
            </div>
            <div className="hidden sm:flex w-11 h-11 rounded-2xl items-center justify-center shrink-0" style={{ background: 'rgba(var(--color-warning-rgb),0.12)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          {!loading && objetivoAnual > 0 && (
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
                    style={{ background: e.tipo === 'gasto' ? 'rgba(var(--color-error-rgb),0.12)' : 'rgba(139,92,246,0.12)', color: e.tipo === 'gasto' ? 'var(--color-error)' : '#8b5cf6' }}>
                    {e.day}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{e.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{e.tipo === 'gasto' ? 'Gasto' : 'Suscripción'}</p>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: e.tipo === 'gasto' ? 'var(--color-error)' : '#8b5cf6' }}>
                    -{fmt(e.importe)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-2 order-last lg:order-first">
          <Calendario events={calEvents} />
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
        {loading ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
        ) : topCategorias.length === 0 ? (
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

      {/* Gráficos de evolución */}
      {evolucion.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Evolución del balance</h2>
              <span className="text-xs font-medium px-3 py-1 rounded-xl" style={{ background: 'var(--bg-page)', color: 'var(--text-secondary)' }}>
                Últimos {evolucion.length} meses
              </span>
            </div>
            <div style={{ height: 200 }}>
              <canvas ref={balanceRef} />
            </div>
          </div>
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Evolución de ingresos</h2>
              <span className="text-xs font-medium px-3 py-1 rounded-xl" style={{ background: 'var(--bg-page)', color: 'var(--text-secondary)' }}>
                Últimos {evolucion.length} meses
              </span>
            </div>
            <div style={{ height: 200 }}>
              <canvas ref={ingresosRef} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { nextBillingDate } from '@/lib/billing';
import type { PersonalGastoFijo, PersonalSuscripcion, PersonalAhorro, PersonalMesEvolucion } from '@/lib/db';
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
                <div key={j} className="rounded px-1 py-0.5 mb-0.5 truncate text-xs" style={{ background: e.tipo === 'gasto' ? 'rgba(239,68,68,0.12)' : 'rgba(139,92,246,0.12)', color: e.tipo === 'gasto' ? '#ef4444' : '#8b5cf6', fontSize: '10px' }}>
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
  const [ahorro, setAhorro] = useState<PersonalAhorro | null>(null);
  const [mesGastos, setMesGastos] = useState<{ importe: number }[]>([]);
  const [mesIngresos, setMesIngresos] = useState<{ importe: number }[]>([]);
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
      fetch(`/api/personal/mes/ingresos?anio=${anio}&mes=${mes}`).then(r => r.json()),
      fetch('/api/personal/evolucion').then(r => r.json()),
    ]).then(([g, s, a, mg, mi, ev]) => {
      setGastos(Array.isArray(g) ? g : []);
      setSuscs(Array.isArray(s) ? s : []);
      setAhorro(a && typeof a === 'object' && !Array.isArray(a) && 'meses' in a ? a : null);
      setMesGastos(Array.isArray(mg?.gastos) ? mg.gastos : []);
      setMesIngresos(Array.isArray(mi) ? mi : []);
      setEvolucion(Array.isArray(ev) ? ev : []);
      setLoading(false);
    });
  }, []);

  const totalGastos = gastos.reduce((s, g) => s + g.importe, 0);
  const totalSuscMensual = suscs.reduce((s, sub) => s + (sub.periodicidad === 'anual' ? sub.importe / 12 : sub.importe), 0);
  const totalAportado = ahorro?.meses.reduce((s, m) => s + m.aportado, 0) ?? 0;
  const objetivoAnual = ahorro?.objetivo_anual ?? 0;
  const porcentaje = objetivoAnual > 0 ? Math.min((totalAportado / objetivoAnual) * 100, 100) : 0;

  // Balance del mes actual
  const now = new Date();
  const mesNombre = MESES_NOMBRES[now.getMonth()];
  const totalMesIngresos = mesIngresos.reduce((s, i) => s + i.importe, 0);
  const totalMesGastos   = mesGastos.reduce((s, g) => s + g.importe, 0);
  const balanceMes = totalMesIngresos - totalMesGastos;
  const hasMesData = totalMesIngresos > 0 || totalMesGastos > 0;

  // Progreso del presupuesto
  const suscVirtual   = totalSuscMensual > 0 ? roundUp5(totalSuscMensual) : 0;
  const ahorroVirtual = (ahorro?.objetivo_anual ?? 0) > 0 ? ahorro!.objetivo_anual / 12 : 0;
  const presupuestoTotal = totalGastos + suscVirtual + ahorroVirtual;
  const progresoPct = presupuestoTotal > 0 ? (totalMesGastos / presupuestoTotal) * 100 : 0;
  const progresoColor = progresoPct >= 100 ? '#ef4444' : progresoPct >= 80 ? '#f59e0b' : '#10b981';

  const currentMonth = new Date().getMonth();
  const calEvents: CalEvent[] = [
    ...gastos.filter(g => g.cobro).map(g => ({
      day: nextBillingDate(g.cobro!, 'mensual').getDate(),
      nombre: g.gasto, importe: g.importe, tipo: 'gasto' as const,
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
    const dark = document.documentElement.classList.contains('dark');
    const grid = dark ? '#334155' : '#e2e8f0';
    const tick = dark ? '#94a3b8' : '#64748b';
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
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.1)',
            tension: 0.4, fill: true, pointBackgroundColor: '#10b981', pointRadius: 4,
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

    return () => { balanceChart.current?.destroy(); ingresosChart.current?.destroy(); };
  }, [evolucion]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(16,185,129,0.12)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Personal</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Resumen de tus finanzas personales</p>
        </div>
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
              <p className="text-sm sm:text-3xl font-extrabold leading-tight" style={{ color: loading ? 'var(--text-muted)' : '#ef4444' }}>
                {loading ? '—' : fmt(presupuestoTotal)}
              </p>
              <p className="hidden sm:block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {gastos.length + (suscVirtual > 0 ? 1 : 0) + (ahorroVirtual > 0 ? 1 : 0)} conceptos
              </p>
            </div>
            <div className="hidden sm:flex w-11 h-11 rounded-2xl items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
          </div>
          <p className="hidden sm:block text-xs font-semibold" style={{ color: '#ef4444' }}>Ver presupuesto →</p>
        </Link>

        <Link href="/personal/suscripciones" className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6 block transition-transform hover:-translate-y-0.5">
          <div className="sm:flex sm:items-start sm:justify-between sm:mb-4">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-0.5 sm:mb-1" style={{ color: 'var(--text-muted)' }}>
                <span className="hidden sm:inline">Suscripciones activas</span>
                <span className="sm:hidden">Suscs.</span>
              </p>
              <p className="text-sm sm:text-3xl font-extrabold leading-tight" style={{ color: loading ? 'var(--text-muted)' : '#8b5cf6' }}>
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
          <p className="hidden sm:block text-xs font-semibold" style={{ color: '#8b5cf6' }}>Ver suscripciones →</p>
        </Link>

        <Link href="/personal/ahorro" className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6 block transition-transform hover:-translate-y-0.5">
          <div className="sm:flex sm:items-start sm:justify-between sm:mb-4">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-0.5 sm:mb-1" style={{ color: 'var(--text-muted)' }}>
                <span className="hidden sm:inline">Ahorro conseguido</span>
                <span className="sm:hidden">Ahorro</span>
              </p>
              <p className="text-sm sm:text-3xl font-extrabold leading-tight" style={{ color: loading ? 'var(--text-muted)' : '#f59e0b' }}>
                {loading ? '—' : fmt(totalAportado)}
              </p>
              {!loading && objetivoAnual > 0 && (
                <p className="hidden sm:block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{porcentaje.toFixed(0)}% de {fmt(objetivoAnual)}</p>
              )}
            </div>
            <div className="hidden sm:flex w-11 h-11 rounded-2xl items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          {!loading && objetivoAnual > 0 && (
            <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--divider)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${porcentaje}%`, background: porcentaje >= 100 ? '#f59e0b' : porcentaje >= 50 ? '#f59e0b' : '#ef4444' }} />
            </div>
          )}
          <p className="hidden sm:block text-xs font-semibold" style={{ color: '#f59e0b' }}>Ver ahorro →</p>
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
                    style={{ background: e.tipo === 'gasto' ? 'rgba(239,68,68,0.12)' : 'rgba(139,92,246,0.12)', color: e.tipo === 'gasto' ? '#ef4444' : '#8b5cf6' }}>
                    {e.day}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{e.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{e.tipo === 'gasto' ? 'Gasto fijo' : 'Suscripción'}</p>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: e.tipo === 'gasto' ? '#ef4444' : '#8b5cf6' }}>
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

      {/* Balance del mes + Progreso del presupuesto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Balance del mes */}
        <Link href="/personal/mes" className="block glass-card rounded-3xl overflow-hidden transition-transform hover:-translate-y-0.5">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Balance — {mesNombre}</p>
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Ver mes →</span>
            </div>
          </div>
          {loading ? (
            <div className="px-5 py-6"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando…</p></div>
          ) : !hasMesData ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Sin datos este mes</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Crea el mes para empezar a registrar</p>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ingresos</span>
                <span className="text-sm font-bold text-emerald-500">{fmt(totalMesIngresos)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Gastos</span>
                <span className="text-sm font-bold text-red-500">-{fmt(totalMesGastos)}</span>
              </div>
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--divider)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Balance</span>
                <span className="text-lg font-extrabold" style={{ color: balanceMes >= 0 ? '#10b981' : '#ef4444' }}>
                  {balanceMes >= 0 ? '+' : ''}{fmt(balanceMes)}
                </span>
              </div>
            </div>
          )}
        </Link>

        {/* Progreso del presupuesto */}
        <Link href="/personal/presupuesto" className="block glass-card rounded-3xl overflow-hidden transition-transform hover:-translate-y-0.5">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Progreso del presupuesto</p>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Ver →</span>
            </div>
          </div>
          {loading ? (
            <div className="px-5 py-6"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando…</p></div>
          ) : presupuestoTotal === 0 ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Sin presupuesto configurado</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Añade gastos fijos para ver el progreso</p>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-extrabold" style={{ color: progresoColor }}>{fmt(totalMesGastos)}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>de {fmt(presupuestoTotal)} presupuestados</p>
                </div>
                <span className="text-2xl font-extrabold mb-0.5" style={{ color: progresoColor }}>{progresoPct.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(progresoPct, 100)}%`, background: progresoColor }} />
              </div>
              {progresoPct >= 100 && (
                <p className="text-xs font-semibold" style={{ color: '#ef4444' }}>⚠ Presupuesto superado en {fmt(totalMesGastos - presupuestoTotal)}</p>
              )}
            </div>
          )}
        </Link>
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

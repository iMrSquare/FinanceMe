'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Mes, Gasto, Prestamo, Ingreso, Categoria, MesBalance, GastoCatTotal } from '@/lib/db';
import { BanknoteIcon, ReceiptIcon, BankIcon } from '@/components/icons';
import {
  Chart, ArcElement, DoughnutController, LineElement, LineController,
  PointElement, CategoryScale, LinearScale, Filler, Tooltip,
} from 'chart.js';

Chart.register(ArcElement, DoughnutController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Filler, Tooltip);

function fmt(n: number) { return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }); }
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  const [, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}`;
}

function autoText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 145 ? '#1f2937' : '#ffffff';
}

interface Props {
  mesActual: Mes | null;
  gastos: Gasto[];
  prestamos: Prestamo[];
  ingresos: Ingreso[];
  catGasto: Categoria[];
  gastosxCat: GastoCatTotal[];
  historial: MesBalance[];
}

export default function ResumenClient({ mesActual, gastos, prestamos, ingresos, catGasto, gastosxCat, historial }: Props) {
  const donutRef = useRef<HTMLCanvasElement>(null);
  const lineRef  = useRef<HTMLCanvasElement>(null);
  const donutChart = useRef<Chart | null>(null);
  const lineChart  = useRef<Chart | null>(null);

  const totalIngresos   = ingresos.reduce((s, i) => s + (i.aportacion ?? 0), 0);
  const totalGastos     = gastos.reduce((s, g) => s + (g.importe ?? 0), 0);
  const totalPrestamos  = prestamos.reduce((s, p) => s + (p.importe ?? 0), 0);
  const totalGastoTotal = totalGastos + totalPrestamos;
  const balance         = totalIngresos - totalGastoTotal;
  const maxGastosCat    = gastosxCat.reduce((m, g) => Math.max(m, g.total), 0);

  function getThemeColors() {
    const dark = document.documentElement.classList.contains('dark');
    return {
      grid: dark ? '#334155' : '#e2e8f0',
      tick: dark ? '#94a3b8' : '#64748b',
      lineFill: dark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.15)',
    };
  }

  function buildDonut() {
    if (!donutRef.current) return;
    donutChart.current?.destroy();
    donutChart.current = new Chart(donutRef.current, {
      type: 'doughnut',
      data: {
        labels: gastosxCat.map(g => g.categoria),
        datasets: [{
          data: gastosxCat.map(g => g.total),
          backgroundColor: gastosxCat.map(g => g.color),
          borderWidth: 0,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '76%',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed)}` } } },
      },
    });
  }

  function buildLine() {
    if (!lineRef.current || historial.length === 0) return;
    lineChart.current?.destroy();
    const c = getThemeColors();
    lineChart.current = new Chart(lineRef.current, {
      type: 'line',
      data: {
        labels: historial.map(h => h.nombre),
        datasets: [{
          label: 'Balance',
          data: historial.map(h => h.balance),
          borderColor: '#10b981',
          backgroundColor: c.lineFill,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#10b981',
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed.y as number)}` } } },
        scales: {
          y: { grid: { color: c.grid }, ticks: { color: c.tick, callback: (v) => fmt(Number(v)) } },
          x: { grid: { display: false }, ticks: { color: c.tick } },
        },
      },
    });
  }

  function updateLineColors() {
    if (!lineChart.current) return;
    const c = getThemeColors();
    lineChart.current.data.datasets[0].backgroundColor = c.lineFill;
    (lineChart.current.options.scales!.y as { grid: { color: string }; ticks: { color: string } }).grid.color = c.grid;
    (lineChart.current.options.scales!.y as { grid: { color: string }; ticks: { color: string } }).ticks.color = c.tick;
    (lineChart.current.options.scales!.x as { ticks: { color: string } }).ticks.color = c.tick;
    lineChart.current.update();
  }

  useEffect(() => {
    buildDonut();
    buildLine();
    // Watch for dark mode class changes
    const obs = new MutationObserver(updateLineColors);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => { obs.disconnect(); donutChart.current?.destroy(); lineChart.current?.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recentGastos = [...gastos].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? '')).slice(0, 5);

  if (!mesActual) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Sin datos todavía</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Crea el primer mes para ver el resumen</p>
          <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-2xl text-sm font-bold">Ir al mes →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>{mesActual.nombre}</p>
        <div className="flex items-center gap-4 mt-1">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Resumen</h2>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--text-secondary)' }}>Vista general del mes en curso y evolución histórica.</p>
          </div>
        </div>
      </div>

      {/* Stats cards — mobile: 2 cols (Ingresos+Balance / Gastos+Préstamos), xl: 4 cols */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 xl:gap-5">
        {/* Ingresos — row 1 col 1 on mobile, col 1 on xl */}
        <div className="glass-card rounded-2xl xl:rounded-3xl p-4 xl:p-6 order-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-xs xl:text-sm" style={{ color: 'var(--text-secondary)' }}>Ingresos</p>
              <h3 className="text-xl xl:text-3xl font-extrabold mt-2 xl:mt-3" style={{ color: 'var(--text-primary)' }}>{fmt(totalIngresos)}</h3>
              <p className="font-semibold mt-1 xl:mt-2 text-emerald-500 text-xs xl:text-sm">{ingresos.length} inquilino{ingresos.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="w-9 h-9 xl:w-12 xl:h-12 rounded-xl xl:rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
              <BanknoteIcon className="w-4 h-4 xl:w-5 xl:h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Balance — row 1 col 2 on mobile, col 4 on xl */}
        <div className={`rounded-2xl xl:rounded-3xl p-4 xl:p-6 text-white shadow-2xl order-2 xl:order-4 ${balance >= 0 ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-green-500/20' : 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 font-medium text-xs xl:text-sm">Balance</p>
              <h3 className="text-xl xl:text-3xl font-extrabold mt-2 xl:mt-3">{fmt(balance)}</h3>
              <p className="font-semibold mt-1 xl:mt-2 text-xs xl:text-sm">{balance >= 0 ? '✓ Superávit' : '✗ Déficit'}</p>
            </div>
            <div className="w-9 h-9 xl:w-12 xl:h-12 rounded-xl xl:rounded-2xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-md">
              <svg className="w-4 h-4 xl:w-5 xl:h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Gastos — row 2 col 1 on mobile, col 2 on xl */}
        <div className="glass-card rounded-2xl xl:rounded-3xl p-4 xl:p-6 order-3 xl:order-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-xs xl:text-sm" style={{ color: 'var(--text-secondary)' }}>Gastos</p>
              <h3 className="text-xl xl:text-3xl font-extrabold mt-2 xl:mt-3 text-red-500">-{fmt(totalGastos)}</h3>
              <p className="font-semibold mt-1 xl:mt-2 text-amber-500 text-xs xl:text-sm">{gastos.length} concepto{gastos.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="w-9 h-9 xl:w-12 xl:h-12 rounded-xl xl:rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
              <ReceiptIcon className="w-4 h-4 xl:w-5 xl:h-5 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Préstamos — row 2 col 2 on mobile, col 3 on xl */}
        <div className="glass-card rounded-2xl xl:rounded-3xl p-4 xl:p-6 order-4 xl:order-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-xs xl:text-sm" style={{ color: 'var(--text-secondary)' }}>Préstamos</p>
              <h3 className="text-xl xl:text-3xl font-extrabold mt-2 xl:mt-3 text-red-500">-{fmt(totalPrestamos)}</h3>
              <p className="font-semibold mt-1 xl:mt-2 text-blue-500 text-xs xl:text-sm">{prestamos.length} pago{prestamos.length !== 1 ? 's' : ''} activo{prestamos.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="w-9 h-9 xl:w-12 xl:h-12 rounded-xl xl:rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
              <BankIcon className="w-4 h-4 xl:w-5 xl:h-5 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts row — mobile: Evolución first, Distribución second; xl: Distribución left, Evolución right */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Donut */}
        <div className="glass-card rounded-3xl p-6 xl:col-span-2 order-last xl:order-first">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Distribución</h3>
            <span className="text-xs font-medium px-3 py-1 rounded-xl" style={{ background: 'var(--bg-page)', color: 'var(--text-secondary)' }}>
              {mesActual.nombre}
            </span>
          </div>

          {gastosxCat.length === 0 ? (
            <p className="text-sm text-center py-16" style={{ color: 'var(--text-muted)' }}>Sin gastos este mes</p>
          ) : (
            <>
              <div className="flex items-center justify-center mb-5" style={{ height: 170 }}>
                <canvas ref={donutRef} />
              </div>
              <div className="space-y-3">
                {gastosxCat.map(g => (
                  <div key={g.categoria} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: g.color }} />
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{g.categoria}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ width: 72, background: 'var(--divider)' }}>
                        <div className="h-full rounded-full" style={{ width: `${maxGastosCat > 0 ? (g.total / maxGastosCat) * 100 : 0}%`, background: g.color }} />
                      </div>
                      <span className="text-sm font-semibold text-right" style={{ minWidth: 72, color: 'var(--text-primary)' }}>
                        -{fmt(g.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Line chart */}
        <div className="glass-card rounded-3xl p-6 xl:col-span-3 order-first xl:order-last">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Evolución del balance</h3>
            <span className="text-xs font-medium px-3 py-1 rounded-xl" style={{ background: 'var(--bg-page)', color: 'var(--text-secondary)' }}>
              Últimos {historial.length} meses
            </span>
          </div>
          {historial.length === 0 ? (
            <p className="text-sm text-center py-16" style={{ color: 'var(--text-muted)' }}>Sin historial de meses</p>
          ) : (
            <div style={{ height: 280 }}>
              <canvas ref={lineRef} />
            </div>
          )}
        </div>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent gastos */}
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--divider)' }}>
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Últimos gastos</h3>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{mesActual.nombre}</p>
          </div>
          {recentGastos.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>Sin gastos este mes</p>
          ) : (
            <table className="theme-table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Categoría</th>
                  <th>Fecha</th>
                  <th className="text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                {recentGastos.map(g => {
                  const cat = catGasto.find(c => c.nombre === g.categoria);
                  const bg = cat?.color ?? '#e5e7eb';
                  return (
                    <tr key={g.id}>
                      <td className="py-3 px-4 font-semibold text-sm">{g.gasto}</td>
                      <td className="py-3 px-4 text-sm">
                        {g.categoria
                          ? <span style={{ backgroundColor: bg, color: autoText(bg) }} className="px-2 py-0.5 rounded-full text-xs font-semibold">{g.categoria}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-muted)' }}>{fmtDate(g.fecha)}</td>
                      <td className="py-3 px-4 text-right font-bold text-sm text-red-500">-{fmt(g.importe)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="px-6 py-3" style={{ borderTop: '1px solid var(--divider)' }}>
            <Link href={`/hogar/mes/${mesActual.anio}/${mesActual.mes}`}
              className="text-sm font-semibold" style={{ color: 'var(--sidebar-hover-c)' }}>
              Ver todos los gastos →
            </Link>
          </div>
        </div>

        {/* Préstamos activos */}
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--divider)' }}>
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Préstamos activos</h3>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Pagos del mes</p>
          </div>
          {prestamos.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>Sin préstamos este mes</p>
          ) : (
            <div className="px-6 py-5 space-y-5">
              {prestamos.map((p, i) => {
                const COLORS = ['#6366f1','#ec4899','#0ea5e9','#10b981','#f97316','#8b5cf6'];
                const color = COLORS[i % COLORS.length];
                const pct = totalPrestamos > 0 ? (p.importe / totalPrestamos) * 100 : 0;
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{p.gasto}</h4>
                        {p.categoria && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.categoria}</p>}
                      </div>
                      <p className="font-bold text-sm text-red-500">-{fmt(p.importe)}</p>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="px-6 py-3" style={{ borderTop: '1px solid var(--divider)' }}>
            <Link href={`/hogar/mes/${mesActual.anio}/${mesActual.mes}`}
              className="text-sm font-semibold" style={{ color: 'var(--sidebar-hover-c)' }}>
              Ver detalle del mes →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

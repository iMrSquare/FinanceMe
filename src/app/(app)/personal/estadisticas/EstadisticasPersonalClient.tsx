'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { EstadisticasData } from '@/lib/db';
import {
  Chart, BarElement, BarController, LineElement, LineController,
  PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend,
} from 'chart.js';

Chart.register(BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend);

function fmt(n: number) { return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }); }
function autoText(hex: string) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return (0.299*r + 0.587*g + 0.114*b) > 145 ? '#1f2937' : '#ffffff';
}
function hex2rgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface Props { data: EstadisticasData; }

const PERIOD_OPTIONS = [
  { label: '3 meses', value: 3 },
  { label: '6 meses', value: 6 },
  { label: 'Todo', value: 999 },
];

export default function EstadisticasPersonalClient({ data }: Props) {
  const [period, setPeriod] = useState(6);
  const stackedRef = useRef<HTMLCanvasElement>(null);
  const stackedChart = useRef<Chart | null>(null);
  const miniRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const miniCharts = useRef<(Chart | null)[]>([]);

  const sliceN = Math.min(period, data.mesesLabels.length);
  const labels = data.mesesLabels.slice(-sliceN);
  const cats = data.categorias.map(c => ({
    ...c,
    totalesPorMes: c.totalesPorMes.slice(-sliceN),
    total: c.totalesPorMes.slice(-sliceN).reduce((s, v) => s + v, 0),
    promedio: c.totalesPorMes.slice(-sliceN).reduce((s, v) => s + v, 0) / Math.max(sliceN, 1),
  })).sort((a, b) => b.total - a.total);

  function getTheme() {
    const dark = document.documentElement.classList.contains('dark');
    return { grid: dark ? '#334155' : '#e2e8f0', tick: dark ? '#94a3b8' : '#64748b' };
  }

  const buildStacked = useCallback(() => {
    if (!stackedRef.current || labels.length === 0) return;
    stackedChart.current?.destroy();
    const t = getTheme();
    stackedChart.current = new Chart(stackedRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: cats.map(c => ({
          label: c.categoria,
          data: c.totalesPorMes,
          backgroundColor: hex2rgba(c.color, 0.85),
          borderColor: c.color,
          borderWidth: 1,
          borderRadius: 4,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: t.tick, padding: 16, boxWidth: 12, boxHeight: 12 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y as number)}` } },
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: t.tick } },
          y: { stacked: true, grid: { color: t.grid }, ticks: { color: t.tick, callback: v => fmt(Number(v)) } },
        },
      },
    });
  }, [labels, cats]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildMini = useCallback((idx: number) => {
    const canvas = miniRefs.current[idx];
    if (!canvas) return;
    miniCharts.current[idx]?.destroy();
    const c = cats[idx];
    if (!c) return;
    const t = getTheme();
    miniCharts.current[idx] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: c.totalesPorMes,
          backgroundColor: hex2rgba(c.color, 0.8),
          borderColor: c.color,
          borderWidth: 1,
          borderRadius: 3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed.y as number)}` } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: t.tick, font: { size: 10 } } },
          y: { grid: { color: t.grid }, ticks: { color: t.tick, font: { size: 10 }, callback: v => fmt(Number(v)) } },
        },
      },
    });
  }, [labels, cats]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateColors() {
    const t = getTheme();
    if (stackedChart.current) {
      const opts = stackedChart.current.options as { scales: Record<string, { grid?: { color: string }; ticks: { color: string } }>; plugins: { legend: { labels: { color: string } } } };
      opts.scales.x.ticks.color = t.tick;
      opts.scales.y.grid!.color = t.grid;
      opts.scales.y.ticks.color = t.tick;
      opts.plugins.legend.labels.color = t.tick;
      stackedChart.current.update();
    }
    miniCharts.current.forEach(ch => {
      if (!ch) return;
      const opts = ch.options as { scales: Record<string, { grid?: { color: string }; ticks: { color: string } }> };
      opts.scales.x.ticks.color = t.tick;
      opts.scales.y.grid!.color = t.grid;
      opts.scales.y.ticks.color = t.tick;
      ch.update();
    });
  }

  useEffect(() => {
    buildStacked();
    cats.forEach((_, i) => buildMini(i));
    const obs = new MutationObserver(updateColors);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      obs.disconnect();
      stackedChart.current?.destroy();
      miniCharts.current.forEach(c => c?.destroy());
    };
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  if (data.mesesLabels.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(249,115,22,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Estadísticas</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Evolución de gastos por categoría</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Sin datos — añade meses para ver estadísticas</p>
        </div>
      </div>
    );
  }

  const totalPeriodo = cats.reduce((s, c) => s + c.total, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(249,115,22,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Estadísticas</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Evolución de gastos por categoría</p>
          </div>
        </div>
        {/* Period selector */}
        <div className="flex items-center gap-1 p-1 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          {PERIOD_OPTIONS.map(opt => {
            if (opt.value !== 999 && opt.value > data.mesesLabels.length) return null;
            const active = period === opt.value || (opt.value === 999 && period >= data.mesesLabels.length);
            return (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className="px-4 py-1.5 text-sm font-semibold rounded-xl transition-all"
                style={{
                  background: active ? 'rgba(249,115,22,0.15)' : 'transparent',
                  color: active ? '#f97316' : 'var(--text-muted)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cats.map(c => (
          <div key={c.categoria} className="glass-card rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>{c.categoria}</span>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{fmt(c.total)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              ~{fmt(c.promedio)}/mes · {totalPeriodo > 0 ? Math.round((c.total / totalPeriodo) * 100) : 0}% del total
            </p>
          </div>
        ))}
      </div>

      {/* Stacked bar chart */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Gastos por categoría</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Total período: {fmt(totalPeriodo)}
            </p>
          </div>
        </div>
        <div style={{ height: 320 }}>
          <canvas ref={stackedRef} />
        </div>
      </div>

      {/* Per-category detail cards */}
      <div>
        <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Detalle por categoría</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cats.map((c, i) => {
            const max = Math.max(...c.totalesPorMes, 1);
            return (
              <div key={c.categoria} className="glass-card rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span
                    style={{ backgroundColor: c.color, color: autoText(c.color) }}
                    className="px-3 py-1 rounded-full text-xs font-bold"
                  >
                    {c.categoria}
                  </span>
                  <div className="text-right">
                    <p className="font-extrabold text-lg" style={{ color: 'var(--text-primary)' }}>{fmt(c.total)}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>~{fmt(c.promedio)}/mes</p>
                  </div>
                </div>

                <div style={{ height: 140 }}>
                  <canvas ref={el => { miniRefs.current[i] = el; }} />
                </div>

                <div className="mt-4 space-y-1.5">
                  {labels.map((label, mi) => {
                    const val = c.totalesPorMes[mi];
                    const pct = max > 0 ? (val / max) * 100 : 0;
                    return (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs w-24 shrink-0 truncate" style={{ color: 'var(--text-muted)' }}>{label}</span>
                        <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--divider)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: c.color }} />
                        </div>
                        <span className="text-xs font-mono w-20 text-right shrink-0" style={{ color: val > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {val > 0 ? fmt(val) : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

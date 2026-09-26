'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { EstadisticasData } from '@/lib/db';
import { autoText } from '@/components/ColorDots';
import { MonthYearInput } from '@/components/MonthYearInput';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { ChevronRightIcon } from '@/components/icons';
import { CategoryBadge } from '@/components/ui/Chips';
import CategoryIconGlyph from '@/components/CategoryIconGlyph';
import { formatEUR } from '@/lib/format';
import {
  Chart, BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js';

Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend);

type Scope = 'hogar' | 'personal';
type Periodo = '1' | '3' | '6' | '12' | 'anio' | 'todo' | 'custom';

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: '1', label: 'Último mes' },
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
  { value: 'anio', label: 'Año actual' },
  { value: 'todo', label: 'Todo' },
  { value: 'custom', label: 'Personalizado' },
];

const fmt = (n: number) => formatEUR(n);
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fmtYM = (ym: string) => ym ? `${MESES_CORTOS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}` : '…';

function hex2rgba(hex: string, alpha: number) {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getTheme() {
  const cs = getComputedStyle(document.documentElement);
  return { grid: cs.getPropertyValue('--sidebar-border').trim(), tick: cs.getPropertyValue('--text-secondary').trim() };
}

function rango(p: Periodo, disponibles: string[], desde: string, hasta: string): URLSearchParams {
  const q = new URLSearchParams();
  if (p === 'todo') q.set('todo', '1');
  else if (p === 'anio') { const y = new Date().getFullYear(); q.set('desde', `${y}-01`); q.set('hasta', `${y}-12`); }
  else if (p === 'custom') {
    const [a, b] = desde && hasta && desde > hasta ? [hasta, desde] : [desde, hasta];
    if (a) q.set('desde', a);
    if (b) q.set('hasta', b);
  } else if (disponibles.length) {
    const n = Number(p);
    q.set('desde', disponibles[Math.max(0, disponibles.length - n)]);
    q.set('hasta', disponibles[disponibles.length - 1]);
  }
  return q;
}

interface Props {
  scope: Scope;
  initial: EstadisticasData;
}

export default function EstadisticasView({ scope, initial }: Props) {
  const apiUrl = scope === 'hogar' ? '/api/estadisticas' : '/api/personal/estadisticas';
  const disponibles = initial.disponibles ?? [];
  const categoriasDisponibles = initial.categoriasDisponibles ?? [];

  const [data, setData] = useState(initial);
  const [periodo, setPeriodo] = useState<Periodo>(disponibles.length > 6 ? '6' : 'todo');
  const [desde, setDesde] = useState(disponibles[0] ?? '');
  const [hasta, setHasta] = useState(disponibles[disponibles.length - 1] ?? '');
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stackedRef = useRef<HTMLCanvasElement>(null);
  const miniRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  const years = [...new Set([...disponibles.map(d => Number(d.slice(0, 4))), new Date().getFullYear()])].sort();

  async function cargar(next: { periodo?: Periodo; desde?: string; hasta?: string; seleccion?: string[] }) {
    const p = next.periodo ?? periodo;
    const d = next.desde ?? desde;
    const h = next.hasta ?? hasta;
    const s = next.seleccion ?? seleccion;
    if (next.periodo !== undefined) setPeriodo(p);
    if (next.desde !== undefined) setDesde(d);
    if (next.hasta !== undefined) setHasta(h);
    if (next.seleccion !== undefined) setSeleccion(s);

    const q = rango(p, disponibles, d, h);
    s.forEach(c => q.append('cat', c));
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setCargando(true);
    try {
      const res = await fetch(`${apiUrl}?${q}`, { signal: ctrl.signal });
      if (res.ok) setData(await res.json());
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error(err);
    } finally {
      if (abortRef.current === ctrl) setCargando(false);
    }
  }

  function toggleCategoria(nombre: string) {
    cargar({ seleccion: seleccion.includes(nombre) ? seleccion.filter(c => c !== nombre) : [...seleccion, nombre] });
  }

  const labels = data.mesesLabels;
  const cats = data.categorias;
  const totalPeriodo = cats.reduce((s, c) => s + c.total, 0);
  const hayFiltros = seleccion.length > 0 || periodo !== (disponibles.length > 6 ? '6' : 'todo');
  const periodoLabel = periodo === 'custom' ? `De ${fmtYM(desde)} a ${fmtYM(hasta)}` : PERIODOS.find(p => p.value === periodo)!.label;
  const resumenFiltros = `${periodoLabel} · ${seleccion.length === 0 ? 'Todas las categorías' : seleccion.length === 1 ? seleccion[0] : `${seleccion.length} categorías`}`;

  useEffect(() => {
    const charts: Chart[] = [];
    const t = getTheme();
    if (stackedRef.current && labels.length) {
      charts.push(new Chart(stackedRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: cats.map(c => ({
            label: c.categoria, data: c.totalesPorMes,
            backgroundColor: hex2rgba(c.color, 0.85), borderColor: c.color, borderWidth: 1, borderRadius: 4,
          })),
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: t.tick, padding: 16, boxWidth: 12, boxHeight: 12 } },
            tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y as number)}` } },
          },
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { color: t.tick } },
            y: { stacked: true, grid: { color: t.grid }, ticks: { color: t.tick, callback: v => fmt(Number(v)) } },
          },
        },
      }));
    }
    cats.forEach((c, i) => {
      const canvas = miniRefs.current[i];
      if (!canvas) return;
      charts.push(new Chart(canvas, {
        type: 'bar',
        data: { labels, datasets: [{ data: c.totalesPorMes, backgroundColor: hex2rgba(c.color, 0.8), borderColor: c.color, borderWidth: 1, borderRadius: 3 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed.y as number)}` } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: t.tick, font: { size: 10 } } },
            y: { grid: { color: t.grid }, ticks: { color: t.tick, font: { size: 10 }, callback: v => fmt(Number(v)) } },
          },
        },
      }));
    });

    const recolor = () => {
      const th = getTheme();
      charts.forEach(ch => {
        const o = ch.options as { scales: Record<string, { grid?: { color: string }; ticks: { color: string } }>; plugins: { legend?: { labels?: { color: string } } } };
        o.scales.x.ticks.color = th.tick;
        if (o.scales.y.grid) o.scales.y.grid.color = th.grid;
        o.scales.y.ticks.color = th.tick;
        if (o.plugins.legend?.labels) o.plugins.legend.labels.color = th.tick;
        ch.update();
      });
    };
    const obs = new MutationObserver(recolor);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
    return () => { obs.disconnect(); charts.forEach(c => c.destroy()); };
  }, [labels, cats]);

  const segBtn = (active: boolean) => ({
    className: 'px-3 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer min-h-[40px] focus-visible:outline-2 focus-visible:outline-offset-2',
    style: { background: active ? 'var(--accent-mode)' : 'transparent', color: active ? 'var(--on-accent)' : 'var(--text-secondary)', outlineColor: 'var(--accent-mode)' },
  });
  const selectCls = 'w-full rounded-xl px-3 py-2 text-sm border appearance-none cursor-pointer focus:outline-none focus:ring-2';
  const selectStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };

  return (
    <div>
      <Link href={`/${scope}`} className="inline-flex items-center gap-1.5 mb-3 text-sm font-medium min-h-11 hover:underline" style={{ color: 'var(--text-secondary)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        Volver a Resumen
      </Link>
      <PageHeader title="Estadísticas" subtitle="Evolución de tus gastos por categoría" />

      {disponibles.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Sin datos — añade meses para ver estadísticas</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 [&_section]:mb-0">
          {/* ── Filtros (desplegable) ── */}
          <details className="fm-card group" aria-label="Filtros">
            <summary className="flex items-center gap-3 px-5 py-3.5 min-h-[56px] cursor-pointer list-none [&::-webkit-details-marker]:hidden rounded-[var(--radius-card)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent-mode)]">
              <ChevronRightIcon className="w-4 h-4 shrink-0 transition-transform group-open:rotate-90" />
              <span className="flex-1 min-w-0">
                <span className="block font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Filtros{hayFiltros && <span className="sr-only"> (activos)</span>}
                </span>
                <span className="block text-[13px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {resumenFiltros}
                </span>
              </span>
              <span className="text-sm shrink-0 tabular-nums text-right" style={{ color: 'var(--text-secondary)' }} aria-live="polite">
                {cargando ? 'Actualizando…' : <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{fmt(totalPeriodo)}</strong>}
              </span>
            </summary>
            <div className="px-5 pb-5 pt-4 space-y-5" style={{ borderTop: '1px solid var(--divider)' }}>
            <div>
              <p className="fm-label">Periodo</p>
              <div className="flex flex-wrap gap-1 p-1 rounded-2xl" style={{ background: 'var(--bg-page)' }} role="group" aria-label="Periodo">
                {PERIODOS.map(p => (
                  <button key={p.value} type="button" aria-pressed={periodo === p.value} onClick={() => cargar({ periodo: p.value })} {...segBtn(periodo === p.value)}>
                    {p.label}
                  </button>
                ))}
              </div>
              {periodo === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Desde</p>
                    <MonthYearInput value={desde} onChange={v => cargar({ desde: v })} years={years} ariaLabel="Desde" className={selectCls} style={selectStyle} />
                  </div>
                  <div>
                    <p className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Hasta</p>
                    <MonthYearInput value={hasta} onChange={v => cargar({ hasta: v })} years={years} ariaLabel="Hasta" className={selectCls} style={selectStyle} />
                  </div>
                </div>
              )}
            </div>

            {categoriasDisponibles.length > 0 && (
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="fm-label !mb-0">
                    Categorías {seleccion.length > 0 && <span style={{ color: 'var(--accent-mode)' }}>· {seleccion.length} seleccionada{seleccion.length !== 1 ? 's' : ''}</span>}
                  </p>
                  {seleccion.length > 0 && (
                    <button type="button" onClick={() => cargar({ seleccion: [] })} className="text-xs font-semibold cursor-pointer min-h-[32px] px-2" style={{ color: 'var(--accent-mode)' }}>
                      Todas
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías">
                  {categoriasDisponibles.map(c => {
                    const activa = seleccion.includes(c.nombre);
                    return (
                      <button key={c.nombre} type="button" aria-pressed={activa} onClick={() => toggleCategoria(c.nombre)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer min-h-[32px]"
                        style={activa
                          ? { background: c.color, color: autoText(c.color), borderColor: c.color }
                          : { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'var(--btn-border)' }}>
                        {!activa && <CategoryIconGlyph iconId={c.icono} className="w-3.5 h-3.5" style={{ color: c.color }} />}
                        {c.nombre}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Sin selección se muestran todas las categorías.</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--divider)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {labels.length} mes{labels.length !== 1 ? 'es' : ''} · {cats.length} categoría{cats.length !== 1 ? 's' : ''}
              </p>
              {hayFiltros && (
                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => cargar({ periodo: disponibles.length > 6 ? '6' : 'todo', seleccion: [] })}>
                  Limpiar filtros
                </Button>
              )}
            </div>
            </div>
          </details>

          <div className={`space-y-8 transition-opacity ${cargando ? 'opacity-60' : ''}`}>
            {cats.length === 0 ? (
              <div className="fm-card p-10 text-center">
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Sin gastos para estos filtros</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Prueba con otro periodo u otras categorías.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {cats.map(c => (
                    <div key={c.categoria} className="fm-card p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <CategoryBadge color={c.color} icono={c.icono} />
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>{c.categoria}</span>
                      </div>
                      <p className="text-2xl font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{fmt(c.total)}</p>
                      <p className="text-xs mt-1 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        ~{fmt(c.promedio)}/mes · {totalPeriodo > 0 ? Math.round((c.total / totalPeriodo) * 100) : 0}% del total
                      </p>
                    </div>
                  ))}
                </div>

                <div className="fm-card p-6">
                  <div className="mb-5">
                    <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Gastos por categoría</h2>
                    <p className="text-sm mt-0.5 tabular-nums" style={{ color: 'var(--text-secondary)' }}>Total período: {fmt(totalPeriodo)}</p>
                  </div>
                  <div style={{ height: 320 }}>
                    <canvas ref={stackedRef} role="img" aria-label={`Gráfico de barras apiladas de gastos por categoría, total ${fmt(totalPeriodo)}`} />
                  </div>
                </div>

                <div>
                  <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Detalle por categoría</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cats.map((c, i) => {
                      const max = Math.max(...c.totalesPorMes, 1);
                      return (
                        <div key={c.categoria} className="fm-card p-6">
                          <div className="flex items-center justify-between mb-4">
                            <span className="flex items-center gap-2 font-semibold min-w-0"><CategoryBadge color={c.color} icono={c.icono} /><span className="truncate">{c.categoria}</span></span>
                            <div className="text-right">
                              <p className="font-semibold text-lg tabular-nums" style={{ color: 'var(--text-primary)' }}>{fmt(c.total)}</p>
                              <p className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>~{fmt(c.promedio)}/mes</p>
                            </div>
                          </div>
                          <div style={{ height: 140 }}>
                            <canvas ref={el => { miniRefs.current[i] = el; }} role="img" aria-label={`Gastos mensuales de ${c.categoria}`} />
                          </div>
                          <div className="mt-4 space-y-1.5">
                            {labels.map((label, mi) => {
                              const val = c.totalesPorMes[mi];
                              return (
                                <div key={label} className="flex items-center gap-3">
                                  <span className="text-xs w-24 shrink-0 truncate" style={{ color: 'var(--text-muted)' }}>{label}</span>
                                  <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--divider)' }}>
                                    <div className="h-full rounded-full" style={{ width: `${(val / max) * 100}%`, background: c.color }} />
                                  </div>
                                  <span className="text-xs font-mono tabular-nums w-20 text-right shrink-0" style={{ color: val > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

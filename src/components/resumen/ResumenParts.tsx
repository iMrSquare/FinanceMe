'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import Section from '@/components/ui/Section';
import Button from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { CategoryBadge } from '@/components/ui/Chips';
import { BellIcon, RepeatIcon, BoltIcon, DropletIcon } from '@/components/icons';
import { formatEUR } from '@/lib/format';
import { nextBillingDate, monthlyEquivalent } from '@/lib/billing';
import { PERIODICIDAD_LABEL } from '@/lib/recurrentes';
import {
  Chart, LineElement, LineController, PointElement, CategoryScale, LinearScale, Filler, Tooltip,
} from 'chart.js';

Chart.register(LineElement, LineController, PointElement, CategoryScale, LinearScale, Filler, Tooltip);

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** «Ingresos X · Gastos Y» sin partir los importes */
export function IngresosGastos({ ingresos, gastos }: { ingresos: number; gastos: number }) {
  return (
    <>
      <span className="whitespace-nowrap">Ingresos <span className="text-money-in font-medium">{formatEUR(ingresos)}</span></span>
      {' · '}
      <span className="whitespace-nowrap">Gastos <span className="text-money-out font-medium">{formatEUR(gastos)}</span></span>
    </>
  );
}

export interface Pago { day: number; nombre: string; importe: number; tipo: 'gasto' | 'recurrente' }
interface Opcion { nombre: string; color?: string; icono?: string | null }

const colorPago = (t: Pago['tipo']) => (t === 'gasto' ? 'var(--money-out)' : 'var(--accent-mode)');
const ChevronIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>;
const ver = (href: string, texto: string) => <Button size="sm" variant="ghost" href={href} icon={<ChevronIcon />} className="flex-row-reverse !gap-1">{texto}</Button>;

/* ── Calendario del mes: puntos en móvil, nombres en pantallas anchas ── */
export function CalendarioPagos({ pagos }: { pagos: Pago[] }) {
  const hoy = new Date();
  const [y, m] = [hoy.getFullYear(), hoy.getMonth()];
  const diasMes = new Date(y, m + 1, 0).getDate();
  const primero = (new Date(y, m, 1).getDay() + 6) % 7;
  const porDia: Record<number, Pago[]> = {};
  for (const p of pagos) (porDia[p.day] ??= []).push(p);
  Object.values(porDia).forEach(l => l.sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === 'recurrente' ? -1 : 1)));
  const celdas: (number | null)[] = [...Array(primero).fill(null), ...Array.from({ length: diasMes }, (_, i) => i + 1)];
  while (celdas.length % 7) celdas.push(null);

  return (
    <Section id="res-calendario" title={`Calendario de ${MESES[m].toLowerCase()}`} count={pagos.length} tone="neutral">
      <div className="p-3 sm:p-5">
        <div className="grid grid-cols-7 gap-1 mb-1" aria-hidden="true">
          {DIAS_SEMANA.map(d => <div key={d} className="text-center text-xs font-medium py-1" style={{ color: 'var(--text-muted)' }}>{d}</div>)}
        </div>
        <ol className="grid grid-cols-7 gap-1">
          {celdas.map((dia, i) => {
            if (!dia) return <li key={i} aria-hidden="true" />;
            const evs = porDia[dia] ?? [];
            const esHoy = dia === hoy.getDate();
            const pasado = dia < hoy.getDate();
            return (
              <li key={i}
                className="rounded-[var(--radius-control)] p-1 sm:p-1.5 min-h-11 sm:min-h-[62px] flex flex-col items-center sm:items-stretch"
                style={{
                  background: evs.length ? 'var(--row-hover)' : undefined,
                  boxShadow: esHoy ? 'inset 0 0 0 1.5px var(--accent-mode)' : undefined,
                }}
                aria-label={`${dia}${esHoy ? ', hoy' : ''}${evs.length ? `: ${evs.map(e => `${e.nombre} ${formatEUR(e.importe)}`).join(', ')}` : ''}`}>
                <span className="text-[13px] font-medium tabular-nums" style={{ color: esHoy ? 'var(--accent-mode)' : pasado ? 'var(--text-muted)' : 'var(--text-secondary)' }}>{dia}</span>
                {/* Móvil: un punto por pago */}
                {evs.length > 0 && (
                  <span className="flex gap-0.5 mt-1 sm:hidden" aria-hidden="true">
                    {evs.slice(0, 3).map((e, j) => <span key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: colorPago(e.tipo), opacity: pasado ? 0.45 : 1 }} />)}
                  </span>
                )}
                {/* Pantallas anchas: nombre de los dos primeros */}
                <span className="hidden sm:flex flex-col gap-0.5 mt-1 min-w-0" aria-hidden="true">
                  {evs.slice(0, 2).map((e, j) => (
                    <span key={j} className="truncate rounded px-1 text-[11px] leading-4"
                      style={{ background: `color-mix(in srgb, ${colorPago(e.tipo)} 12%, transparent)`, color: colorPago(e.tipo), opacity: pasado ? 0.6 : 1 }}>
                      {e.nombre}
                    </span>
                  ))}
                  {evs.length > 2 && <span className="text-[11px] px-1" style={{ color: 'var(--text-muted)' }}>+{evs.length - 2} más</span>}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="flex items-center gap-4 mt-3 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--money-out)' }} aria-hidden="true" />Gasto del mes</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-mode)' }} aria-hidden="true" />Recurrente</span>
        </p>
      </div>
    </Section>
  );
}

/* ── Próximos pagos de lo que queda de mes ── */
export function ProximosPagos({ pagos, scope, max = 6 }: { pagos: Pago[]; scope: 'personal' | 'hogar'; max?: number }) {
  const hoy = new Date();
  const lista = pagos.filter(p => p.day >= hoy.getDate()).sort((a, b) => a.day - b.day);
  const total = lista.reduce((s, p) => s + p.importe, 0);
  return (
    <Section id="res-proximos" title="Próximos pagos" count={lista.length} tone="out" actions={ver(`/${scope}/avisos`, 'Avisos')}>
      {lista.length === 0 ? (
        <EmptyState icon={<BellIcon />} title="No quedan pagos este mes" text="Los pagos del Mes y de tus Recurrentes aparecen aquí según su fecha." />
      ) : (
        <>
          <ul>
            {lista.slice(0, max).map((p, i) => {
              const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), p.day);
              const dias = p.day - hoy.getDate();
              return (
                <li key={i} className="flex items-center gap-3 px-4 sm:px-5 py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--divider)' }}>
                  <span className="w-11 shrink-0 rounded-[var(--radius-control)] py-1 text-center" style={{ background: `color-mix(in srgb, ${colorPago(p.tipo)} 12%, transparent)`, color: colorPago(p.tipo) }}>
                    <span className="block text-base font-semibold leading-tight tabular-nums">{p.day}</span>
                    <span className="block text-[11px] leading-tight">{DIAS_CORTOS[fecha.getDay()]}</span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{p.nombre}</span>
                    <span className="block text-[13px]" style={{ color: 'var(--text-muted)' }}>
                      {p.tipo === 'recurrente' ? 'Recurrente' : 'Gasto del mes'}{dias === 0 ? ' · hoy' : dias === 1 ? ' · mañana' : ''}
                    </span>
                  </span>
                  <span className="text-[15px] font-semibold tabular-nums shrink-0" style={{ color: 'var(--text-primary)' }}>{formatEUR(p.importe)}</span>
                </li>
              );
            })}
          </ul>
          <p className="px-4 sm:px-5 py-2.5 text-[13px] flex justify-between" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--divider)', background: 'var(--row-hover)' }}>
            <span>{lista.length > max ? `Y ${lista.length - max} más` : 'Pendiente este mes'}</span>
            <span className="font-semibold tabular-nums" style={{ color: 'var(--text-secondary)' }}>{formatEUR(total)}</span>
          </p>
        </>
      )}
    </Section>
  );
}

/* ── Recurrentes: los próximos en cobrarse ── */
interface RecurrenteRes { id: number; nombre: string; importe: number; cobro: string | null; periodicidad: string; categoria?: string | null }

export function RecurrentesResumen({ items, categorias, scope, max = 5 }: { items: RecurrenteRes[]; categorias: Opcion[]; scope: 'personal' | 'hogar'; max?: number }) {
  const href = `/${scope}/modulos/recurrentes`;
  const mensual = items.reduce((s, r) => s + monthlyEquivalent(r.importe, r.periodicidad), 0);
  const proximo = (r: RecurrenteRes) => (r.cobro ? nextBillingDate(r.cobro, r.periodicidad) : null);
  const orden = [...items].sort((a, b) => (proximo(a)?.getTime() ?? Infinity) - (proximo(b)?.getTime() ?? Infinity));
  const cat = (n?: string | null) => categorias.find(c => c.nombre === n);
  return (
    <Section id="res-recurrentes" title="Recurrentes" count={items.length} total={items.length ? <span className="hidden sm:inline">{formatEUR(mensual)}/mes</span> : undefined} actions={ver(href, 'Ver todos')}>
      {items.length === 0 ? (
        <EmptyState icon={<RepeatIcon />} title="Sin recurrentes"
          text={scope === 'hogar' ? 'Añade seguros, comunidad, IBI y otros pagos periódicos de la casa.' : 'Añade suscripciones, seguros y otros pagos periódicos.'}
          action={<Button variant="primary" href={href}>Añadir recurrente</Button>} />
      ) : (
        <ul className="[&>li:last-child>a]:border-b-0">
          {orden.slice(0, max).map(r => {
            const p = proximo(r);
            const c = cat(r.categoria);
            return (
              <li key={r.id}>
                <Link href={href} className="flex items-center gap-3 px-4 sm:px-5 py-2.5 border-b transition-colors hover:bg-[var(--row-hover)]" style={{ borderColor: 'var(--divider)' }}>
                  <CategoryBadge color={c?.color ?? 'var(--accent-mode)'} icono={c?.icono ?? 'Repeat'} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.nombre}</span>
                    <span className="block text-[13px]" style={{ color: 'var(--text-muted)' }}>
                      {PERIODICIDAD_LABEL[r.periodicidad] ?? r.periodicidad}
                      {p && ` · ${p.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
                    </span>
                  </span>
                  <span className="text-[15px] font-semibold tabular-nums shrink-0" style={{ color: 'var(--text-primary)' }}>{formatEUR(r.importe)}</span>
                </Link>
              </li>
            );
          })}
          {items.length > max && (
            <li className="px-4 sm:px-5 py-2.5 text-[13px]" style={{ color: 'var(--text-muted)' }}>Y {items.length - max} más</li>
          )}
        </ul>
      )}
    </Section>
  );
}

/* ── Categorías con más gasto (últimos 6 meses) ── */
interface CatTotal { categoria: string; total: number; color: string; icono?: string | null }

export function TopCategorias({ categorias, scope, cargando }: { categorias: CatTotal[]; scope: 'personal' | 'hogar'; cargando?: boolean }) {
  const top = categorias.slice(0, 5);
  const total = categorias.reduce((s, c) => s + c.total, 0);
  const max = top[0]?.total || 1;
  return (
    <Section id="res-categorias" title="Categorías con más gasto" total={<span className="hidden sm:inline text-[13px] font-normal" style={{ color: 'var(--text-muted)' }}>Últimos 6 meses</span>}
      tone="neutral" actions={ver(`/${scope}/estadisticas`, 'Estadísticas')}>
      {cargando ? (
        <p className="px-5 py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
      ) : top.length === 0 ? (
        <EmptyState title="Sin gastos en este periodo" text="Cuando registres gastos en el Mes verás aquí en qué se va el dinero." />
      ) : (
        <ul className="px-4 sm:px-5 py-3 space-y-3.5">
          {top.map(c => (
            <li key={c.categoria}>
              <div className="flex items-center gap-3">
                <CategoryBadge color={c.color} icono={c.icono} />
                <span className="flex-1 min-w-0">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-[15px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{c.categoria}</span>
                    <span className="text-[15px] font-semibold tabular-nums shrink-0" style={{ color: 'var(--text-primary)' }}>{formatEUR(c.total)}</span>
                  </span>
                  <span className="flex items-center gap-2 mt-1.5">
                    <span className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                      <span className="block h-full rounded-full" style={{ width: `${(c.total / max) * 100}%`, background: c.color }} />
                    </span>
                    <span className="text-[12px] tabular-nums w-9 text-right" style={{ color: 'var(--text-muted)' }}>{total > 0 ? Math.round((c.total / total) * 100) : 0} %</span>
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* ── Últimos registros de luz y agua (Hogar) ── */
interface RegistroRes { nombre: string; importe: number; fecha: string | null; consumo: string | null }

export function RegistrosResumen({ luz, agua }: { luz: RegistroRes | null; agua: RegistroRes | null }) {
  const fila = (titulo: string, icono: ReactNode, color: string, r: RegistroRes | null) => (
    <li>
      <Link href="/hogar/modulos/registros" className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b last:border-b-0 transition-colors hover:bg-[var(--row-hover)]" style={{ borderColor: 'var(--divider)' }}>
        <span className="fm-caticon" style={{ ['--fm-c' as string]: color }} aria-hidden="true">{icono}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>{titulo}{r && <span className="font-normal" style={{ color: 'var(--text-muted)' }}> · {r.nombre}</span>}</span>
          <span className="block text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {r ? [r.fecha, r.consumo].filter(Boolean).join(' · ') || 'Sin fecha' : 'Sin registros'}
          </span>
        </span>
        {r && <span className="text-[15px] font-semibold tabular-nums shrink-0" style={{ color: 'var(--text-primary)' }}>{formatEUR(r.importe)}</span>}
      </Link>
    </li>
  );
  return (
    <Section id="res-registros" title="Últimos registros" tone="neutral" actions={ver('/hogar/modulos/registros', 'Registros')}>
      <ul>
        {fila('Luz', <BoltIcon />, 'var(--color-warning)', luz)}
        {fila('Agua', <DropletIcon />, 'var(--color-info)', agua)}
      </ul>
    </Section>
  );
}

/* ── Ingresos y gastos de los últimos meses ── */
export function EvolucionChart({ labels, ingresos, gastos }: { labels: string[]; ingresos: number[]; gastos: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);

  useEffect(() => {
    if (labels.length < 2) return;
    function build() {
      const cs = getComputedStyle(document.documentElement);
      const v = (k: string) => cs.getPropertyValue(k).trim();
      const [grid, tick, cin, cout] = [v('--divider'), v('--text-muted'), v('--money-in'), v('--money-out')];
      chart.current?.destroy();
      if (!ref.current) return;
      const serie = (label: string, data: number[], color: string) => ({
        label, data, borderColor: color, backgroundColor: color, tension: 0.35, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2,
      });
      chart.current = new Chart(ref.current, {
        type: 'line',
        data: { labels, datasets: [serie('Ingresos', ingresos, cin), serie('Gastos', gastos, cout)] },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatEUR(ctx.parsed.y as number)}` } } },
          scales: {
            y: { grid: { color: grid }, border: { display: false }, ticks: { color: tick, callback: val => `${Number(val).toLocaleString('es-ES', { maximumFractionDigits: 0 })} €` } },
            x: { grid: { display: false }, ticks: { color: tick } },
          },
        },
      });
    }
    build();
    const obs = new MutationObserver(build);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
    return () => { obs.disconnect(); chart.current?.destroy(); };
  }, [labels, ingresos, gastos]);

  return (
    <Section id="res-evolucion" title="Ingresos y gastos" tone="neutral"
      total={<span className="flex items-center gap-3 text-[13px] font-normal" style={{ color: 'var(--text-muted)' }}>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded" style={{ background: 'var(--money-in)' }} aria-hidden="true" />Ingresos</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded" style={{ background: 'var(--money-out)' }} aria-hidden="true" />Gastos</span>
      </span>}>
      {labels.length < 2 ? (
        <EmptyState title="Aún no hay historial suficiente" text="La gráfica aparece cuando tengas al menos dos meses con movimientos." />
      ) : (
        <div className="px-3 sm:px-5 py-4" style={{ height: 260 }}>
          <canvas ref={ref} role="img" aria-label={`Ingresos y gastos de ${labels[0]} a ${labels[labels.length - 1]}`} />
        </div>
      )}
    </Section>
  );
}

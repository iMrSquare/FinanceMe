'use client';

import Link from 'next/link';
import type { ProximoPago } from '@/lib/avisos';
import InfoExpand from '@/components/InfoExpand';
import { BellIcon, ChevronRightIcon, ReceiptIcon, RepeatIcon } from '@/components/icons';
import NotificacionesCard from './NotificacionesCard';

type Scope = 'hogar' | 'personal';

const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

function parseISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function diasEntre(a: string, b: string) {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
}

function etiqueta(dias: number) {
  if (dias < 0) return 'Pasado';
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return `En ${dias} días`;
}

function ListaPagos({ pagos, hoy, accent }: { pagos: ProximoPago[]; hoy: string; accent: string }) {
  return (
    <ul>
      {pagos.map(p => {
        const dias = diasEntre(hoy, p.fecha);
        const pasado = dias < 0;
        const urgente = dias === 0 || dias === 1;
        const color = pasado ? 'var(--text-muted)' : urgente ? 'var(--color-warning)' : accent;
        const d = parseISO(p.fecha);
        return (
          <li key={p.clave} style={{ borderBottom: '1px solid var(--divider)' }} className="last:border-b-0">
            <Link href={p.href} className="flex items-center gap-4 px-5 py-3 min-h-[56px] transition-colors hover:bg-[var(--row-hover)]"
              aria-label={`${p.concepto}, ${fmt(p.importe)}, ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}, ${etiqueta(dias).toLowerCase()}`}>
              <div className="w-12 shrink-0 rounded-2xl py-1.5 text-center" style={{ background: `color-mix(in srgb, ${color} ${pasado ? 8 : 14}%, transparent)`, color }}>
                <p className="text-lg font-extrabold leading-none tabular-nums">{d.getDate()}</p>
                <p className="text-[10px] font-semibold uppercase mt-0.5">{DIAS[d.getDay()]}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${pasado ? 'line-through decoration-1' : ''}`} style={{ color: pasado ? 'var(--text-muted)' : 'var(--text-primary)' }}>{p.concepto}</p>
                <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {p.origen === 'recurrente' ? <RepeatIcon className="w-3.5 h-3.5" /> : <ReceiptIcon className="w-3.5 h-3.5" />}
                  {p.origen === 'recurrente' ? 'Recurrente' : 'Presupuesto'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono font-bold tabular-nums" style={{ color: pasado ? 'var(--text-muted)' : 'var(--text-primary)' }}>{fmt(p.importe)}</p>
                <p className="text-xs font-semibold" style={{ color }}>{etiqueta(dias)}</p>
              </div>
              <ChevronRightIcon className="w-4 h-4 shrink-0 hidden sm:block" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

interface Props {
  scope: Scope;
  pagos: ProximoPago[];
  hoy: string;
}

export default function AvisosClient({ scope, pagos, hoy }: Props) {
  const accent = scope === 'hogar' ? 'var(--accent-hogar)' : 'var(--accent-personal)';
  const proximos = pagos.filter(p => p.fecha >= hoy);
  const siguiente = proximos[0];
  const mesActual = hoy.slice(0, 7);
  const pendienteMes = proximos.filter(p => p.fecha.startsWith(mesActual)).reduce((s, p) => s + p.importe, 0);
  const totalMesSiguiente = pagos.filter(p => p.fecha.slice(0, 7) > mesActual).reduce((s, p) => s + p.importe, 0);

  const grupos = new Map<string, ProximoPago[]>();
  for (const p of pagos) {
    const k = p.fecha.slice(0, 7);
    grupos.set(k, [...(grupos.get(k) ?? []), p]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}>
          <BellIcon className="w-[22px] h-[22px]" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Avisos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {scope === 'hogar' ? 'Próximos pagos de la casa' : 'Tus próximos pagos'}
          </p>
        </div>
        <InfoExpand title="¿Qué son los Avisos?">
          <p>
            Aquí ves los pagos de este mes y del siguiente: los gastos del Presupuesto que tienen día de cobro y los
            Recurrentes con fecha de cobro. Los próximos aparecen en color y los que ya han pasado, en gris. Activa las
            notificaciones para recibir un aviso en este dispositivo la víspera y el mismo día de cada pago.
          </p>
        </InfoExpand>
      </div>

      <NotificacionesCard scope={scope} accent={accent} />

      {pagos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-3xl p-5 text-white shadow-lg sm:col-span-1" style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 70%, black))` }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/75">Próximo pago</p>
            {siguiente ? (
              <>
                <p className="text-xl font-extrabold mt-1 truncate">{siguiente.concepto}</p>
                <p className="text-sm text-white/85 mt-0.5 tabular-nums">
                  {etiqueta(diasEntre(hoy, siguiente.fecha))} · {fmt(siguiente.importe)}
                </p>
              </>
            ) : (
              <p className="text-base font-bold mt-1">Nada pendiente</p>
            )}
          </div>
          <div className="glass-card rounded-3xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Pendiente este mes</p>
            <p className="text-2xl font-extrabold mt-1 tabular-nums" style={{ color: 'var(--text-primary)' }}>{fmt(pendienteMes)}</p>
          </div>
          <div className="glass-card rounded-3xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Mes siguiente</p>
            <p className="text-2xl font-extrabold mt-1 tabular-nums" style={{ color: 'var(--text-primary)' }}>{fmt(totalMesSiguiente)}</p>
          </div>
        </div>
      )}

      {pagos.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center">
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No hay pagos con fecha</p>
          <p className="text-sm mt-1 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Añade un día de cobro a los gastos del{' '}
            <Link href={`/${scope}/presupuesto`} className="font-semibold underline" style={{ color: accent }}>Presupuesto</Link>
            {' '}o una fecha de cobro a tus{' '}
            <Link href={`/${scope}/modulos/recurrentes`} className="font-semibold underline" style={{ color: accent }}>Recurrentes</Link>
            {' '}para verlos aquí.
          </p>
        </div>
      ) : (
        [...grupos.entries()].map(([mes, lista]) => {
          const [y, m] = mes.split('-').map(Number);
          const total = lista.reduce((s, p) => s + p.importe, 0);
          const titulo = <h2 id={`mes-${mes}`} className="font-bold" style={{ color: 'var(--text-primary)' }}>{MESES[m - 1]} {y}</h2>;
          const resumen = <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-secondary)' }}>{lista.length} pago{lista.length !== 1 ? 's' : ''} · {fmt(total)}</span>;

          if (mes === mesActual) {
            const pendientes = lista.filter(p => p.fecha >= hoy);
            const pasados = lista.filter(p => p.fecha < hoy).reverse();
            return (
              <section key={mes} className="glass-card rounded-3xl overflow-hidden" aria-labelledby={`mes-${mes}`}>
                <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--divider)', background: 'var(--bg-page)' }}>
                  {titulo}
                  {resumen}
                </div>
                {pendientes.length > 0 && <ListaPagos pagos={pendientes} hoy={hoy} accent={accent} />}
                {pasados.length > 0 && (
                  <>
                    <p className="px-5 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)', background: 'var(--bg-page)', borderTop: pendientes.length ? '1px solid var(--divider)' : undefined, borderBottom: '1px solid var(--divider)' }}>
                      Ya pasados
                    </p>
                    <ListaPagos pagos={pasados} hoy={hoy} accent={accent} />
                  </>
                )}
              </section>
            );
          }

          return (
            <details key={mes} className="glass-card rounded-3xl overflow-hidden group">
              <summary className="flex items-center justify-between gap-3 px-5 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden min-h-[52px] focus-visible:outline-2 focus-visible:-outline-offset-2"
                style={{ background: 'var(--bg-page)', outlineColor: accent }}>
                <span className="flex items-center gap-2">
                  <ChevronRightIcon className="w-4 h-4 shrink-0 transition-transform group-open:rotate-90" />
                  {titulo}
                </span>
                {resumen}
              </summary>
              <div style={{ borderTop: '1px solid var(--divider)' }}>
                <ListaPagos pagos={lista} hoy={hoy} accent={accent} />
              </div>
            </details>
          );
        })
      )}
    </div>
  );
}

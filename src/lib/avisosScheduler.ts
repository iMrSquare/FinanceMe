import { getProximosPagos, toISODate, type AvisoScope, type ProximoPago } from './avisos';
import { getPushSubscriptionsForScope, isPushEnviado, markPushEnviado, prunePushEnviados, type PushSubscriptionRow } from './db';
import { sendPush } from './push';

const INTERVALO_MS = 15 * 60 * 1000;
const HORA_ENVIO = Math.min(23, Math.max(0, Number(process.env.AVISOS_HORA ?? 9) || 0));

const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

type Cuando = 'hoy' | 'manana';

function construirPayload(scope: AvisoScope, cuando: Cuando, pagos: ProximoPago[]) {
  const ambito = scope === 'hogar' ? 'Hogar' : 'Personal';
  const title = `${cuando === 'hoy' ? 'Hoy' : 'Mañana'} se cobra · ${ambito}`;
  const total = pagos.reduce((s, p) => s + p.importe, 0);
  const body = pagos.length === 1
    ? `${pagos[0].concepto} · ${fmt(pagos[0].importe)}`
    : `${pagos.length} pagos · ${fmt(total)}: ${pagos.map(p => p.concepto).join(', ')}`;
  return { title, body, url: `/${scope}/avisos`, tag: `${scope}-${cuando}-${pagos[0].fecha}` };
}

async function notificar(scope: AvisoScope, sub: PushSubscriptionRow, pagos: ProximoPago[], hoyISO: string) {
  for (const cuando of ['hoy', 'manana'] as const) {
    const delDia = pagos.filter(p => (p.fecha === hoyISO) === (cuando === 'hoy'));
    const pendientes = delDia.filter(p => !isPushEnviado(`${sub.id}:${scope}:${p.clave}:${cuando}`));
    if (!pendientes.length) continue;
    const ok = await sendPush(sub, construirPayload(scope, cuando, pendientes));
    if (ok) pendientes.forEach(p => markPushEnviado(`${sub.id}:${scope}:${p.clave}:${cuando}`));
  }
}

export async function revisarAvisos(now = new Date()) {
  if (now.getHours() < HORA_ENVIO) return;
  const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
  const hoyISO = toISODate(hoy);

  const subsHogar = getPushSubscriptionsForScope('hogar');
  if (subsHogar.length) {
    const pagos = getProximosPagos('hogar', undefined, hoy, manana);
    if (pagos.length) for (const sub of subsHogar) await notificar('hogar', sub, pagos, hoyISO);
  }

  const pagosPorUsuario = new Map<number, ProximoPago[]>();
  for (const sub of getPushSubscriptionsForScope('personal')) {
    if (!pagosPorUsuario.has(sub.user_id)) pagosPorUsuario.set(sub.user_id, getProximosPagos('personal', sub.user_id, hoy, manana));
    const pagos = pagosPorUsuario.get(sub.user_id)!;
    if (pagos.length) await notificar('personal', sub, pagos, hoyISO);
  }
}

const globalForScheduler = globalThis as unknown as { __avisosScheduler?: NodeJS.Timeout };

export function startAvisosScheduler() {
  // En desarrollo el módulo se recarga: evita planificadores duplicados
  if (globalForScheduler.__avisosScheduler) return;
  const tick = () => {
    revisarAvisos().catch(err => console.error('[avisos] error revisando avisos', err));
  };
  prunePushEnviados();
  tick();
  globalForScheduler.__avisosScheduler = setInterval(tick, INTERVALO_MS);
}

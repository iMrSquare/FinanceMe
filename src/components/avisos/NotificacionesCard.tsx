'use client';

import { useEffect, useState } from 'react';
import { BellIcon, BellOffIcon } from '@/components/icons';
import Button from '@/components/ui/Button';
import { ensureSubscription, getSubscription, isIOS, isStandalone, pushSupported, registerServiceWorker } from '@/lib/pushClient';

type Scope = 'hogar' | 'personal';
type Estado = 'cargando' | 'insecure' | 'ios-install' | 'unsupported' | 'denied' | 'ready';

async function detectar(scope: Scope): Promise<{ estado: Estado; activo: boolean }> {
  if (!window.isSecureContext) return { estado: 'insecure', activo: false };
  if (isIOS() && !isStandalone()) return { estado: 'ios-install', activo: false };
  if (!pushSupported()) return { estado: 'unsupported', activo: false };
  if (Notification.permission === 'denied') return { estado: 'denied', activo: false };
  await registerServiceWorker();
  const sub = await getSubscription();
  if (!sub || Notification.permission !== 'granted') return { estado: 'ready', activo: false };
  const res = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`);
  const data = res.ok ? await res.json() : {};
  return { estado: 'ready', activo: Boolean(data[scope]) };
}

const MENSAJES: Record<Exclude<Estado, 'cargando' | 'ready'>, { titulo: string; texto: string }> = {
  insecure: {
    titulo: 'Requiere HTTPS',
    texto: 'El navegador solo permite notificaciones cuando FinanceMe se abre por HTTPS (o desde localhost). Configura un proxy inverso con HTTPS para activarlas en este dispositivo.',
  },
  'ios-install': {
    titulo: 'Instala FinanceMe en tu pantalla de inicio',
    texto: 'En iPhone y iPad (iOS 16.4 o superior) las notificaciones solo funcionan con la app instalada: pulsa Compartir y después «Añadir a pantalla de inicio». Luego abre FinanceMe desde el icono y vuelve aquí.',
  },
  unsupported: {
    titulo: 'No compatible',
    texto: 'Este navegador no admite notificaciones push. Prueba con una versión reciente de Chrome, Edge, Firefox o Safari.',
  },
  denied: {
    titulo: 'Permiso bloqueado',
    texto: 'Has bloqueado las notificaciones para FinanceMe. Actívalas desde los ajustes del sitio en tu navegador (icono del candado junto a la dirección) y recarga la página.',
  },
};

export default function NotificacionesCard({ scope, accent }: { scope: Scope; accent: string }) {
  const [estado, setEstado] = useState<Estado>('cargando');
  const [activo, setActivo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    let cancelado = false;
    detectar(scope)
      .then(r => { if (!cancelado) { setEstado(r.estado); setActivo(r.activo); } })
      .catch(() => { if (!cancelado) setEstado('unsupported'); });
    return () => { cancelado = true; };
  }, [scope]);

  async function activar() {
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') {
      if (permiso === 'denied') setEstado('denied');
      return;
    }
    const sub = await ensureSubscription();
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, enabled: true, subscription: sub.toJSON() }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'No se pudo activar');
    setActivo(true);
    setMensaje({ tipo: 'ok', texto: 'Notificaciones activadas. Te avisaremos la víspera y el mismo día de cada pago.' });
  }

  async function desactivar() {
    const sub = await getSubscription();
    if (sub) {
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, enabled: false, subscription: sub.toJSON() }),
      });
      const next = res.ok ? await res.json() : null;
      if (next && !next.hogar && !next.personal) await sub.unsubscribe();
    }
    setActivo(false);
    setMensaje(null);
  }

  async function toggle() {
    setOcupado(true);
    setMensaje(null);
    try {
      if (activo) await desactivar(); else await activar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'Algo salió mal' });
    } finally {
      setOcupado(false);
    }
  }

  async function probar() {
    setOcupado(true);
    setMensaje(null);
    try {
      const sub = await getSubscription();
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, endpoint: sub?.endpoint }),
      });
      const data = await res.json().catch(() => ({}));
      setMensaje(res.ok ? { tipo: 'ok', texto: 'Notificación de prueba enviada.' } : { tipo: 'error', texto: data.error ?? 'No se pudo enviar' });
    } finally {
      setOcupado(false);
    }
  }

  const bloqueado = estado !== 'ready';
  const aviso = estado !== 'cargando' && estado !== 'ready' ? MENSAJES[estado] : null;

  return (
    <section className="fm-card p-5" aria-labelledby="notif-title">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: activo ? `color-mix(in srgb, ${accent} 14%, transparent)` : 'var(--btn-hover)', color: activo ? accent : 'var(--text-muted)' }}>
          {activo ? <BellIcon className="w-5 h-5" /> : <BellOffIcon className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 id="notif-title" className="font-semibold" style={{ color: 'var(--text-primary)' }}>Notificaciones en este dispositivo</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {estado === 'cargando' ? 'Comprobando…' : activo ? 'Activadas: aviso la víspera y el mismo día' : 'Desactivadas'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={activo}
          aria-labelledby="notif-title"
          disabled={bloqueado || ocupado}
          onClick={toggle}
          className="relative w-12 h-7 rounded-full transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: activo ? accent : 'var(--divider)', outlineColor: accent }}
        >
          <span className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: activo ? '24px' : '4px' }} />
        </button>
      </div>

      {aviso && (
        <div className="mt-4 rounded-[var(--radius-control)] p-3 text-sm" role="note" style={{ background: 'rgba(var(--color-warning-rgb),0.1)', border: '1px solid rgba(var(--color-warning-rgb),0.25)' }}>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{aviso.titulo}</p>
          <p className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>{aviso.texto}</p>
        </div>
      )}

      {activo && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={probar} disabled={ocupado}>Enviar prueba</Button>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Actívalo en cada dispositivo donde quieras recibir los avisos.</p>
        </div>
      )}

      <p aria-live="polite" className="text-sm mt-3 empty:hidden" style={{ color: mensaje?.tipo === 'error' ? 'var(--color-error)' : 'var(--color-success)' }}>
        {mensaje?.texto}
      </p>
    </section>
  );
}

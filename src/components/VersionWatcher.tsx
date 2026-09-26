'use client';
import { useEffect, useState } from 'react';
import { APP_VERSION } from '@/lib/constants';

const MIN_ENTRE_COMPROBACIONES = 60_000;

/**
 * Detecta que el servidor ya se actualizó mientras esta pestaña (o la app instalada)
 * sigue con la versión anterior, y propone recargar.
 */
export default function VersionWatcher() {
  const [nueva, setNueva] = useState<string | null>(null);

  useEffect(() => {
    let ultima = 0;
    let cancelado = false;
    async function comprobar() {
      if (document.visibilityState !== 'visible' || Date.now() - ultima < MIN_ENTRE_COMPROBACIONES) return;
      ultima = Date.now();
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const { version } = await res.json() as { version?: string };
        if (!cancelado && version && version !== APP_VERSION) setNueva(version);
      } catch { /* sin conexión: se reintenta en la próxima vuelta */ }
    }
    comprobar();
    const intervalo = setInterval(comprobar, 30 * 60_000);
    document.addEventListener('visibilitychange', comprobar);
    window.addEventListener('focus', comprobar);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', comprobar);
      window.removeEventListener('focus', comprobar);
    };
  }, []);

  if (!nueva) return null;
  return (
    <div role="status" className="fm-toast !pr-2 !py-2 w-[calc(100vw-32px)] sm:w-auto">
      <span className="flex-1">FinanceMe se ha actualizado a {nueva}.</span>
      <button type="button" onClick={() => window.location.reload()}
        className="shrink-0 min-h-9 px-3 rounded-[8px] text-sm font-semibold cursor-pointer bg-accent-mode text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-mode)]">
        Recargar
      </button>
    </div>
  );
}

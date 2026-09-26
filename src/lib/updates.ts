import { APP_VERSION } from './constants';
import { getAppSetting, setAppSetting } from './db';

// Comprobación de nuevas versiones publicadas en GitHub Releases.
// Solo lee la API pública de GitHub; se desactiva con UPDATE_CHECK=false.

const REPO = 'iMrSquare/FinanceMe';
const CLAVE = 'update_check';
export const INTERVALO_COMPROBACION_MS = 12 * 60 * 60 * 1000;

interface CacheComprobacion {
  checkedAt: string;
  latest: string | null;
  url: string | null;
  notes: string | null;
  publishedAt: string | null;
  error: string | null;
}

export interface UpdateInfo {
  enabled: boolean;
  current: string;
  latest: string | null;
  available: boolean;
  url: string | null;
  notes: string | null;
  publishedAt: string | null;
  checkedAt: string | null;
  error: string | null;
}

export const updateCheckEnabled = () => process.env.UPDATE_CHECK !== 'false';

/** Compara «v1.2.0» con «v1.10.0»; positivo si a es más reciente */
export function compararVersiones(a: string, b: string): number {
  const partes = (v: string) => v.replace(/^v/i, '').split(/[.-]/).slice(0, 3).map(n => parseInt(n, 10) || 0);
  const [x, y] = [partes(a), partes(b)];
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
}

function leerCache(): CacheComprobacion | null {
  try { return JSON.parse(getAppSetting(CLAVE) ?? 'null'); } catch { return null; }
}

/** Consulta la última release y guarda el resultado; nunca lanza */
export async function comprobarActualizaciones(): Promise<UpdateInfo> {
  if (!updateCheckEnabled()) return getUpdateInfo();
  const anterior = leerCache();
  let cache: CacheComprobacion;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': `FinanceMe/${APP_VERSION}` },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(res.status === 404 ? 'No hay versiones publicadas' : `GitHub respondió ${res.status}`);
    const r = await res.json() as { tag_name?: string; html_url?: string; body?: string; published_at?: string };
    cache = {
      checkedAt: new Date().toISOString(),
      latest: r.tag_name ?? null,
      url: r.html_url ?? null,
      notes: r.body ? r.body.slice(0, 4000) : null,
      publishedAt: r.published_at ?? null,
      error: null,
    };
  } catch (e) {
    // Sin conexión o límite de GitHub: se conserva lo último conocido
    cache = {
      ...(anterior ?? { latest: null, url: null, notes: null, publishedAt: null }),
      checkedAt: new Date().toISOString(),
      error: e instanceof Error && e.name !== 'TimeoutError' ? e.message : 'No se pudo conectar con GitHub',
    };
  }
  setAppSetting(CLAVE, JSON.stringify(cache));
  return getUpdateInfo();
}

/** Estado conocido (sin salir a internet) */
export function getUpdateInfo(): UpdateInfo {
  const enabled = updateCheckEnabled();
  const c = leerCache();
  const latest = c?.latest ?? null;
  return {
    enabled,
    current: APP_VERSION,
    latest,
    available: enabled && !!latest && compararVersiones(latest, APP_VERSION) > 0,
    url: c?.url ?? null,
    notes: c?.notes ?? null,
    publishedAt: c?.publishedAt ?? null,
    checkedAt: c?.checkedAt ?? null,
    error: c?.error ?? null,
  };
}

/** Al arrancar y cada 12 horas */
export function startUpdateChecker() {
  if (!updateCheckEnabled()) return;
  const g = globalThis as typeof globalThis & { __fmUpdateTimer?: ReturnType<typeof setInterval> };
  if (g.__fmUpdateTimer) return;
  const quizas = () => {
    const c = leerCache();
    if (!c || Date.now() - new Date(c.checkedAt).getTime() > INTERVALO_COMPROBACION_MS - 60_000) void comprobarActualizaciones();
  };
  setTimeout(quizas, 10_000);
  g.__fmUpdateTimer = setInterval(quizas, 60 * 60 * 1000);
}

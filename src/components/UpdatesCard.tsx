'use client';
import { useState } from 'react';
import type { UpdateInfo } from '@/lib/updates';
import Button from './ui/Button';
import SettingsCard from './ui/SettingsCard';
import { useToast } from './ui/Feedback';

const COMANDOS = 'docker compose pull\ndocker compose up -d';

const fecha = (iso: string | null) => iso
  ? new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : null;

/** Notas de la release (Markdown de GitHub) con formato básico: títulos, listas y enlaces como texto */
function Notas({ texto }: { texto: string }) {
  const limpia = (l: string) => l.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[(.+?)\]\((.+?)\)/g, '$1').replace(/`/g, '');
  return (
    <div className="space-y-1">
      {texto.split('\n').map(l => l.trimEnd()).filter(Boolean).map((l, i) => {
        if (/^#{1,6}\s/.test(l)) return <p key={i} className="font-semibold pt-1.5 first:pt-0" style={{ color: 'var(--text-primary)' }}>{limpia(l.replace(/^#+\s*/, ''))}</p>;
        if (/^\s*[-*]\s/.test(l)) return <p key={i} className="flex gap-2"><span aria-hidden="true">•</span><span>{limpia(l.replace(/^\s*[-*]\s/, ''))}</span></p>;
        return <p key={i}>{limpia(l)}</p>;
      })}
    </div>
  );
}

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/>
  </svg>
);

/** Configuración › Actualizaciones: versión instalada y última publicada en GitHub */
export default function UpdatesCard({ initial }: { initial: UpdateInfo }) {
  const toast = useToast();
  const [info, setInfo] = useState(initial);
  const [comprobando, setComprobando] = useState(false);

  async function comprobar() {
    setComprobando(true);
    const res = await fetch('/api/updates', { method: 'POST' }).catch(() => null);
    setComprobando(false);
    if (!res?.ok) { toast('No se pudo comprobar', 'error'); return; }
    const next = await res.json() as UpdateInfo;
    setInfo(next);
    if (!next.error) toast(next.available ? `${next.latest} disponible` : 'FinanceMe está al día');
  }

  async function copiar() {
    try { await navigator.clipboard.writeText(COMANDOS); toast('Comandos copiados'); } catch { toast('No se pudo copiar', 'error'); }
  }

  const estado = !info.enabled
    ? { texto: 'Comprobación desactivada (UPDATE_CHECK=false)', color: 'var(--text-muted)' }
    : info.available
      ? { texto: `Nueva versión disponible: ${info.latest}`, color: 'var(--accent-mode)' }
      : info.latest
        ? { texto: 'Está al día', color: 'var(--money-in)' }
        : { texto: info.checkedAt ? 'Aún no hay versiones publicadas' : 'Aún no se ha comprobado', color: 'var(--text-muted)' };

  return (
    <div id="actualizaciones" className="scroll-mt-24">
      <SettingsCard title="Actualizaciones" icon={<RefreshIcon />}
        description="FinanceMe comprueba cada 12 horas si hay una versión nueva publicada en GitHub."
        actions={info.enabled ? <Button size="sm" onClick={comprobar} disabled={comprobando}>{comprobando ? 'Comprobando…' : 'Comprobar ahora'}</Button> : undefined}>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-[var(--radius-control)] border p-3" style={{ borderColor: 'var(--btn-border)' }}>
            <dt className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Instalada</dt>
            <dd className="font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{info.current}</dd>
          </div>
          <div className="rounded-[var(--radius-control)] border p-3" style={{ borderColor: info.available ? 'var(--accent-mode)' : 'var(--btn-border)' }}>
            <dt className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Última publicada</dt>
            <dd className="font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{info.latest ?? '—'}</dd>
          </div>
        </dl>

        <p className="text-sm font-medium mt-3" style={{ color: estado.color }} aria-live="polite">{estado.texto}</p>
        {info.enabled && (
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {info.checkedAt ? `Última comprobación: ${fecha(info.checkedAt)}` : 'La primera comprobación se hace poco después de arrancar.'}
            {info.error && <span className="text-money-out"> · {info.error}</span>}
          </p>
        )}

        {info.available && (
          <div className="mt-4 space-y-4">
            {info.notes && (
              <details className="rounded-[var(--radius-control)] border" style={{ borderColor: 'var(--btn-border)' }}>
                <summary className="px-3 py-2.5 text-sm font-medium cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                  Qué trae {info.latest}{info.publishedAt ? ` · publicada el ${new Date(info.publishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}` : ''}
                </summary>
                <div className="px-3 pb-3 text-[13px] max-h-64 overflow-y-auto" style={{ color: 'var(--text-secondary)' }}><Notas texto={info.notes} /></div>
              </details>
            )}
            <div>
              <p className="fm-label">Cómo actualizar</p>
              <p className="text-[13px] mb-2" style={{ color: 'var(--text-muted)' }}>
                En el servidor, en la carpeta de tu <code>docker-compose.yml</code>. Tus datos se conservan; haz antes una copia de seguridad si quieres ir sobre seguro.
              </p>
              <div className="flex items-start gap-2">
                <pre className="flex-1 min-w-0 overflow-x-auto rounded-[var(--radius-control)] px-3 py-2.5 text-[13px]" style={{ background: 'var(--bg-page)', border: '1px solid var(--btn-border)', color: 'var(--text-primary)' }}>{COMANDOS}</pre>
                <Button size="sm" onClick={copiar}>Copiar</Button>
              </div>
            </div>
            {info.url && (
              <a href={info.url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-medium underline" style={{ color: 'var(--accent-mode)' }}>
                Ver {info.latest} en GitHub
              </a>
            )}
          </div>
        )}
      </SettingsCard>
    </div>
  );
}

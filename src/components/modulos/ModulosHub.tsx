import Link from 'next/link';
import { ChevronRightIcon, ModulesIcon } from '@/components/icons';

export interface Modulo {
  href: string;
  titulo: string;
  descripcion: string;
  dato?: string;
  icon: React.ReactNode;
  color: string;
}

export default function ModulosHub({ modulos, accent, subtitulo }: { modulos: Modulo[]; accent: string; subtitulo: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}>
          <ModulesIcon className="w-[22px] h-[22px]" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Módulos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitulo}</p>
        </div>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modulos.map(m => (
          <li key={m.href}>
            <Link
              href={m.href}
              className="glass-card rounded-3xl p-5 flex flex-col gap-4 h-full transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 group"
              style={{ outlineColor: m.color }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${m.color} 14%, transparent)`, color: m.color }}>
                  {m.icon}
                </div>
                <ChevronRightIcon className="w-5 h-5 mt-1 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{m.titulo}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{m.descripcion}</p>
              </div>
              {m.dato && (
                <p className="text-sm font-semibold tabular-nums pt-3" style={{ color: m.color, borderTop: '1px solid var(--divider)' }}>{m.dato}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BackToModulos({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl border transition-colors min-h-[44px]" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'var(--bg-card)' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
      Volver a Módulos
    </Link>
  );
}

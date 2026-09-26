import Link from 'next/link';
import { ChevronRightIcon } from '@/components/icons';
import PageHeader from '@/components/ui/PageHeader';

export interface Modulo {
  href: string;
  titulo: string;
  descripcion: string;
  dato?: string;
  icon: React.ReactNode;
  color: string;
}

export default function ModulosHub({ modulos, subtitulo }: { modulos: Modulo[]; accent?: string; subtitulo: string }) {
  return (
    <div>
      <PageHeader title="Módulos" subtitle={subtitulo} />
      <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {modulos.map(m => (
          <li key={m.href} className="min-w-0">
            <Link href={m.href}
              className="fm-card group flex flex-col gap-3 sm:gap-4 h-full p-3.5 sm:p-5 transition-colors hover:border-[var(--accent-mode)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-mode)]">
              <div className="flex items-start justify-between gap-3">
                <span className="fm-caticon sm:!w-11 sm:!h-11" style={{ ['--fm-c' as string]: m.color }} aria-hidden="true">{m.icon}</span>
                <ChevronRightIcon className="hidden sm:block w-5 h-5 mt-1 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{m.titulo}</h2>
                <p className="text-[13px] sm:text-sm mt-1 line-clamp-2 sm:line-clamp-none" style={{ color: 'var(--text-secondary)' }}>{m.descripcion}</p>
              </div>
              {m.dato && (
                <p className="text-[13px] sm:text-sm font-medium pt-2.5 sm:pt-3" style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--divider)' }}>{m.dato}</p>
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
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-medium min-h-11 hover:underline" style={{ color: 'var(--text-secondary)' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
      Volver a Módulos
    </Link>
  );
}

import type { ReactNode } from 'react';
import Link from 'next/link';

export type Tone = 'in' | 'out' | 'saving' | 'neutral';
export const TONE_CLASS: Record<Tone, string> = { in: 'text-money-in', out: 'text-money-out', saving: 'text-saving', neutral: '' };

interface Stat { label: string; value: ReactNode; tone?: Tone; sub?: ReactNode; href?: string }

interface Props {
  label: string;
  value: ReactNode;
  tone?: Tone;
  note?: ReactNode;
  stats?: Stat[];
  ariaLabel?: string;
  /** Hace navegable la cifra principal (p. ej. el Resumen lleva al Mes) */
  href?: string;
}

const Flecha = () => (
  <svg className="fm-summary-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/** Cifra protagonista del periodo con cifras secundarias al lado (debajo en móvil) */
export default function Summary({ label, value, tone = 'neutral', note, stats = [], ariaLabel, href }: Props) {
  const principal = (
    <>
      <p className="fm-label-sm">{label}</p>
      <p className={`fm-big ${TONE_CLASS[tone]}`} style={tone === 'neutral' ? { color: 'var(--text-primary)' } : undefined}>{value}</p>
      {note && <p className="fm-note">{note}</p>}
      {href && <Flecha />}
    </>
  );
  return (
    <section className="fm-card fm-summary mb-7" aria-label={ariaLabel ?? label} style={{ ['--fm-stats' as string]: stats.length || 1 }}>
      {href
        ? <Link href={href} className="fm-summary-main fm-summary-link">{principal}</Link>
        : <div className="fm-summary-main">{principal}</div>}
      {stats.length > 0 && (
        <div className="fm-summary-stats" data-n={stats.length}>
          {stats.map(s => {
            const contenido = (
              <>
                <p className="fm-label-sm">{s.label}</p>
                <p className={`fm-stat-value ${TONE_CLASS[s.tone ?? 'neutral']}`} style={!s.tone || s.tone === 'neutral' ? { color: 'var(--text-primary)' } : undefined}>{s.value}</p>
                {s.sub && <p className="fm-stat-sub">{s.sub}</p>}
                {s.href && <Flecha />}
              </>
            );
            return s.href
              ? <Link key={s.label} href={s.href} className="fm-stat fm-summary-link">{contenido}</Link>
              : <div key={s.label} className="fm-stat">{contenido}</div>;
          })}
        </div>
      )}
    </section>
  );
}

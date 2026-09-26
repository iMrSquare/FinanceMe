import type { ReactNode } from 'react';
import { TONE_CLASS, type Tone } from './Summary';

const TONE_VAR: Record<Tone | 'accent', string> = {
  in: 'var(--money-in)', out: 'var(--money-out)', saving: 'var(--saving)', neutral: 'var(--text-muted)', accent: 'var(--accent-mode)',
};

interface Props {
  title: ReactNode;
  count?: number;
  total?: ReactNode;
  tone?: Tone | 'accent';
  /** Color propio de la barra (p. ej. Luz o Agua); tiene prioridad sobre `tone` */
  color?: string;
  /** Colorea también el total con el tono */
  toneTotal?: boolean;
  actions?: ReactNode;
  id: string;
  className?: string;
  children: ReactNode;
}

export default function Section({ title, count, total, tone = 'accent', color, toneTotal, actions, id, className = '', children }: Props) {
  return (
    <section className={`fm-card fm-section mb-7 ${className}`} aria-labelledby={id}>
      <div className="fm-section-head" style={{ ['--fm-tone' as string]: color ?? TONE_VAR[tone] }}>
        <h2 id={id} className="fm-section-title">
          {title}
          {count !== undefined && <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>{count}</span>}
        </h2>
        <div className="flex items-center gap-3 min-w-0">
          {total !== undefined && (
            <span className={`font-semibold whitespace-nowrap ${toneTotal && tone !== 'accent' ? TONE_CLASS[tone] : ''}`} style={toneTotal && tone !== 'accent' ? undefined : { color: 'var(--text-primary)' }}>{total}</span>
          )}
          {actions}
        </div>
      </div>
      {children}
    </section>
  );
}

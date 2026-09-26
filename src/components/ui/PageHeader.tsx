import type { ReactNode } from 'react';

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Ayuda desplegable (InfoExpand) junto al título */
  info?: ReactNode;
  actions?: ReactNode;
  /** En móvil, las acciones pasan a una fila propia bajo el título */
  stackOnMobile?: boolean;
}

export default function PageHeader({ title, subtitle, info, actions, stackOnMobile }: Props) {
  return (
    <div className={`flex justify-between gap-3 mb-6 ${stackOnMobile ? 'flex-col sm:flex-row sm:items-end' : 'items-end'}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-[28px] leading-tight font-semibold tracking-[-0.015em] truncate" style={{ color: 'var(--text-primary)' }}>{title}</h1>
          {info}
        </div>
        {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {actions && <div className={`flex items-center gap-2 shrink-0 ${stackOnMobile ? 'max-sm:[&>select]:flex-1 max-sm:[&>select]:max-w-none' : ''}`}>{actions}</div>}
    </div>
  );
}

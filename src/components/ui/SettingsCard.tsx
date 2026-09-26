import type { ReactNode } from 'react';

/** Tarjeta de ajustes: título, descripción breve y contenido */
export default function SettingsCard({ title, description, icon, actions, children, className = '' }: {
  title: ReactNode; description?: ReactNode; icon?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string;
}) {
  return (
    <section className={`fm-card p-5 sm:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {icon && <span className="fm-caticon" style={{ ['--fm-c' as string]: 'var(--accent-mode)' }} aria-hidden="true">{icon}</span>}
          <div className="min-w-0">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            {description && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}

/** Mensaje de error de formulario, anunciado por lectores de pantalla */
export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p role="alert" className="text-sm font-medium text-money-out">{children}</p>;
}

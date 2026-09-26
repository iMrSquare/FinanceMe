'use client';

import { useId, type ReactNode } from 'react';

/** Interruptor accesible con etiqueta y descripción opcional */
export default function Switch({ checked, onChange, label, description, tone = 'accent', disabled }: {
  checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; tone?: 'accent' | 'danger'; disabled?: boolean;
}) {
  const id = useId();
  const color = tone === 'danger' ? 'var(--money-out)' : 'var(--accent-mode)';
  return (
    <div className="flex items-start gap-3">
      <button id={id} type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className="relative mt-0.5 w-11 h-6 rounded-full shrink-0 cursor-pointer transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ background: checked ? color : 'var(--btn-border)', outlineColor: color }}>
        <span className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: checked ? 24 : 4 }} />
      </button>
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
        {description && <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</span>}
      </label>
    </div>
  );
}

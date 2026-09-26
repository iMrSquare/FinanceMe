'use client';

import { useMemo, useState } from 'react';
import { buscarIconos } from '@/lib/categoryIcons';

/** Galería de iconos de categoría con buscador; el seleccionado toma `color` */
export default function IconPicker({ value, color, onChange }: { value: string | null; color: string; onChange: (id: string) => void }) {
  const [q, setQ] = useState('');
  const grupos = useMemo(() => buscarIconos(q), [q]);
  return (
    <div>
      <input className="fm-input mb-3" placeholder="Buscar: luz, coche, mascota, seguro…" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar icono" />
      <div className="overflow-y-auto rounded-[var(--radius-control)] border px-2.5 pb-2.5" style={{ maxHeight: 'min(40dvh, 320px)', borderColor: 'var(--btn-border)', ['--fm-c' as string]: color }}>
        {grupos.length === 0 && <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Ningún icono coincide con «{q}».</p>}
        {grupos.map(g => (
          <div key={g.grupo}>
            <p className="sticky top-0 z-[1] pt-2.5 pb-1.5 text-[12.5px] font-semibold" style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}>{g.grupo}</p>
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))' }}>
              {g.iconos.map(ic => {
                const activo = value === ic.id;
                return (
                  <button key={g.grupo + ic.label} type="button" aria-pressed={activo} aria-label={ic.label} title={ic.label}
                    onClick={() => onChange(ic.id)}
                    className={`fm-icon-option h-11 grid place-items-center rounded-[10px] border cursor-pointer transition-colors [&_svg]:w-5 [&_svg]:h-5 ${activo ? '' : 'border-transparent hover:bg-[var(--btn-hover)]'}`}
                    style={activo ? { borderColor: 'var(--fm-c)', color: 'var(--fm-c)', background: 'color-mix(in srgb, var(--fm-c) 12%, transparent)' } : { color: 'var(--text-secondary)' }}>
                    <ic.icon aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

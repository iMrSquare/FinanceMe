/** Selector de opciones excluyentes en forma de pastillas (p. ej. Claro / Oscuro / Sistema) */
export default function Segmented<T extends string>({ options, value, onChange, disabled }: {
  options: { id: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: (v: T) => boolean;
}) {
  return (
    <div className="flex p-1 gap-1 rounded-[var(--radius-control)]" style={{ background: 'var(--btn-hover)' }}>
      {options.map(o => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            disabled={disabled?.(o.id)}
            onClick={() => onChange(o.id)}
            className="flex-1 flex items-center justify-center gap-1.5 min-h-10 rounded-[calc(var(--radius-control)-2px)] text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--accent-mode)]"
            // Activo: tinte y borde del color del modo, para que se distinga en todos los temas
            // (en algunos el fondo de la tarjeta y el del selector son casi iguales)
            style={active
              ? {
                background: 'color-mix(in srgb, var(--accent-mode) 14%, var(--bg-card))',
                color: 'var(--accent-mode)',
                boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--accent-mode) 50%, transparent), 0 1px 2px var(--shadow-card)',
              }
              : { color: 'var(--text-muted)' }}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

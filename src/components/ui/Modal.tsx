'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

interface Props {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Botones al pie (se apilan a lo ancho en móvil) */
  footer?: ReactNode;
  /** Ancho máximo en escritorio, p. ej. '560px' */
  width?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Diálogo centrado en escritorio y hoja inferior en móvil */
export default function Modal({ title, onClose, children, footer, width }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    const el = ref.current;
    // En pantallas táctiles no se enfoca ningún campo: abriría el teclado y taparía el diálogo.
    // El foco va al propio diálogo (sigue atrapado dentro) y el usuario toca el campo que quiera.
    const tactil = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const primero = tactil ? null : el?.querySelector<HTMLElement>('input, select, textarea') ?? el?.querySelector<HTMLElement>(FOCUSABLE);
    (primero ?? el)?.focus({ preventScroll: true });

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current(); return; }
      if (e.key !== 'Tab' || !el) return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(n => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previo?.focus?.(); };
  }, []);

  return (
    <div className="fm-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className="fm-dialog outline-none" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} style={width ? { ['--fm-dialog-w' as string]: width } : undefined}>
        <div className="fm-grabber" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar"
            className="hidden sm:inline-grid place-items-center w-9 h-9 -mt-1 -mr-2 rounded-[var(--radius-control)] text-[var(--text-muted)] hover:bg-[var(--btn-hover)] hover:text-[var(--text-primary)] cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
        {footer && <div className="flex gap-2 mt-5 sm:justify-end [&>*]:flex-1 sm:[&>*]:flex-none">{footer}</div>}
      </div>
    </div>
  );
}

'use client';
import { useState, useRef, useEffect } from 'react';
import { InfoIcon } from './icons';

interface Props {
  title?: string;
  children: React.ReactNode;
}

export default function InfoExpand({ title = '¿Qué es esto?', children }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // Position the popover under the button, clamped to the viewport so it never
  // overflows horizontally on small screens regardless of where the icon sits.
  function place() {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(360, window.innerWidth - margin * 2);
    const left = Math.min(Math.max(rect.left, margin), window.innerWidth - width - margin);
    setPos({ top: rect.bottom + 8, left, width });
  }

  useEffect(() => {
    if (!open) return;
    place();
    function onPointerDown(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onDismiss() { setOpen(false); }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus(); } }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onDismiss);
    // Close on scroll of any container (fixed popover would otherwise detach).
    window.addEventListener('scroll', onDismiss, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onDismiss);
      window.removeEventListener('scroll', onDismiss, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={title}
        title={title}
        aria-expanded={open}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer hover:bg-[var(--btn-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent-mode)]"
        style={{
          color: open ? 'var(--accent-mode)' : 'var(--text-muted)',
          background: open ? 'color-mix(in srgb, var(--accent-mode) 12%, transparent)' : undefined,
        }}
      >
        <InfoIcon className="w-4 h-4" />
      </button>
      {open && pos && (
        <div
          ref={popRef}
          role="note"
          className="fixed z-[120] fm-card p-4 text-sm leading-relaxed"
          style={{ top: pos.top, left: pos.left, width: pos.width, color: 'var(--text-secondary)', boxShadow: '0 12px 32px rgba(10,16,28,.18)' }}
        >
          <p className="font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{title}</p>
          {children}
        </div>
      )}
    </>
  );
}

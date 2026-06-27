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
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('resize', onDismiss);
    // Close on scroll of any container (fixed popover would otherwise detach).
    window.addEventListener('scroll', onDismiss, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
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
        className="w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0"
        style={{
          color: open ? 'var(--sidebar-hover-c)' : 'var(--text-muted)',
          background: open ? 'var(--sidebar-hover-bg)' : 'var(--btn-hover)',
        }}
      >
        <InfoIcon className="w-4 h-4" />
      </button>
      {open && pos && (
        <div
          ref={popRef}
          className="fixed z-[120] glass-card rounded-2xl p-4 text-sm shadow-xl"
          style={{ top: pos.top, left: pos.left, width: pos.width, color: 'var(--text-secondary)' }}
        >
          <p className="font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>{title}</p>
          {children}
        </div>
      )}
    </>
  );
}

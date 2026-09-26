'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

// ── Estado vacío ────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="px-5 py-10 text-center">
      {icon && (
        <div className="w-11 h-11 mx-auto rounded-xl grid place-items-center [&_svg]:w-[22px] [&_svg]:h-[22px]"
          style={{ background: 'color-mix(in srgb, var(--accent-mode) 12%, transparent)', color: 'var(--accent-mode)' }}>{icon}</div>
      )}
      <h3 className="mt-3 mb-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {text && <p className="mx-auto mb-4 max-w-sm text-sm" style={{ color: 'var(--text-muted)' }}>{text}</p>}
      {action}
    </div>
  );
}

// ── Esqueleto de carga ──────────────────────────────────────────────────────
export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Cargando">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5" style={{ borderBottom: '1px solid var(--divider)' }}>
          <span className="fm-skel" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <span className="flex-1">
            <span className="fm-skel" style={{ width: `${56 - i * 6}%`, height: 12, marginBottom: 8 }} />
            <span className="fm-skel" style={{ width: '30%', height: 10 }} />
          </span>
          <span className="fm-skel" style={{ width: 72, height: 14 }} />
        </div>
      ))}
    </div>
  );
}

// ── Avisos breves ───────────────────────────────────────────────────────────
type ToastTone = 'ok' | 'error';
const ToastCtx = createContext<(msg: string, tone?: ToastTone) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; tone: ToastTone; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string, tone: ToastTone = 'ok') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ msg, tone, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div aria-live="polite" role="status" className="contents">
        {toast && (
          <div key={toast.id} className="fm-toast">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
              style={{ color: toast.tone === 'ok' ? 'var(--money-in)' : 'var(--money-out)', filter: 'brightness(1.4)' }}>
              {toast.tone === 'ok' ? <><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></> : <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>}
            </svg>
            {toast.msg}
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

/** `const toast = useToast(); toast('Gasto guardado')` */
export function useToast() {
  return useContext(ToastCtx);
}

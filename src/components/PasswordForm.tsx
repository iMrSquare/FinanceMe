'use client';
import { useState, type FormEvent } from 'react';
import { validatePassword } from '@/lib/validation';
import Button from '@/components/ui/Button';
import { FormError } from '@/components/ui/SettingsCard';

const CHECKS: { test: (p: string) => boolean; label: string }[] = [
  { test: p => p.length >= 8, label: '8 caracteres mínimo' },
  { test: p => /[a-z]/.test(p), label: 'Una minúscula' },
  { test: p => /[A-Z]/.test(p), label: 'Una mayúscula' },
  { test: p => /[0-9]/.test(p), label: 'Un número' },
  { test: p => /[^a-zA-Z0-9]/.test(p), label: 'Un carácter especial' },
];

/** Borde verde/rojo según la validez del campo */
export function borde(estado: 'ok' | 'error' | null) {
  return estado ? { borderColor: estado === 'ok' ? 'var(--money-in)' : 'var(--money-out)' } : undefined;
}

/** Requisitos de la contraseña, marcados en vivo */
export function PasswordChecklist({ id, value }: { id: string; value: string }) {
  return (
    <ul id={id} className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
      {CHECKS.map(c => {
        const ok = c.test(value);
        return (
          <li key={c.label} className="flex items-center gap-1.5 text-[13px]" style={{ color: ok ? 'var(--money-in)' : 'var(--text-muted)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {ok ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="8" />}
            </svg>
            <span>{c.label}<span className="sr-only">{ok ? ': cumplido' : ': pendiente'}</span></span>
          </li>
        );
      })}
    </ul>
  );
}

/** Formulario de cambio de contraseña con requisitos en vivo (Mi perfil y cambio obligatorio) */
export default function PasswordForm({ onSuccess, submitLabel = 'Cambiar contraseña', block }: {
  onSuccess: () => void; submitLabel?: string; block?: boolean;
}) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const nuevaErr = nueva ? validatePassword(nueva) : null;
  const noCoinciden = confirmar !== '' && confirmar !== nueva;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (nuevaErr) { setError(nuevaErr); return; }
    if (nueva !== confirmar) { setError('Las contraseñas no coinciden'); return; }
    setGuardando(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: actual, newPassword: nueva }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'No se pudo cambiar la contraseña'); return; }
      setActual(''); setNueva(''); setConfirmar('');
      onSuccess();
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="pwd-actual" className="fm-label">Contraseña actual</label>
        <input id="pwd-actual" type="password" autoComplete="current-password" required className="fm-input"
          value={actual} onChange={e => setActual(e.target.value)} />
      </div>
      <div>
        <label htmlFor="pwd-nueva" className="fm-label">Nueva contraseña</label>
        <input id="pwd-nueva" type="password" autoComplete="new-password" required className="fm-input" aria-describedby="pwd-reqs"
          value={nueva} onChange={e => setNueva(e.target.value)} style={borde(nueva ? (nuevaErr ? 'error' : 'ok') : null)} />
        <PasswordChecklist id="pwd-reqs" value={nueva} />
      </div>
      <div>
        <label htmlFor="pwd-confirmar" className="fm-label">Confirmar nueva contraseña</label>
        <input id="pwd-confirmar" type="password" autoComplete="new-password" required className="fm-input"
          value={confirmar} onChange={e => setConfirmar(e.target.value)} style={borde(confirmar ? (noCoinciden ? 'error' : 'ok') : null)} />
        {noCoinciden && <p className="text-[13px] mt-1 text-money-out">Las contraseñas no coinciden</p>}
      </div>

      <FormError>{error}</FormError>

      <Button type="submit" variant="primary" className={block ? 'w-full' : ''}
        disabled={guardando || !!nuevaErr || !actual || !nueva || nueva !== confirmar}>
        {guardando ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  );
}

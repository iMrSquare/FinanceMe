'use client';
import { useState, useLayoutEffect, FormEvent } from 'react';
import Image from 'next/image';
import { APP_VERSION } from '@/lib/constants';
import Button from '@/components/ui/Button';

const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
const UserIcon = () => <svg {...svg} className="fm-login-icon"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
const LockIcon = () => <svg {...svg} className="fm-login-icon"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
const EyeIcon = () => <svg {...svg} width="18" height="18"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
const EyeOffIcon = () => <svg {...svg} width="18" height="18"><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.2 3.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /><path d="m2 2 20 20" /></svg>;
const LogInIcon = () => <svg {...svg}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>;
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.21.7.82.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
  </svg>
);

export default function LoginClient() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  useLayoutEffect(() => {
    // Capture whatever the app/server had set on <html> (theme, dark class, custom
    // accents) so it can be restored exactly on unmount — the login screen always
    // renders the default Institucional/light look regardless of the user's real preference.
    const root = document.documentElement;
    const prevTheme = root.getAttribute('data-theme');
    const prevDark = root.classList.contains('dark');
    const prevAccentPersonal = root.style.getPropertyValue('--accent-personal');
    const prevAccentHogar = root.style.getPropertyValue('--accent-hogar');

    root.setAttribute('data-theme', 'institucional');
    root.classList.remove('dark');
    root.style.removeProperty('--accent-personal');
    root.style.removeProperty('--accent-hogar');

    return () => {
      if (prevTheme) root.setAttribute('data-theme', prevTheme); else root.removeAttribute('data-theme');
      root.classList.toggle('dark', prevDark);
      if (prevAccentPersonal) root.style.setProperty('--accent-personal', prevAccentPersonal); else root.style.removeProperty('--accent-personal');
      if (prevAccentHogar) root.style.setProperty('--accent-hogar', prevAccentHogar); else root.style.removeProperty('--accent-hogar');
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      let data: Record<string, unknown> = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }
      if (!res.ok) { setError((data.error as string) ?? 'Error al iniciar sesión'); return; }
      window.location.href = data.mustChangePassword ? '/cambiar-password' : ((data.inicio as string) ?? '/personal');
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="fm-login relative min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 py-10 overflow-hidden">
      {/* Fondo: cuadrícula que se desvanece y halo con los colores del logo */}
      <div className="fm-login-grid" aria-hidden="true" />
      <div className="fm-login-glow" aria-hidden="true" />

      <div className="relative w-full max-w-[400px]">
        <header className="flex flex-col items-center text-center mb-8">
          <Image src="/logo-financeme.png" alt="" width={72} height={72} priority className="w-[72px] h-[72px]" />
          <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.02em] leading-tight" style={{ color: 'var(--text-primary)' }}>FinanceMe</h1>
          <p className="mt-0.5 text-[15px]" style={{ color: 'var(--text-muted)' }}>Control Financiero</p>
        </header>

        <div className="fm-login-card">
          <p className="text-center text-[15px] mb-6" style={{ color: 'var(--text-secondary)' }}>Inicia sesión para gestionar tus finanzas</p>

          <form onSubmit={handleSubmit} action="/api/auth/login" method="post" autoComplete="on" className="space-y-4">
            <div>
              <label htmlFor="username" className="fm-label">Usuario</label>
              <div className="fm-login-field">
                <UserIcon />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Tu nombre de usuario"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase())}
                  required
                  className="fm-input"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="fm-label">Contraseña</label>
              <div className="fm-login-field">
                <LockIcon />
                <input
                  id="password"
                  name="password"
                  type={verPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="fm-input !pr-11"
                />
                <button type="button" onClick={() => setVerPassword(v => !v)} aria-pressed={verPassword}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-[var(--radius-control)] cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--btn-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent-mode)]">
                  {verPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && <p role="alert" className="text-sm font-medium text-money-out">{error}</p>}

            <Button type="submit" variant="primary" disabled={loading} className="fm-login-submit w-full !mt-6" icon={loading ? undefined : <LogInIcon />}>
              {loading ? 'Entrando…' : 'Iniciar sesión'}
            </Button>
          </form>
        </div>

        <footer className="mt-8 flex items-center justify-center gap-3 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          <a href="https://github.com/iMrSquare/FinanceMe" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 min-h-8 hover:text-[var(--text-primary)] hover:underline">
            <GitHubIcon />Ver en GitHub
          </a>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{APP_VERSION}</span>
        </footer>
      </div>
    </main>
  );
}

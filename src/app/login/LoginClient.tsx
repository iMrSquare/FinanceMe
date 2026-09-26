'use client';
import { useState, useLayoutEffect, FormEvent } from 'react';
import Logo from '@/components/Logo';
import Button from '@/components/ui/Button';

export default function LoginClient() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <main className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 py-10" style={{ background: 'var(--bg-page)' }}>
      <div className="w-full max-w-[380px]">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Logo className="w-11 h-11" />
          <h1 className="text-[26px] font-semibold tracking-[-0.015em]" style={{ color: 'var(--text-primary)' }}>FinanceMe</h1>
        </div>

        <div className="fm-card p-6 sm:p-7">
          <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Iniciar sesión</h2>
          <form onSubmit={handleSubmit} action="/api/auth/login" method="post" autoComplete="on" className="space-y-4">
            <div>
              <label htmlFor="username" className="fm-label">Usuario</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase())}
                required
                className="fm-input"
              />
            </div>
            <div>
              <label htmlFor="password" className="fm-label">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="fm-input"
              />
            </div>

            {error && <p role="alert" className="text-sm font-medium text-money-out">{error}</p>}

            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </div>

        <footer className="mt-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          FinanceMe &copy; {new Date().getFullYear()} · imrsquare.com
        </footer>
      </div>
    </main>
  );
}

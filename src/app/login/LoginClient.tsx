'use client';
import { useState, useLayoutEffect, FormEvent } from 'react';

export default function LoginClient() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    // Capture whatever the app/server had set on <html> (theme, dark class, custom
    // accents) so it can be restored exactly on unmount — the login screen always
    // renders the default Índigo/light look regardless of the user's real preference.
    const root = document.documentElement;
    const prevTheme = root.getAttribute('data-theme');
    const prevDark = root.classList.contains('dark');
    const prevAccentPersonal = root.style.getPropertyValue('--accent-personal');
    const prevAccentHogar = root.style.getPropertyValue('--accent-hogar');

    root.setAttribute('data-theme', 'indigo');
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
      window.location.href = data.mustChangePassword ? '/cambiar-password' : '/personal';
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center p-4"
      style={{ background: 'var(--bg-page)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-4 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_FinanceMe.svg" alt="FinanceMe" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>FinanceMe</h1>
          <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>Control Financiero</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8">
          <form onSubmit={handleSubmit} action="/api/auth/login" method="post" autoComplete="on" className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Usuario
              </label>
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
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 border transition-colors"
                style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' }}
                placeholder="Nombre de usuario"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 border transition-colors"
                style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-error font-medium text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-2xl text-sm font-bold text-white transition-all shadow-lg shadow-accent-primary/30 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-dark))' }}
            >
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <footer className="mt-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          FinanceMe &copy; {new Date().getFullYear()} — imrsquare.com
        </footer>
      </div>
    </div>
  );
}

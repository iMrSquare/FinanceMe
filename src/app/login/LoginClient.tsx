'use client';
import { useState, FormEvent } from 'react';
import Image from 'next/image';

export default function LoginClient() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      className="min-h-screen flex flex-col items-center justify-center p-4 gap-0"
      style={{ background: 'var(--bg-page)' }}
    >
      <div className="w-full max-w-sm flex-1 flex flex-col justify-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-4 shadow-xl">
            <Image src="/logo_FinanceMe-Hogar.png" alt="FinanceMe" width={64} height={64} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>FinanceMe</h1>
          <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>Control Financiero</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Usuario
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 border transition-colors"
                style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' }}
                placeholder="Nombre de usuario"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Contraseña
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 border transition-colors"
                style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 font-medium text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-2xl text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
      <footer className="pb-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        FinanceMe &copy; {new Date().getFullYear()} — imrsquare.com
      </footer>
    </div>
  );
}

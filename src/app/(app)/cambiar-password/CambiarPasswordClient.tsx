'use client';
import { useState, FormEvent } from 'react';

export default function CambiarPasswordClient({ forced }: { forced: boolean }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      let data: Record<string, unknown> = {};
      try { data = await res.json(); } catch { /* non-JSON */ }
      if (!res.ok) { setError((data.error as string) ?? 'Error al cambiar contraseña'); return; }
      setSuccess(true);
      setTimeout(() => { window.location.href = '/personal'; }, 1500);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  const successBanner = (
    <div
      className="flex flex-col items-center gap-3 py-6"
      style={{ color: 'var(--text-primary)' }}
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl" style={{ background: 'rgba(16,185,129,0.15)' }}>
        ✓
      </div>
      <p className="text-base font-bold">¡Contraseña cambiada!</p>
      <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
        Accediendo a la aplicación…
      </p>
    </div>
  );

  const form = (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Contraseña actual
        </label>
        <input
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          required
          className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 border transition-colors"
          style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' }}
          placeholder="••••••••"
        />
        {forced && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Contraseña por defecto: <span className="font-mono font-semibold">admin123</span>
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Nueva contraseña
        </label>
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 border transition-colors"
          style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' }}
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Confirmar contraseña
        </label>
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
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
        {loading ? 'Guardando…' : 'Guardar contraseña'}
      </button>
    </form>
  );

  // Forced change: full-screen modal that blocks everything
  if (forced) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 500,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <div className="glass-card rounded-3xl p-8 w-full max-w-md shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(99,102,241,0.15)' }}
            >
              🔐
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Establece tu contraseña
            </h1>
          </div>

          {!success && (
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Por seguridad debes crear una contraseña personal antes de continuar.
            </p>
          )}

          {success ? successBanner : form}
        </div>
      </div>
    );
  }

  // Voluntary change (from profile settings)
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-3xl p-8">
          {!success && (
            <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Cambiar contraseña
            </h1>
          )}
          {success ? successBanner : form}
        </div>
      </div>
    </div>
  );
}

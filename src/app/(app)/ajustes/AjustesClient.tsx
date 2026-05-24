'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PublicUser } from '@/lib/db';
import { validateUsername, validatePassword } from '@/lib/validation';
import { APP_VERSION } from '@/lib/constants';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import Image from 'next/image';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  visor: 'Visor',
};

const ROLE_COLORS: Record<string, string> = {
  admin: '#6366f1',
  editor: '#0ea5e9',
  visor: '#64748b',
};

interface Props {
  users: PublicUser[];
  currentUserId: number;
}

export default function AjustesClient({ users: initialUsers, currentUserId }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState<{ msg: string; fn: () => Promise<void> } | null>(null);

  // Import / Export (Hogar only — Personal lives in Perfil)
  const [ioSeccion] = useState<'hogar'>('hogar');
  const [importing, setImporting] = useState(false);
  const [ioMsg, setIoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<Record<string, unknown> | null>(null);

  async function handleExport() {
    const res = await fetch(`/api/export/${ioSeccion}`);
    if (!res.ok) { setIoMsg({ type: 'err', text: 'Error al exportar' }); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ioSeccion}-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIoMsg({ type: 'ok', text: 'Exportación completada' });
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIoMsg(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (json.type !== ioSeccion) {
        setIoMsg({ type: 'err', text: `El fichero es de tipo "${json.type}", no de "${ioSeccion}"` });
        return;
      }
      setPendingImport(json);
    } catch {
      setIoMsg({ type: 'err', text: 'Error al leer el fichero' });
    }
  }

  async function doImport(json: Record<string, unknown>) {
    setImporting(true);
    setIoMsg(null);
    try {
      const res = await fetch(`/api/import/${ioSeccion}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (!res.ok) { setIoMsg({ type: 'err', text: data.error ?? 'Error al importar' }); return; }
      setIoMsg({ type: 'ok', text: `Importación completada — ${data.importado} registros procesados` });
    } catch {
      setIoMsg({ type: 'err', text: 'Error al importar los datos' });
    } finally {
      setImporting(false);
    }
  }

  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'visor'>('visor');
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');

  const usernameErr = username ? validateUsername(username) : null;
  const passwordErr = password ? validatePassword(password) : null;

  const pwdChecks = [
    { ok: password.length >= 8, label: '8 caracteres mínimo' },
    { ok: /[a-z]/.test(password), label: 'Una minúscula' },
    { ok: /[A-Z]/.test(password), label: 'Una mayúscula' },
    { ok: /[0-9]/.test(password), label: 'Un número' },
    { ok: /[^a-zA-Z0-9]/.test(password), label: 'Un carácter especial' },
  ];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateErr('');
    if (usernameErr || passwordErr) return;
    setCreating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, username, password, role }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateErr(data.error); return; }
      setShowForm(false);
      setNombre(''); setUsername(''); setPassword(''); setRole('visor');
      router.refresh();
      const usersRes = await fetch('/api/users');
      setUsers(await usersRes.json());
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    setError('');
    setDeleting(id);
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setUsers(u => u.filter(u => u.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 border transition-colors';
  const inputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(100,116,139,0.12)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Ajustes</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Gestión de la aplicación</p>
        </div>
      </div>

      {/* Users management (roles + list) */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Gestión de usuarios</h2>
          </div>
          <button
            onClick={() => { setShowForm(true); setCreateErr(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/30"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo usuario
          </button>
        </div>

        {/* Role descriptions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            { role: 'admin', desc: 'Acceso completo. Puede gestionar usuarios y ajustes.' },
            { role: 'editor', desc: 'Puede ver y editar todas las tablas. Sin acceso a Ajustes.' },
            { role: 'visor', desc: 'Solo lectura. No puede editar ni crear datos.' },
          ].map(({ role: r, desc }) => (
            <div key={r} className="rounded-2xl p-4" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-card)' }}>
              <span
                className="inline-block px-3 py-0.5 rounded-full text-xs font-bold text-white mb-2"
                style={{ background: ROLE_COLORS[r] }}
              >
                {ROLE_LABELS[r]}
              </span>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>

        <div className="border-t mb-5" style={{ borderColor: 'var(--border-card)' }} />

        {/* User list */}
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
          Usuarios ({users.length})
        </p>
        {error && <p className="text-sm text-red-500 font-medium mb-4">{error}</p>}
        <div className="space-y-3">
          {users.map(u => (
            <div
              key={u.id}
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: 'var(--bg-page)', border: '1px solid var(--border-card)' }}
            >
              {u.avatar_url ? (
                <Image src={u.avatar_url} alt={u.nombre} width={40} height={40} className="w-10 h-10 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {u.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{u.nombre}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>@{u.username}</p>
              </div>
              <span
                className="px-3 py-0.5 rounded-full text-xs font-bold text-white shrink-0"
                style={{ background: ROLE_COLORS[u.role] }}
              >
                {ROLE_LABELS[u.role]}
              </span>
              {u.id !== currentUserId && (
                <button
                  onClick={() => setConfirmState({ msg: `¿Eliminar a ${u.nombre}?`, fn: async () => handleDelete(u.id) })}
                  disabled={deleting === u.id}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
                  style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}
                  title="Eliminar usuario"
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                >
                  {deleting === u.id ? (
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create user modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="glass-card rounded-3xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Nuevo usuario</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: 'var(--text-muted)', background: 'var(--btn-hover)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nombre completo</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} required className={inputCls} style={inputStyle} placeholder="Nombre del usuario" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Usuario <span className="font-normal text-xs" style={{ color: 'var(--text-muted)' }}>(solo minúsculas, números y _)</span>
                </label>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  required
                  className={inputCls}
                  style={{ ...inputStyle, borderColor: usernameErr ? '#ef4444' : (username && !usernameErr ? '#10b981' : 'var(--btn-border)') }}
                  placeholder="nombre_usuario"
                />
                {usernameErr && <p className="text-xs text-red-500 mt-1">{usernameErr}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={inputCls}
                  style={{ ...inputStyle, borderColor: passwordErr ? '#ef4444' : (password && !passwordErr ? '#10b981' : 'var(--btn-border)') }}
                  placeholder="Mínimo 8 caracteres"
                />
                {password && (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {pwdChecks.map(c => (
                      <div key={c.label} className="flex items-center gap-1.5">
                        <span style={{ color: c.ok ? '#10b981' : '#94a3b8' }}>
                          {c.ok
                            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/></svg>
                          }
                        </span>
                        <span className="text-xs" style={{ color: c.ok ? '#10b981' : 'var(--text-muted)' }}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Rol</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as 'admin' | 'editor' | 'visor')}
                  className={inputCls}
                  style={inputStyle}
                >
                  <option value="admin">Administrador</option>
                  <option value="editor">Editor</option>
                  <option value="visor">Visor</option>
                </select>
              </div>
              {createErr && <p className="text-sm text-red-500 font-medium">{createErr}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold border transition-colors" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'transparent' }}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !!usernameErr || !!passwordErr || !nombre || !username || !password}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                >
                  {creating ? 'Creando…' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Import / Export */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M12 12v5m-2-2 2 2 2-2"/>
          </svg>
          <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Importación y Exportación</h2>
        </div>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Exporta o importa los datos de Hogar en formato JSON. Al importar, los datos existentes serán reemplazados. Los datos personales se gestionan desde cada perfil de usuario.</p>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Export */}
          <button onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold border-2 transition-colors"
            style={{ borderColor: 'var(--btn-border)', color: 'var(--text-secondary)', background: 'var(--bg-page)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar Hogar
          </button>

          {/* Import */}
          <label className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white cursor-pointer transition-all shadow-lg shadow-indigo-500/30 ${importing ? 'opacity-60 pointer-events-none' : ''}`}
            style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {importing ? 'Importando…' : 'Importar Hogar'}
            <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
        </div>

        {ioMsg && (
          <p className={`mt-4 text-sm font-medium rounded-xl px-4 py-2.5 w-fit ${ioMsg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}
            style={{ background: ioMsg.type === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
            {ioMsg.type === 'ok' ? '✓ ' : '✗ '}{ioMsg.text}
          </p>
        )}
      </div>

      <footer className="mt-10 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        FinanceMe {APP_VERSION} &copy; {new Date().getFullYear()} — imrsquare.com
      </footer>
      {confirmState && (
        <ConfirmDialog
          message={confirmState.msg}
          onConfirm={async () => { await confirmState.fn(); setConfirmState(null); }}
          onCancel={() => setConfirmState(null)}
        />
      )}
      {pendingImport && (
        <ConfirmDialog
          message="¿Importar datos de Hogar?"
          detail="Los datos existentes serán reemplazados por los del archivo. Esta acción no se puede deshacer."
          confirmLabel="Importar"
          onConfirm={async () => { const json = pendingImport; setPendingImport(null); await doImport(json); }}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </div>
  );
}

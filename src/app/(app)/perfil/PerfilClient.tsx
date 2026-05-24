'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionUser } from '@/lib/auth';
import { validatePassword } from '@/lib/validation';
import { ConfirmDialog } from '@/components/ConfirmDialog';

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

interface Props { session: SessionUser; }

export default function PerfilClient({ session }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(session.nombre);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(session.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Import / Export personal
  const [importing, setImporting] = useState(false);
  const [ioMsg, setIoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<Record<string, unknown> | null>(null);

  async function handleExport() {
    setIoMsg(null);
    const res = await fetch('/api/export/personal');
    if (!res.ok) { setIoMsg({ type: 'err', text: 'Error al exportar' }); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal-backup-${new Date().toISOString().split('T')[0]}.json`;
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
      if (json.type !== 'personal') {
        setIoMsg({ type: 'err', text: `El fichero es de tipo "${json.type}", no de "personal"` });
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
      const res = await fetch('/api/import/personal', {
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

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleDeleteAvatar() {
    setProfileMsg(''); setProfileErr('');
    const res = await fetch('/api/auth/upload-avatar', { method: 'DELETE' });
    if (!res.ok) { setProfileErr((await res.json()).error); return; }
    setAvatarPreview(null);
    setAvatarFile(null);
    setProfileMsg('Foto de perfil eliminada');
    router.refresh();
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(''); setProfileErr('');
    setSaving(true);
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        const res = await fetch('/api/auth/upload-avatar', { method: 'POST', body: fd });
        if (!res.ok) { setProfileErr((await res.json()).error); return; }
      }
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      });
      if (!res.ok) { setProfileErr((await res.json()).error); return; }
      setProfileMsg('Perfil actualizado correctamente');
      setAvatarFile(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const newPwdErr = newPwd ? validatePassword(newPwd) : null;
  const pwdChecks = [
    { ok: newPwd.length >= 8, label: '8 caracteres mínimo' },
    { ok: /[a-z]/.test(newPwd), label: 'Una minúscula' },
    { ok: /[A-Z]/.test(newPwd), label: 'Una mayúscula' },
    { ok: /[0-9]/.test(newPwd), label: 'Un número' },
    { ok: /[^a-zA-Z0-9]/.test(newPwd), label: 'Un carácter especial' },
  ];

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(''); setPwdErr('');
    if (newPwdErr) { setPwdErr(newPwdErr); return; }
    if (newPwd !== confirmPwd) { setPwdErr('Las contraseñas no coinciden'); return; }
    setSavingPwd(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) { setPwdErr(data.error); return; }
      setPwdMsg('Contraseña cambiada correctamente');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } finally {
      setSavingPwd(false);
    }
  }

  const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 border transition-colors';
  const inputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Mi Perfil</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Gestiona tu información personal</p>
          </div>
        </div>
      </div>

      {/* Profile card */}
      <div className="glass-card rounded-3xl p-8">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt={nombre}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
                  {nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors"
                title="Cambiar foto"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </button>
              {avatarPreview && !avatarFile && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                  title="Eliminar foto de perfil"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{session.nombre}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>@{session.username}</p>
              <span
                className="inline-block mt-1.5 px-3 py-0.5 rounded-full text-xs font-bold text-white"
                style={{ background: ROLE_COLORS[session.role] }}
              >
                {ROLE_LABELS[session.role]}
              </span>
            </div>
          </div>

          {/* Name field */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nombre completo
            </label>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              className={inputCls}
              style={inputStyle}
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Usuario
            </label>
            <input
              value={session.username}
              disabled
              className={inputCls + ' opacity-50 cursor-not-allowed'}
              style={inputStyle}
            />
          </div>

          {profileErr && <p className="text-sm text-red-500 font-medium">{profileErr}</p>}
          {profileMsg && <p className="text-sm text-emerald-500 font-medium">{profileMsg}</p>}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* Import / Export personal */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M12 12v5m-2-2 2 2 2-2"/>
          </svg>
          <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Mis datos personales</h2>
        </div>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Exporta o importa tus datos personales en formato JSON. Al importar, los datos existentes serán reemplazados.</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold border-2 transition-colors"
            style={{ borderColor: 'var(--btn-border)', color: 'var(--text-secondary)', background: 'var(--bg-page)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar mis datos
          </button>

          <label className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white cursor-pointer transition-all shadow-lg shadow-indigo-500/30 ${importing ? 'opacity-60 pointer-events-none' : ''}`}
            style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {importing ? 'Importando…' : 'Importar mis datos'}
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

      {/* Change password card */}
      <div className="glass-card rounded-3xl p-8">
        <h2 className="font-bold text-lg mb-6" style={{ color: 'var(--text-primary)' }}>Cambiar contraseña</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Contraseña actual
            </label>
            <input
              type="password"
              value={currentPwd}
              onChange={e => setCurrentPwd(e.target.value)}
              required
              className={inputCls}
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              required
              className={inputCls}
              style={{ ...inputStyle, borderColor: newPwdErr ? '#ef4444' : (newPwd && !newPwdErr ? '#10b981' : 'var(--btn-border)') }}
              placeholder="Mínimo 8 caracteres"
            />
            {newPwd && (
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
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              required
              className={inputCls}
              style={{ ...inputStyle, borderColor: confirmPwd ? (confirmPwd === newPwd ? '#10b981' : '#ef4444') : 'var(--btn-border)' }}
              placeholder="Repite la nueva contraseña"
            />
            {confirmPwd && confirmPwd !== newPwd && (
              <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          {pwdErr && <p className="text-sm text-red-500 font-medium">{pwdErr}</p>}
          {pwdMsg && <p className="text-sm text-emerald-500 font-medium">{pwdMsg}</p>}

          <button
            type="submit"
            disabled={savingPwd || !!newPwdErr || !currentPwd || !newPwd || newPwd !== confirmPwd}
            className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            {savingPwd ? 'Cambiando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
      {pendingImport && (
        <ConfirmDialog
          message="¿Importar datos personales?"
          detail="Los datos existentes serán reemplazados por los del archivo. Esta acción no se puede deshacer."
          confirmLabel="Importar"
          onConfirm={async () => { const json = pendingImport; setPendingImport(null); await doImport(json); }}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </div>
  );
}

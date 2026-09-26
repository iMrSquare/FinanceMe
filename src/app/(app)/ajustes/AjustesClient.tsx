'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PublicUser } from '@/lib/db';
import { validateUsername, validatePassword } from '@/lib/validation';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ImportOverwriteDialog } from '@/components/ImportOverwriteDialog';
import Image from 'next/image';
import { PasswordChecklist, borde } from '@/components/PasswordForm';
import PageHeader from '@/components/ui/PageHeader';
import Button, { IconButton, buttonClasses } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import SettingsCard, { FormError } from '@/components/ui/SettingsCard';
import { useToast } from '@/components/ui/Feedback';
import { TrashIcon } from '@/components/icons';
import UpdatesCard from '@/components/UpdatesCard';
import type { UpdateInfo } from '@/lib/updates';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  visor: 'Visor',
};

const Ico = ({ d }: { d: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

const ROLE_DESC: Record<string, { resumen: string; puede: string[]; icono: React.ReactNode }> = {
  admin: {
    resumen: 'Control total de la aplicación.',
    puede: ['Todo lo que hace un editor', 'Crear y eliminar usuarios, cambiar roles y contraseñas', 'Activar Hogar y hacer o restaurar sus copias de seguridad'],
    icono: <Ico d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>} />,
  },
  editor: {
    resumen: 'Lleva las cuentas de Hogar.',
    puede: ['Ver y modificar todo Hogar: meses, presupuesto, módulos y categorías', 'No entra en Configuración'],
    icono: <Ico d={<><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></>} />,
  },
  visor: {
    resumen: 'Consulta Hogar sin cambiar nada.',
    puede: ['Ver meses, presupuesto, módulos y estadísticas de Hogar', 'No puede crear, editar ni borrar datos de Hogar'],
    icono: <Ico d={<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>} />,
  },
};

const UsersIcon = () => <Ico d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />;
const KeyIcon = () => <Ico d={<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>} />;
const DatabaseIcon = () => <Ico d={<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>} />;
const DownloadIcon = () => <Ico d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />;
const UploadIcon = () => <Ico d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>} />;
const PlusIcon = () => <Ico d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;

interface Props {
  users: PublicUser[];
  currentUserId: number;
  updates: UpdateInfo;
}

export default function AjustesClient({ users: initialUsers, currentUserId, updates }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState<{ msg: string; detail?: string; label?: string; fn: () => Promise<void> } | null>(null);
  const [changingRole, setChangingRole] = useState<number | null>(null);
  const [resetTarget, setResetTarget] = useState<PublicUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetErr, setResetErr] = useState('');

  // Import / Export (Hogar only — Personal lives in Perfil)
  const [ioSeccion] = useState<'hogar'>('hogar');
  const [importing, setImporting] = useState(false);
  const [ioErr, setIoErr] = useState('');
  const [pendingImport, setPendingImport] = useState<Record<string, unknown> | null>(null);
  const [dupInfo, setDupInfo] = useState<{ count: number; breakdown: Record<string, number> } | null>(null);

  async function handleExport() {
    const res = await fetch(`/api/export/${ioSeccion}`);
    if (!res.ok) { setIoErr('No se pudieron exportar los datos'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ioSeccion}-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Datos de Hogar exportados');
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIoErr('');
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (json.type !== ioSeccion) {
        setIoErr(`El fichero es de tipo «${json.type}», no de «${ioSeccion}»`);
        return;
      }
      setPendingImport(json);
    } catch {
      setIoErr('No se pudo leer el fichero. Comprueba que es una copia JSON de FinanceMe.');
    }
  }

  async function checkThenImport(json: Record<string, unknown>) {
    setImporting(true);
    setIoErr('');
    try {
      const res = await fetch(`/api/import/${ioSeccion}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...json, mode: 'check' }),
      });
      const data = await res.json();
      if (!res.ok) { setIoErr(data.error ?? 'No se pudieron importar los datos'); setImporting(false); return; }
      if (data.duplicates > 0) {
        setDupInfo({ count: data.duplicates, breakdown: data.breakdown });
        setImporting(false);
      } else {
        await doImport(json, true);
      }
    } catch {
      setIoErr('No se pudieron importar los datos');
      setImporting(false);
    }
  }

  async function doImport(json: Record<string, unknown>, overwrite: boolean) {
    setImporting(true);
    setIoErr('');
    try {
      const res = await fetch(`/api/import/${ioSeccion}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...json, mode: 'apply', overwrite }),
      });
      const data = await res.json();
      if (!res.ok) { setIoErr(data.error ?? 'No se pudieron importar los datos'); return; }
      toast(`Importación completada: ${data.importado} registros`);
    } catch {
      setIoErr('No se pudieron importar los datos');
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

  const resetPasswordErr = resetPassword ? validatePassword(resetPassword) : null;

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
      toast(`Usuario ${username} creado`);
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
      toast('Usuario eliminado');
    } finally {
      setDeleting(null);
    }
  }

  async function handleRoleChange(id: number, role: 'admin' | 'editor' | 'visor') {
    setError('');
    setChangingRole(id);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setUsers(u => u.map(x => x.id === id ? { ...x, role } : x));
      toast(`Rol cambiado a ${ROLE_LABELS[role]}`);
    } finally {
      setChangingRole(null);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setResetErr('');
    const err = validatePassword(resetPassword);
    if (err) { setResetErr(err); return; }
    setResetting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resetTarget.id, password: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setResetErr(data.error); return; }
      toast(`Contraseña de ${resetTarget.nombre} restablecida`);
      setResetTarget(null);
      setResetPassword('');
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader title="Configuración" subtitle="Usuarios y copias de seguridad de Hogar" />

      <SettingsCard title="Usuarios" icon={<UsersIcon />} description={`${users.length} ${users.length === 1 ? 'usuario' : 'usuarios'} con acceso a la aplicación.`}
        actions={<Button variant="primary" size="sm" icon={<PlusIcon />} compactOnMobile onClick={() => { setShowForm(true); setCreateErr(''); }}>Nuevo usuario</Button>}>
        {error && <div className="mb-3"><FormError>{error}</FormError></div>}
        <ul className="fm-card overflow-hidden">
          {users.map(u => (
            <li key={u.id} className="flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-2.5 px-3 sm:px-4 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--divider)' }}>
              {u.avatar_url ? (
                <Image src={u.avatar_url} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-accent-mode text-on-accent grid place-items-center font-semibold text-sm shrink-0" aria-hidden="true">
                  {u.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {u.nombre}{u.id === currentUserId && <span className="font-normal" style={{ color: 'var(--text-muted)' }}> (tú)</span>}
                </p>
                <p className="text-[13px] truncate" style={{ color: 'var(--text-muted)' }}>@{u.username}</p>
              </div>
              {/* En móvil el rol baja a su propia línea, a todo el ancho */}
              <div className="order-last sm:order-none basis-full sm:basis-auto flex items-center gap-2 sm:block pl-[52px] sm:pl-0">
                <span className="text-[13px] sm:hidden" style={{ color: 'var(--text-muted)' }} aria-hidden="true">Rol</span>
                <select
                  aria-label={`Rol de ${u.nombre}`}
                  value={u.role}
                  onChange={e => {
                    const newRole = e.target.value as 'admin' | 'editor' | 'visor';
                    if (u.id === currentUserId && newRole !== 'admin') {
                      setConfirmState({ msg: '¿Quitarte el rol de administrador?', detail: 'Perderás el acceso a Configuración hasta que otro administrador te lo devuelva.', label: 'Quitar rol', fn: async () => handleRoleChange(u.id, newRole) });
                    } else {
                      handleRoleChange(u.id, newRole);
                    }
                  }}
                  disabled={changingRole === u.id}
                  className="fm-input flex-1 sm:!w-auto !min-h-10 !py-1 !text-sm cursor-pointer disabled:opacity-50"
                >
                  <option value="admin">{ROLE_LABELS.admin}</option>
                  <option value="editor">{ROLE_LABELS.editor}</option>
                  <option value="visor">{ROLE_LABELS.visor}</option>
                </select>
              </div>
              <div className="flex shrink-0">
                <IconButton label={`Restablecer contraseña de ${u.nombre}`} onClick={() => { setResetTarget(u); setResetPassword(''); setResetErr(''); }}>
                  <KeyIcon />
                </IconButton>
                {u.id !== currentUserId && (
                  <IconButton label={`Eliminar a ${u.nombre}`} disabled={deleting === u.id} className="hover:!text-money-out"
                    onClick={() => setConfirmState({ msg: `¿Eliminar a ${u.nombre}?`, fn: async () => handleDelete(u.id) })}>
                    <TrashIcon />
                  </IconButton>
                )}
              </div>
            </li>
          ))}
        </ul>

        <h3 className="text-[15px] font-semibold mt-6 mb-1" style={{ color: 'var(--text-primary)' }}>Qué puede hacer cada rol</h3>
        <p className="text-[13px] mb-3" style={{ color: 'var(--text-muted)' }}>
          Los roles solo afectan a Hogar. Cada usuario tiene su propio espacio Personal, privado y editable, sea cual sea su rol.
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {(['admin', 'editor', 'visor'] as const).map(r => (
            <li key={r} className="rounded-[var(--radius-control)] border p-3.5" style={{ borderColor: 'var(--btn-border)' }}>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="fm-caticon" style={{ ['--fm-c' as string]: 'var(--accent-mode)' }} aria-hidden="true">{ROLE_DESC[r].icono}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{ROLE_LABELS[r]}</span>
                  <span className="block text-[13px]" style={{ color: 'var(--text-secondary)' }}>{ROLE_DESC[r].resumen}</span>
                </span>
              </div>
              <ul className="space-y-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                {ROLE_DESC[r].puede.map(t => (
                  <li key={t} className="flex gap-2"><span aria-hidden="true" className="mt-[7px] w-1 h-1 rounded-full shrink-0" style={{ background: 'currentColor' }} />{t}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard title="Copia de seguridad de Hogar" icon={<DatabaseIcon />}
        description="Exporta o importa los datos de Hogar en JSON. Si al importar hay registros que ya existen, podrás elegir si sobrescribirlos. Los datos personales se gestionan desde Mi perfil.">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button icon={<DownloadIcon />} onClick={handleExport}>Exportar Hogar</Button>
          <label className={buttonClasses('secondary', 'md', importing ? 'opacity-50 pointer-events-none' : '')}>
            <UploadIcon />
            {importing ? 'Importando…' : 'Importar Hogar'}
            <input type="file" accept=".json" className="sr-only" onChange={handleImport} disabled={importing} />
          </label>
        </div>
        {ioErr && <div className="mt-3"><FormError>{ioErr}</FormError></div>}
      </SettingsCard>

      <UpdatesCard initial={updates} />

      {showForm && (
        <Modal title="Nuevo usuario" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="nu-nombre" className="fm-label">Nombre completo</label>
              <input id="nu-nombre" value={nombre} onChange={e => setNombre(e.target.value)} required className="fm-input" />
            </div>
            <div>
              <label htmlFor="nu-usuario" className="fm-label">Usuario</label>
              <input id="nu-usuario" value={username} autoCapitalize="none" autoComplete="off" aria-describedby="nu-usuario-help"
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                required className="fm-input" style={borde(username ? (usernameErr ? 'error' : 'ok') : null)} />
              <p id="nu-usuario-help" className="text-[13px] mt-1" style={{ color: usernameErr ? 'var(--money-out)' : 'var(--text-muted)' }}>
                {usernameErr ?? 'Solo minúsculas, números y guion bajo.'}
              </p>
            </div>
            <div>
              <label htmlFor="nu-pwd" className="fm-label">Contraseña</label>
              <input id="nu-pwd" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required
                aria-describedby="nu-pwd-reqs" className="fm-input" style={borde(password ? (passwordErr ? 'error' : 'ok') : null)} />
              <PasswordChecklist id="nu-pwd-reqs" value={password} />
            </div>
            <div>
              <label htmlFor="nu-rol" className="fm-label">Rol</label>
              <select id="nu-rol" value={role} onChange={e => setRole(e.target.value as 'admin' | 'editor' | 'visor')} className="fm-input">
                <option value="admin">Administrador</option>
                <option value="editor">Editor</option>
                <option value="visor">Visor</option>
              </select>
              <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>{ROLE_DESC[role].resumen} {ROLE_DESC[role].puede.join('. ')}.</p>
            </div>
            <FormError>{createErr}</FormError>
            <div className="flex gap-2 pt-1 [&>*]:flex-1 sm:justify-end sm:[&>*]:flex-none">
              <Button onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={creating || !!usernameErr || !!passwordErr || !nombre || !username || !password}>
                {creating ? 'Creando…' : 'Crear usuario'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {resetTarget && (
        <Modal title="Restablecer contraseña" onClose={() => setResetTarget(null)}>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Nueva contraseña para <strong className="font-semibold">{resetTarget.nombre}</strong>. Se le pedirá cambiarla al iniciar sesión.
          </p>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="rs-pwd" className="fm-label">Nueva contraseña</label>
              <input id="rs-pwd" type="password" autoComplete="new-password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} required
                aria-describedby="rs-pwd-reqs" className="fm-input" style={borde(resetPassword ? (resetPasswordErr ? 'error' : 'ok') : null)} />
              <PasswordChecklist id="rs-pwd-reqs" value={resetPassword} />
            </div>
            <FormError>{resetErr}</FormError>
            <div className="flex gap-2 pt-1 [&>*]:flex-1 sm:justify-end sm:[&>*]:flex-none">
              <Button onClick={() => setResetTarget(null)}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={resetting || !!resetPasswordErr || !resetPassword}>
                {resetting ? 'Guardando…' : 'Restablecer'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <footer className="pt-5 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        FinanceMe &copy; {new Date().getFullYear()} · <a href="https://imrsquare.com" target="_blank" rel="noopener noreferrer" className="hover:underline">imrsquare.com</a>
      </footer>
      {confirmState && (
        <ConfirmDialog
          message={confirmState.msg}
          detail={confirmState.detail}
          confirmLabel={confirmState.label}
          onConfirm={async () => { await confirmState.fn(); setConfirmState(null); }}
          onCancel={() => setConfirmState(null)}
        />
      )}
      {pendingImport && !dupInfo && (
        <ConfirmDialog
          message="¿Importar datos de Hogar?"
          detail="Se añadirán los datos del archivo a los que ya hay. Si se detectan registros duplicados, se te preguntará si quieres sobrescribirlos."
          confirmLabel="Importar"
          danger={false}
          onConfirm={() => checkThenImport(pendingImport)}
          onCancel={() => setPendingImport(null)}
        />
      )}
      {pendingImport && dupInfo && (
        <ImportOverwriteDialog
          count={dupInfo.count}
          breakdown={dupInfo.breakdown}
          onOverwrite={async () => { const json = pendingImport; setPendingImport(null); setDupInfo(null); await doImport(json, true); }}
          onSkip={async () => { const json = pendingImport; setPendingImport(null); setDupInfo(null); await doImport(json, false); }}
          onCancel={() => { setPendingImport(null); setDupInfo(null); }}
        />
      )}
    </div>
  );
}

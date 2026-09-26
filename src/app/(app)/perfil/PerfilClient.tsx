'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionUser } from '@/lib/auth';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ImportOverwriteDialog } from '@/components/ImportOverwriteDialog';
import { useTutorial } from '@/components/TutorialProvider';
import { HelpIcon, LockIcon } from '@/components/icons';
import AppearanceCard from '@/components/AppearanceCard';
import PasswordForm from '@/components/PasswordForm';
import PageHeader from '@/components/ui/PageHeader';
import Button, { buttonClasses } from '@/components/ui/Button';
import SettingsCard, { FormError } from '@/components/ui/SettingsCard';
import { useToast } from '@/components/ui/Feedback';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  visor: 'Visor',
};

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const DatabaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

interface Props { session: SessionUser; hogarDisponible: boolean; }

export default function PerfilClient({ session, hogarDisponible }: Props) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const tutorial = useTutorial();

  const [nombre, setNombre] = useState(session.nombre);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(session.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [profileErr, setProfileErr] = useState('');
  const [saving, setSaving] = useState(false);

  // Import / Export personal
  const [importing, setImporting] = useState(false);
  const [ioErr, setIoErr] = useState('');
  const [pendingImport, setPendingImport] = useState<Record<string, unknown> | null>(null);
  const [dupInfo, setDupInfo] = useState<{ count: number; breakdown: Record<string, number> } | null>(null);

  async function handleExport() {
    setIoErr('');
    const res = await fetch('/api/export/personal');
    if (!res.ok) { setIoErr('No se pudieron exportar los datos'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Datos exportados');
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIoErr('');
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (json.type !== 'personal') {
        setIoErr(`El fichero es de tipo «${json.type}», no de «personal»`);
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
      const res = await fetch('/api/import/personal', {
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
      const res = await fetch('/api/import/personal', {
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

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleDeleteAvatar() {
    setProfileErr('');
    const res = await fetch('/api/auth/upload-avatar', { method: 'DELETE' });
    if (!res.ok) { setProfileErr((await res.json()).error); return; }
    setAvatarPreview(null);
    setAvatarFile(null);
    toast('Foto de perfil eliminada');
    router.refresh();
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErr('');
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
      toast('Perfil guardado');
      setAvatarFile(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const iniciales = nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Mi perfil" subtitle="Tus datos, tu contraseña y cómo se ve la aplicación" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-5">
          <SettingsCard title="Datos personales">
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="flex items-center gap-4">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="" width={72} height={72} className="w-[72px] h-[72px] rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-[72px] h-[72px] rounded-full bg-accent-mode text-on-accent grid place-items-center text-2xl font-semibold shrink-0" aria-hidden="true">
                    {iniciales}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{session.nombre}</p>
                  <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>@{session.username} · {ROLE_LABELS[session.role]}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Button size="sm" onClick={() => fileRef.current?.click()}>{avatarPreview ? 'Cambiar foto' : 'Subir foto'}</Button>
                    {avatarPreview && !avatarFile && <Button size="sm" variant="ghost" onClick={handleDeleteAvatar}>Quitar</Button>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} aria-label="Foto de perfil" />
                </div>
              </div>

              <div>
                <label htmlFor="perfil-nombre" className="fm-label">Nombre completo</label>
                <input id="perfil-nombre" value={nombre} onChange={e => setNombre(e.target.value)} required autoComplete="name" className="fm-input" />
              </div>
              <div>
                <label htmlFor="perfil-usuario" className="fm-label">Usuario</label>
                <input id="perfil-usuario" value={session.username} disabled className="fm-input opacity-60 cursor-not-allowed" />
              </div>

              <FormError>{profileErr}</FormError>

              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
            </form>
          </SettingsCard>

          <SettingsCard title="Contraseña" description="Usa al menos 8 caracteres con mayúsculas, minúsculas, números y un símbolo." icon={<LockIcon />}>
            <PasswordForm onSuccess={() => toast('Contraseña cambiada')} />
          </SettingsCard>
        </div>

        <div className="space-y-5">
          <AppearanceCard session={session} hogarDisponible={hogarDisponible} />

          <SettingsCard title="Tutorial" description="Vuelve a ver la guía de bienvenida con el flujo de trabajo recomendado."
            icon={<HelpIcon />} actions={<Button size="sm" onClick={() => tutorial.open()}>Ver tutorial</Button>} />

          <SettingsCard title="Mis datos personales" icon={<DatabaseIcon />}
            description="Exporta o importa tus datos personales en JSON. Si al importar hay registros que ya existen, podrás elegir si sobrescribirlos.">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button icon={<DownloadIcon />} onClick={handleExport}>Exportar mis datos</Button>
              <label className={buttonClasses('secondary', 'md', importing ? 'opacity-50 pointer-events-none' : '')}>
                <UploadIcon />
                {importing ? 'Importando…' : 'Importar mis datos'}
                <input type="file" accept=".json" className="sr-only" onChange={handleImport} disabled={importing} />
              </label>
            </div>
            {ioErr && <div className="mt-3"><FormError>{ioErr}</FormError></div>}
          </SettingsCard>
        </div>
      </div>

      <footer className="mt-10 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        FinanceMe &copy; {new Date().getFullYear()} · <a href="https://imrsquare.com" target="_blank" rel="noopener noreferrer" className="hover:underline">imrsquare.com</a>
      </footer>
      {pendingImport && !dupInfo && (
        <ConfirmDialog
          message="¿Importar datos personales?"
          detail="Se añadirán los datos del archivo a los que ya tienes. Si se detectan registros duplicados, se te preguntará si quieres sobrescribirlos."
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

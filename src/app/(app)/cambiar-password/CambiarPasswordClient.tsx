'use client';
import { useState } from 'react';
import PasswordForm from '@/components/PasswordForm';
import { LockIcon } from '@/components/icons';

export default function CambiarPasswordClient({ forced }: { forced: boolean }) {
  const [success, setSuccess] = useState(false);

  function handleSuccess() {
    setSuccess(true);
    setTimeout(() => { window.location.href = '/'; }, 1500);
  }

  const cabecera = (
    <div className="flex items-start gap-3 mb-5">
      <span className="fm-caticon" style={{ ['--fm-c' as string]: 'var(--accent-mode)' }} aria-hidden="true"><LockIcon /></span>
      <div>
        <h1 id="pwd-title" className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {forced ? 'Establece tu contraseña' : 'Cambiar contraseña'}
        </h1>
        {forced && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Por seguridad, crea una contraseña personal antes de continuar.
          </p>
        )}
      </div>
    </div>
  );

  const contenido = success ? (
    <div role="status" className="flex flex-col items-center gap-2 py-6 text-center">
      <span className="fm-caticon !w-12 !h-12" style={{ ['--fm-c' as string]: 'var(--money-in)' }} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      </span>
      <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Contraseña cambiada</p>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Accediendo a la aplicación…</p>
    </div>
  ) : (
    <>
      {cabecera}
      <PasswordForm onSuccess={handleSuccess} submitLabel="Guardar contraseña" block />
    </>
  );

  // Cambio obligatorio: capa a pantalla completa que bloquea el resto de la app
  if (forced) {
    return (
      <div className="fm-overlay !items-center p-4" style={{ zIndex: 500 }}>
        <div role="dialog" aria-modal="true" aria-labelledby="pwd-title" className="fm-dialog !rounded-[var(--radius-modal)] !p-6 max-w-md">
          {contenido}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="fm-card w-full max-w-md p-6">{contenido}</div>
    </div>
  );
}

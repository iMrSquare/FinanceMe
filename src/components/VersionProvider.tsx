'use client';
import { createContext, useCallback, useContext, useState } from 'react';

const VersionContext = createContext<{ show: boolean; dismiss: () => void } | null>(null);

export function useVersionNotification() {
  const ctx = useContext(VersionContext);
  if (!ctx) throw new Error('useVersionNotification debe usarse dentro de VersionProvider');
  return ctx;
}

export default function VersionProvider({ hasNewVersion, children }: { hasNewVersion: boolean; children: React.ReactNode }) {
  const [show, setShow] = useState(hasNewVersion);

  // Estable entre renders para poder usarse como dependencia de efectos (VersionSeenMarker)
  const dismiss = useCallback(() => {
    setShow(false);
    fetch('/api/auth/dismiss-version', { method: 'POST' });
  }, []);

  return <VersionContext.Provider value={{ show, dismiss }}>{children}</VersionContext.Provider>;
}

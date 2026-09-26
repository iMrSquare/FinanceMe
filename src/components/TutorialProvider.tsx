'use client';
import { createContext, useContext, useState } from 'react';
import type { SessionUser } from '@/lib/auth-edge';
import WelcomeTutorialModal from './WelcomeTutorialModal';

const TutorialContext = createContext<{ open: () => void } | null>(null);

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial debe usarse dentro de TutorialProvider');
  return ctx;
}

export default function TutorialProvider({ session, hogarDisponible = false, children }: { session: SessionUser | null; hogarDisponible?: boolean; children: React.ReactNode }) {
  // Solo al montar: si se reevaluara con cada refresco de la sesión, el tutorial volvería a abrirse tras cerrarlo
  const [show, setShow] = useState(() => !!session && !session.tutorialSeen && !session.mustChangePassword);

  async function dismiss() {
    setShow(false);
    await fetch('/api/auth/dismiss-tutorial', { method: 'POST' });
  }

  return (
    <TutorialContext.Provider value={{ open: () => setShow(true) }}>
      {children}
      {show && session && <WelcomeTutorialModal session={session} hogarDisponible={hogarDisponible} onClose={dismiss} />}
    </TutorialContext.Provider>
  );
}

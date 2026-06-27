'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { SessionUser } from '@/lib/auth-edge';
import WelcomeTutorialModal from './WelcomeTutorialModal';

const TutorialContext = createContext<{ open: () => void } | null>(null);

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial debe usarse dentro de TutorialProvider');
  return ctx;
}

export default function TutorialProvider({ session, children }: { session: SessionUser | null; children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (session && !session.tutorialSeen && !session.mustChangePassword) setShow(true);
  }, [session]);

  async function dismiss() {
    setShow(false);
    await fetch('/api/auth/dismiss-tutorial', { method: 'POST' });
  }

  return (
    <TutorialContext.Provider value={{ open: () => setShow(true) }}>
      {children}
      {show && <WelcomeTutorialModal onClose={dismiss} />}
    </TutorialContext.Provider>
  );
}

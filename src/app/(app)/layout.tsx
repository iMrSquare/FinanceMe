import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TutorialProvider from '@/components/TutorialProvider';
import VersionProvider from '@/components/VersionProvider';
import { ToastProvider } from '@/components/ui/Feedback';
import { getSession } from '@/lib/auth';
import { isHogarActivated, getUserById } from '@/lib/db';
import { APP_VERSION } from '@/lib/constants';
import { getUpdateInfo } from '@/lib/updates';
import VersionWatcher from '@/components/VersionWatcher';
import PushRegistrar from '@/components/PushRegistrar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const hogarActivated = isHogarActivated();
  const dbUser = getUserById(session.id);
  const hasNewVersion = dbUser ? dbUser.version_seen !== APP_VERSION : false;
  // Solo los administradores pueden actualizar el servidor: solo ellos ven el aviso
  const update = session.role === 'admin' ? getUpdateInfo() : null;

  return (
    <TutorialProvider session={session} hogarDisponible={hogarActivated || session.role === 'admin'}>
      <VersionProvider hasNewVersion={hasNewVersion}>
        <ToastProvider>
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
          <Sidebar session={session} hogarActivated={hogarActivated} updateDisponible={update?.available ? update.latest : null} />
          <main className="flex-1 min-w-0 overflow-y-auto px-4 pt-[72px] pb-safe-nav lg:p-10">
            {children}
          </main>
        </div>
        <VersionWatcher />
        <PushRegistrar />
        </ToastProvider>
      </VersionProvider>
    </TutorialProvider>
  );
}

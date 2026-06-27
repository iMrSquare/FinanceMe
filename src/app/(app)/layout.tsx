import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TutorialProvider from '@/components/TutorialProvider';
import VersionProvider from '@/components/VersionProvider';
import { getSession } from '@/lib/auth';
import { isHogarActivated, getUserById } from '@/lib/db';
import { APP_VERSION } from '@/lib/constants';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const hogarActivated = isHogarActivated();
  const dbUser = getUserById(session.id);
  const hasNewVersion = dbUser ? dbUser.version_seen !== APP_VERSION : false;

  return (
    <TutorialProvider session={session}>
      <VersionProvider hasNewVersion={hasNewVersion}>
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
          <Sidebar session={session} hogarActivated={hogarActivated} />
          <main className="flex-1 min-w-0 overflow-y-auto px-4 pt-[72px] pb-safe-nav lg:p-10">
            {children}
          </main>
        </div>
      </VersionProvider>
    </TutorialProvider>
  );
}

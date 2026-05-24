import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getSession } from '@/lib/auth';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
      <Sidebar session={session} />
      <main className="flex-1 min-w-0 overflow-y-auto px-4 pt-[72px] pb-safe-nav lg:p-10">
        {children}
      </main>
    </div>
  );
}

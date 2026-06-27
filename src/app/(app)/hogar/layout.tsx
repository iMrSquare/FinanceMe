import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { isHogarActivated } from '@/lib/db';

export default async function HogarLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin' && !isHogarActivated()) {
    redirect('/personal');
  }
  return <>{children}</>;
}

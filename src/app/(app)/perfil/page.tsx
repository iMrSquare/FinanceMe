import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PerfilClient from './PerfilClient';

export const metadata = { title: 'Mi Perfil — FinanceMe Hogar' };

export default async function PerfilPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  return <PerfilClient session={session} />;
}

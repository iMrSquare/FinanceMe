import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { isHogarActivated } from '@/lib/db';
import PerfilClient from './PerfilClient';

export const metadata = { title: 'Mi perfil' };

export default async function PerfilPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  return <PerfilClient session={session} hogarDisponible={session.role === 'admin' || isHogarActivated()} />;
}

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllUsers } from '@/lib/db';
import AjustesClient from './AjustesClient';

export const metadata = { title: 'Ajustes — FinanceMe Hogar' };

export default async function AjustesPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/');

  const users = getAllUsers();
  return <AjustesClient users={users} currentUserId={session.id} />;
}

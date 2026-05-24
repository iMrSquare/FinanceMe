import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CambiarPasswordClient from './CambiarPasswordClient';

export const metadata = { title: 'Cambiar contraseña — FinanceMe' };

export default async function CambiarPasswordPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  return <CambiarPasswordClient forced={session.mustChangePassword ?? false} />;
}

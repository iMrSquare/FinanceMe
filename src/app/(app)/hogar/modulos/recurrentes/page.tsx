import { getSession, canEdit } from '@/lib/auth';
import RecurrentesClient from '@/components/recurrentes/RecurrentesClient';

export const metadata = { title: 'Hogar · Recurrentes' };

export default async function HogarRecurrentesPage() {
  const session = await getSession();
  return <RecurrentesClient scope="hogar" canEdit={canEdit(session?.role ?? 'visor')} />;
}

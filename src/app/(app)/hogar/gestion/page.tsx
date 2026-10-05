import { redirect } from 'next/navigation';
import { getSession, canEdit } from '@/lib/auth';
import GestionView from '@/components/gestion/GestionView';

export const metadata = { title: 'Hogar · Categorías y bancos' };

export default async function GestionHogarPage() {
  const session = await getSession();
  if (!canEdit(session?.role ?? 'visor')) redirect('/hogar/presupuesto');
  return <GestionView scope="hogar" />;
}

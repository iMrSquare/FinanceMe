import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getPersonalEstadisticas } from '@/lib/db';
import EstadisticasPersonalClient from './EstadisticasPersonalClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Estadísticas — Personal FinanceMe' };

export default async function EstadisticasPersonalPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const data = getPersonalEstadisticas(session.id, 12);
  return <EstadisticasPersonalClient data={data} />;
}

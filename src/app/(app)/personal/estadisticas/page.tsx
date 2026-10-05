import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getPersonalEstadisticas } from '@/lib/db';
import EstadisticasView from '@/components/estadisticas/EstadisticasView';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Personal · Estadísticas' };

export default async function EstadisticasPersonalPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  return <EstadisticasView scope="personal" initial={getPersonalEstadisticas(session.id, { limit: 6 })} />;
}

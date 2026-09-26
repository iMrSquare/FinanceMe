import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProximosPagos } from '@/lib/avisos';
import { rangoAvisos } from '@/lib/avisosRango';
import AvisosClient from '@/components/avisos/AvisosClient';

export const metadata = { title: 'Avisos — FinanceMe Personal' };

export default async function PersonalAvisosPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const { desde, hasta, hoy } = rangoAvisos();
  return <AvisosClient scope="personal" pagos={getProximosPagos('personal', session.id, desde, hasta)} hoy={hoy} />;
}

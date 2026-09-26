import { getProximosPagos } from '@/lib/avisos';
import { rangoAvisos } from '@/lib/avisosRango';
import AvisosClient from '@/components/avisos/AvisosClient';

export const metadata = { title: 'Avisos — FinanceMe Hogar' };
export const dynamic = 'force-dynamic';

export default function HogarAvisosPage() {
  const { desde, hasta, hoy } = rangoAvisos();
  return <AvisosClient scope="hogar" pagos={getProximosPagos('hogar', undefined, desde, hasta)} hoy={hoy} />;
}

import { getSession, canEdit } from '@/lib/auth';
import AhorroView from '@/components/ahorro/AhorroView';

export const metadata = { title: 'Objetivos — FinanceMe Hogar' };

export default async function HogarObjetivosPage() {
  const session = await getSession();
  return <AhorroView scope="hogar" vista="objetivos" canEdit={canEdit(session?.role ?? 'visor')} />;
}

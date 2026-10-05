import { getSession, canEdit } from '@/lib/auth';
import AhorroView from '@/components/ahorro/AhorroView';

export const metadata = { title: 'Hogar · Ahorro anual' };

export default async function HogarAhorroPage() {
  const session = await getSession();
  return <AhorroView scope="hogar" vista="anual" canEdit={canEdit(session?.role ?? 'visor')} />;
}

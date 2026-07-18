import { getSession, canEdit } from '@/lib/auth';
import { getAhorroObjetivos } from '@/lib/db';
import AhorroTabsHogar from './AhorroTabsHogar';

export const metadata = { title: 'Ahorro — FinanceMe Hogar' };

export default async function HogarAhorroPage() {
  const session = await getSession();
  const editable = canEdit(session?.role ?? 'visor');
  const objetivos = getAhorroObjetivos();

  return <AhorroTabsHogar objetivos={objetivos} canEdit={editable} />;
}

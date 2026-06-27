import { getSession, canEdit } from '@/lib/auth';
import { getAhorroObjetivos } from '@/lib/db';
import ObjetivosHogarClient from './ObjetivosHogarClient';

export const metadata = { title: 'Ahorro — FinanceMe Hogar' };

export default async function HogarAhorroPage() {
  const session = await getSession();
  const editable = canEdit(session?.role ?? 'visor');
  const objetivos = getAhorroObjetivos();

  return <ObjetivosHogarClient objetivos={objetivos} canEdit={editable} />;
}

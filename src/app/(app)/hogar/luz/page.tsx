import { getRegistroLuz, getCategorias } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { getSession, canEdit } from '@/lib/auth';
import RegistroLuzClient from '@/components/RegistroLuzClient';

export const metadata = { title: 'Luz — FinanceMe Hogar' };

export default async function HogarLuzPage() {
  seedDatabase();
  const session = await getSession();
  const registros = getRegistroLuz();
  const companias = getCategorias('luz');
  return <RegistroLuzClient registros={registros} companias={companias} canEdit={canEdit(session?.role ?? 'visor')} />;
}

import { getRegistroAgua, getCategorias } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { getSession, canEdit } from '@/lib/auth';
import RegistroAguaClient from '@/components/RegistroAguaClient';

export const metadata = { title: 'Agua — FinanceMe Hogar' };

export default async function HogarAguaPage() {
  seedDatabase();
  const session = await getSession();
  const registros = getRegistroAgua();
  const companias = getCategorias('agua');
  return <RegistroAguaClient registros={registros} companias={companias} canEdit={canEdit(session?.role ?? 'visor')} />;
}

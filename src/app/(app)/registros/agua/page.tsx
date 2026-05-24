import { getRegistroAgua, getCategorias } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import RegistroAguaClient from '@/components/RegistroAguaClient';

export default function AguaPage() {
  seedDatabase();
  const registros = getRegistroAgua();
  const companias = getCategorias('agua');
  return <RegistroAguaClient registros={registros} companias={companias} />;
}

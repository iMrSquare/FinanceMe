import { getRegistroLuz, getCategorias } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import RegistroLuzClient from '@/components/RegistroLuzClient';

export default function LuzPage() {
  seedDatabase();
  const registros = getRegistroLuz();
  const companias = getCategorias('luz');
  return <RegistroLuzClient registros={registros} companias={companias} />;
}

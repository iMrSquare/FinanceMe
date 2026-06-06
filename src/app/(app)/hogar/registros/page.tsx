import { getRegistroLuz, getRegistroAgua, getCategorias } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { getSession, canEdit } from '@/lib/auth';
import RegistroLuzClient from '@/components/RegistroLuzClient';
import RegistroAguaClient from '@/components/RegistroAguaClient';

export const metadata = { title: 'Registros — FinanceMe Hogar' };

export default async function HogarRegistrosPage() {
  seedDatabase();
  const session = await getSession();
  const editable = canEdit(session?.role ?? 'visor');

  const registrosLuz = getRegistroLuz();
  const companiasLuz = getCategorias('luz');
  const registrosAgua = getRegistroAgua();
  const companiasAgua = getCategorias('agua');

  return (
    <div className="space-y-12">
      <RegistroLuzClient registros={registrosLuz} companias={companiasLuz} canEdit={editable} />
      <div style={{ borderTop: '1px solid var(--divider)' }} />
      <RegistroAguaClient registros={registrosAgua} companias={companiasAgua} canEdit={editable} />
    </div>
  );
}

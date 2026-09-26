import { BackToModulos } from '@/components/modulos/ModulosHub';
import InfoExpand from '@/components/InfoExpand';
import PageHeader from '@/components/ui/PageHeader';
import RegistroServicioView from '@/components/registros/RegistroServicioView';
import { getRegistroLuz, getRegistroAgua, getCategorias } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { getSession, canEdit } from '@/lib/auth';

export const metadata = { title: 'Registros — FinanceMe Hogar' };

export default async function HogarRegistrosPage() {
  seedDatabase();
  const session = await getSession();
  const editable = canEdit(session?.role ?? 'visor');

  return (
    <div>
      <div className="mb-3"><BackToModulos href="/hogar/modulos" /></div>
      <PageHeader
        title="Registros"
        subtitle="Facturas y consumos de luz y agua"
        info={
          <InfoExpand title="¿Qué son los Registros?">
            <p>Apunta a mano las facturas o lecturas de luz y agua para ver la evolución del gasto y del consumo. Son independientes del Presupuesto y del Mes.</p>
          </InfoExpand>
        }
      />
      <RegistroServicioView tipo="luz" registros={getRegistroLuz()} companias={getCategorias('luz')} canEdit={editable} />
      <RegistroServicioView tipo="agua" registros={getRegistroAgua()} companias={getCategorias('agua')} canEdit={editable} />
    </div>
  );
}

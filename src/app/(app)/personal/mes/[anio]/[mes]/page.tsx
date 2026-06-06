import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getPersonalMeses, personalMesExists,
  getPersonalGastosMes, getPersonalIngresosMes,
  getPersonalCategorias, getPersonalBancos, getPersonalGastos,
} from '@/lib/db';
import MesPersonalClient from './MesPersonalClient';

interface Props { params: Promise<{ anio: string; mes: string }> }

export async function generateMetadata({ params }: Props) {
  const { anio, mes } = await params;
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return { title: `${MESES[Number(mes) - 1]} ${anio} — Personal FinanceMe` };
}

export default async function MesPersonalPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { anio: anioStr, mes: mesStr } = await params;
  const anio = Number(anioStr);
  const mes = Number(mesStr);

  const meses = getPersonalMeses(session.id);
  const mesExists = personalMesExists(session.id, mes, anio);

  // If this month doesn't exist but others do, go to the most recent one
  if (!mesExists && meses.length > 0) {
    redirect(`/personal/mes/${meses[0].anio}/${meses[0].mes}`);
  }

  const gastos    = mesExists ? getPersonalGastosMes(session.id, anio, mes)   : [];
  const ingresos  = mesExists ? getPersonalIngresosMes(session.id, anio, mes) : [];
  const categorias  = getPersonalCategorias(session.id);
  const bancos      = getPersonalBancos(session.id);
  const gastosFijos = getPersonalGastos(session.id);

  return (
    <MesPersonalClient
      anio={anio}
      mes={mes}
      mesExists={mesExists}
      meses={meses}
      gastos={gastos}
      ingresos={ingresos}
      categorias={categorias}
      bancos={bancos}
      gastosFijos={gastosFijos}
    />
  );
}

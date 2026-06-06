import { getMeses, getOrCreateMes, getGastos, getIngresos, getCategorias, getNombreMes } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { getSession, canEdit } from '@/lib/auth';
import HogarMesPageClient from './HogarMesPageClient';

interface Props {
  params: Promise<{ anio: string; mes: string }>;
}

export default async function HogarMesDetallePage({ params }: Props) {
  seedDatabase();
  const [{ anio: anioStr, mes: mesStr }, session] = await Promise.all([params, getSession()]);
  const anio = Number(anioStr);
  const mes = Number(mesStr);

  const mesObj = getOrCreateMes(mes, anio);
  const gastos = getGastos(mesObj.id);
  const ingresos = getIngresos(mesObj.id);
  const categoriasGasto = getCategorias('gasto');
  const categoriasBanco = getCategorias('prestamo');
  const meses = getMeses();
  const nombre = getNombreMes(mes, anio);

  return (
    <HogarMesPageClient
      mesObj={mesObj}
      gastos={gastos}
      ingresos={ingresos}
      categoriasGasto={categoriasGasto}
      categoriasBanco={categoriasBanco}
      meses={meses}
      nombre={nombre}
      canEdit={canEdit(session?.role ?? 'visor')}
    />
  );
}

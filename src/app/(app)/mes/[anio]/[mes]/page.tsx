import { getMeses, getOrCreateMes, getGastos, getPrestamos, getIngresos, getCategorias, getNombreMes } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import MesPageClient from './MesPageClient';

interface Props {
  params: Promise<{ anio: string; mes: string }>;
}

export default async function MesPage({ params }: Props) {
  seedDatabase();
  const { anio: anioStr, mes: mesStr } = await params;
  const anio = Number(anioStr);
  const mes = Number(mesStr);

  const mesObj = getOrCreateMes(mes, anio);
  const gastos = getGastos(mesObj.id);
  const prestamos = getPrestamos(mesObj.id);
  const ingresos = getIngresos(mesObj.id);
  const categoriasGasto = getCategorias('gasto');
  const categoriasPrestamo = getCategorias('prestamo');
  const meses = getMeses();
  const nombre = getNombreMes(mes, anio);

  return (
    <MesPageClient
      mesObj={mesObj}
      gastos={gastos}
      prestamos={prestamos}
      ingresos={ingresos}
      categoriasGasto={categoriasGasto}
      categoriasPrestamo={categoriasPrestamo}
      meses={meses}
      nombre={nombre}
    />
  );
}

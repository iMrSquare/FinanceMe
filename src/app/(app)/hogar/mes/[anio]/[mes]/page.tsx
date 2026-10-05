import { redirect } from 'next/navigation';
import { getMeses, getMes, getGastos, getIngresos, getCategorias, getNombreMes } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { getSession, canEdit } from '@/lib/auth';
import HogarMesPageClient from './HogarMesPageClient';

interface Props {
  params: Promise<{ anio: string; mes: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { anio, mes } = await params;
  return { title: `Hogar · ${getNombreMes(Number(mes), Number(anio))}` };
}

export default async function HogarMesDetallePage({ params }: Props) {
  seedDatabase();
  const [{ anio: anioStr, mes: mesStr }, session] = await Promise.all([params, getSession()]);
  const anio = Number(anioStr);
  const mes = Number(mesStr);

  const meses = getMeses();
  const mesObj = getMes(mes, anio) ?? null;

  // No crear nunca el mes solo por visitar/precargar esta página (evita que un
  // <Link> prefetch cree en silencio un mes vacío sin fijos importados, dejando
  // luego "Crear mes" sin efecto porque el mes ya "existía"). Si el mes pedido no
  // existe pero hay otros, se muestra el más reciente, igual que en Personal.
  if (!mesObj && meses.length > 0) {
    redirect(`/hogar/mes/${meses[0].anio}/${meses[0].mes}`);
  }

  const gastos = mesObj ? getGastos(mesObj.id) : [];
  const ingresos = mesObj ? getIngresos(mesObj.id) : [];
  const categoriasGasto = getCategorias('gasto');
  const categoriasBanco = getCategorias('prestamo');
  const nombre = getNombreMes(mes, anio);

  return (
    <HogarMesPageClient
      mesObj={mesObj}
      mesExists={!!mesObj}
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

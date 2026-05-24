import { seedDatabase } from '@/lib/seed';
import {
  getMeses, getGastos, getPrestamos, getIngresos,
  getCategorias, getBalanceHistory, getGastosPorCategoria,
} from '@/lib/db';
import ResumenClient from './ResumenClient';

export default function ResumenPage() {
  seedDatabase();

  const meses = getMeses();
  const mesActual = meses[0] ?? null;

  const gastos       = mesActual ? getGastos(mesActual.id)    : [];
  const prestamos    = mesActual ? getPrestamos(mesActual.id) : [];
  const ingresos     = mesActual ? getIngresos(mesActual.id)  : [];
  const catGasto     = getCategorias('gasto');
  const gastosxCat   = mesActual ? getGastosPorCategoria(mesActual.id) : [];
  const historial    = getBalanceHistory(6);

  return (
    <ResumenClient
      mesActual={mesActual}
      gastos={gastos}
      prestamos={prestamos}
      ingresos={ingresos}
      catGasto={catGasto}
      gastosxCat={gastosxCat}
      historial={historial}
    />
  );
}

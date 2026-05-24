import { getEstadisticasGastos } from '@/lib/db';
import EstadisticasClient from '../../estadisticas/EstadisticasClient';

export const metadata = { title: 'Estadísticas — FinanceMe Hogar' };

export default function HogarEstadisticasPage() {
  const data = getEstadisticasGastos(12);
  return <EstadisticasClient data={data} />;
}

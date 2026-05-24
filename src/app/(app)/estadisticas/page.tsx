import { getEstadisticasGastos } from '@/lib/db';
import EstadisticasClient from './EstadisticasClient';

export default function EstadisticasPage() {
  const data = getEstadisticasGastos(12);
  return <EstadisticasClient data={data} />;
}

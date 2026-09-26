import { getEstadisticasGastos } from '@/lib/db';
import EstadisticasView from '@/components/estadisticas/EstadisticasView';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Estadísticas — FinanceMe Hogar' };

export default function HogarEstadisticasPage() {
  return <EstadisticasView scope="hogar" initial={getEstadisticasGastos({ limit: 6 })} />;
}

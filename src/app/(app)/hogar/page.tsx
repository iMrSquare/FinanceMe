import { seedDatabase } from '@/lib/seed';
import {
  getMeses, getGastos, getFijos, getAhorro, getAhorroObjetivos,
  getEstadisticasGastos, getRegistroLuz, getRegistroAgua, getBalanceHistory, getMesActual,
} from '@/lib/db';
import HogarResumenClient from './HogarResumenClient';

export const metadata = { title: 'Resumen — FinanceMe Hogar' };

export default function HogarPage() {
  seedDatabase();

  const { mes: mesNum, anio: anioNum } = getMesActual();
  const meses = getMeses();
  const mesActual = meses.find(m => m.mes === mesNum && m.anio === anioNum) ?? null;
  const mesGastos = mesActual ? getGastos(mesActual.id) : [];

  const fijosGasto = getFijos('gasto');
  const objetivosAhorro = getAhorroObjetivos();
  const ahorro = getAhorro(anioNum);
  const estadisticas = getEstadisticasGastos(6);
  const registrosLuz = getRegistroLuz();
  const registrosAgua = getRegistroAgua();
  const historial = getBalanceHistory(6);

  return (
    <HogarResumenClient
      anioActual={anioNum}
      mesActual={mesActual}
      mesGastos={mesGastos}
      fijosGasto={fijosGasto}
      objetivosAhorro={objetivosAhorro}
      ahorro={ahorro}
      estadisticas={estadisticas}
      registrosLuz={registrosLuz}
      registrosAgua={registrosAgua}
      historial={historial}
    />
  );
}

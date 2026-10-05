import { seedDatabase } from '@/lib/seed';
import {
  getMeses, getGastos, getFijos, getAhorro, getAhorroObjetivos,
  getEstadisticasGastos, getRegistroLuz, getRegistroAgua, getBalanceHistory, getMesActual, getHogarRecurrentes,
  getPresupuestoAutoConfigsHogar, getCategorias,
} from '@/lib/db';
import HogarResumenClient from './HogarResumenClient';

export const metadata = { title: 'Hogar · Resumen' };

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
  const recurrentes = getHogarRecurrentes();

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
      recurrentes={recurrentes}
      autoConfigs={getPresupuestoAutoConfigsHogar()}
      categorias={getCategorias('gasto')}
    />
  );
}

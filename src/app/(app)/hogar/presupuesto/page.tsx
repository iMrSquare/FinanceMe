import { getFijos, getCategorias, getAhorroObjetivos, getAhorro, getPresupuestoAutoConfigsHogar, getHogarRecurrentes } from '@/lib/db';
import { getSession, canEdit } from '@/lib/auth';
import PresupuestoHogarClient from './PresupuestoHogarClient';

export const metadata = { title: 'Presupuesto — FinanceMe Hogar' };

export default async function HogarPresupuestoPage() {
  const session = await getSession();
  const editable = canEdit(session?.role ?? 'visor');

  const gastosFijos = getFijos('gasto');
  const ingresosFijos = getFijos('ingreso');
  const catGasto = getCategorias('gasto');
  const catPrestamo = getCategorias('prestamo');
  const objetivosAhorro = getAhorroObjetivos();
  const ahorro = getAhorro(new Date().getFullYear());
  const autoConfigs = getPresupuestoAutoConfigsHogar();
  const recurrentes = getHogarRecurrentes();

  return (
    <PresupuestoHogarClient
      gastosFijos={gastosFijos}
      ingresosFijos={ingresosFijos}
      catGasto={catGasto}
      catPrestamo={catPrestamo}
      objetivosAhorro={objetivosAhorro}
      ahorro={ahorro}
      autoConfigs={autoConfigs}
      recurrentes={recurrentes}
      canEdit={editable}
    />
  );
}

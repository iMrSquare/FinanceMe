import { getFijos, getCategorias, getAhorroObjetivos, getPresupuestoAutoConfigsHogar } from '@/lib/db';
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
  const autoConfigs = getPresupuestoAutoConfigsHogar();

  return (
    <PresupuestoHogarClient
      gastosFijos={gastosFijos}
      ingresosFijos={ingresosFijos}
      catGasto={catGasto}
      catPrestamo={catPrestamo}
      objetivosAhorro={objetivosAhorro}
      autoConfigs={autoConfigs}
      canEdit={editable}
    />
  );
}

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getPersonalAhorro, getPersonalAhorroObjetivos, getPersonalSuscripciones } from '@/lib/db';
import { totalMensualRecurrentes } from '@/lib/recurrentes';
import ModulosHub, { type Modulo } from '@/components/modulos/ModulosHub';
import { PiggyIcon, RepeatIcon, TargetIcon } from '@/components/icons';

export const metadata = { title: 'Módulos — FinanceMe Personal' };

const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export default async function PersonalModulosPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const recurrentes = getPersonalSuscripciones(session.id);
  const anio = new Date().getFullYear();
  const ahorro = getPersonalAhorro(session.id, anio);
  const aportado = ahorro.meses.reduce((s, m) => s + m.aportado, 0);
  const objetivosActivos = getPersonalAhorroObjetivos(session.id).filter(o => o.aportado < o.objetivo);

  const modulos: Modulo[] = [
    {
      href: '/personal/modulos/recurrentes',
      titulo: 'Recurrentes',
      descripcion: 'Suscripciones y pagos mensuales, trimestrales o anuales.',
      dato: recurrentes.length ? `${recurrentes.length} recurrente${recurrentes.length !== 1 ? 's' : ''} · ${fmt(totalMensualRecurrentes(recurrentes))}/mes` : 'Sin recurrentes',
      icon: <RepeatIcon className="w-5 h-5" />,
      color: 'var(--accent-mode)',
    },
    {
      href: '/personal/modulos/ahorro',
      titulo: 'Ahorro anual',
      descripcion: 'Tu objetivo de ahorro del año, mes a mes.',
      dato: ahorro.objetivo_anual > 0
        ? `Ahorro ${anio}: ${Math.round((aportado / ahorro.objetivo_anual) * 100)} % de ${fmt(ahorro.objetivo_anual)}`
        : 'Sin objetivo anual',
      icon: <PiggyIcon className="w-5 h-5" />,
      color: 'var(--saving)',
    },
    {
      href: '/personal/modulos/objetivos',
      titulo: 'Objetivos',
      descripcion: 'Metas de ahorro con importe y fecha.',
      dato: objetivosActivos.length
        ? `${objetivosActivos.length} en curso · ${fmt(objetivosActivos.reduce((s, o) => s + o.aportado, 0))} de ${fmt(objetivosActivos.reduce((s, o) => s + o.objetivo, 0))}`
        : 'Sin objetivos en curso',
      icon: <TargetIcon className="w-5 h-5" />,
      color: 'var(--saving)',
    },
  ];

  return <ModulosHub modulos={modulos} accent="var(--accent-personal)" subtitulo="Herramientas adicionales de tus finanzas personales" />;
}

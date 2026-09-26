import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getPersonalAhorro, getPersonalSuscripciones } from '@/lib/db';
import { totalMensualRecurrentes } from '@/lib/recurrentes';
import ModulosHub, { type Modulo } from '@/components/modulos/ModulosHub';
import { PiggyIcon, RepeatIcon } from '@/components/icons';

export const metadata = { title: 'Módulos — FinanceMe Personal' };

const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export default async function PersonalModulosPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const recurrentes = getPersonalSuscripciones(session.id);
  const anio = new Date().getFullYear();
  const ahorro = getPersonalAhorro(session.id, anio);
  const aportado = ahorro.meses.reduce((s, m) => s + m.aportado, 0);

  const modulos: Modulo[] = [
    {
      href: '/personal/modulos/recurrentes',
      titulo: 'Recurrentes',
      descripcion: 'Suscripciones y pagos mensuales, trimestrales o anuales.',
      dato: recurrentes.length ? `${recurrentes.length} recurrente${recurrentes.length !== 1 ? 's' : ''} · ${fmt(totalMensualRecurrentes(recurrentes))}/mes` : 'Sin recurrentes',
      icon: <RepeatIcon className="w-5 h-5" />,
      color: '#8b5cf6',
    },
    {
      href: '/personal/modulos/ahorro',
      titulo: 'Ahorro',
      descripcion: 'Objetivo anual de ahorro y objetivos concretos.',
      dato: ahorro.objetivo_anual > 0
        ? `Ahorro ${anio}: ${Math.round((aportado / ahorro.objetivo_anual) * 100)} % de ${fmt(ahorro.objetivo_anual)}`
        : 'Sin objetivo anual',
      icon: <PiggyIcon className="w-5 h-5" />,
      color: 'var(--color-warning)',
    },
  ];

  return <ModulosHub modulos={modulos} accent="var(--accent-personal)" subtitulo="Herramientas adicionales de tus finanzas personales" />;
}

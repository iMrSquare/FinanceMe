import { getAhorro, getHogarRecurrentes, getRegistroAgua, getRegistroLuz } from '@/lib/db';
import { totalMensualRecurrentes } from '@/lib/recurrentes';
import ModulosHub, { type Modulo } from '@/components/modulos/ModulosHub';
import { ClipboardIcon, PiggyIcon, RepeatIcon } from '@/components/icons';

export const metadata = { title: 'Módulos — FinanceMe Hogar' };

const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export default async function HogarModulosPage() {
  const anio = new Date().getFullYear();
  const recurrentes = getHogarRecurrentes();
  const ahorro = getAhorro(anio);
  const aportado = ahorro.meses.reduce((s, m) => s + m.aportado, 0);
  const nRegistros = getRegistroLuz().filter(r => r.anio === anio).length + getRegistroAgua().filter(r => r.anio === anio).length;

  const modulos: Modulo[] = [
    {
      href: '/hogar/modulos/registros',
      titulo: 'Registros',
      descripcion: 'Facturas y lecturas de luz y agua.',
      dato: nRegistros ? `${nRegistros} registro${nRegistros !== 1 ? 's' : ''} en ${anio}` : `Sin registros en ${anio}`,
      icon: <ClipboardIcon className="w-5 h-5" />,
      color: 'var(--accent-hogar)',
    },
    {
      href: '/hogar/modulos/recurrentes',
      titulo: 'Recurrentes',
      descripcion: 'Seguros, comunidad, impuestos y otros pagos periódicos.',
      dato: recurrentes.length ? `${recurrentes.length} recurrente${recurrentes.length !== 1 ? 's' : ''} · ${fmt(totalMensualRecurrentes(recurrentes))}/mes` : 'Sin recurrentes',
      icon: <RepeatIcon className="w-5 h-5" />,
      color: '#8b5cf6',
    },
    {
      href: '/hogar/modulos/ahorro',
      titulo: 'Ahorro',
      descripcion: 'Objetivo anual de ahorro de la casa y objetivos concretos.',
      dato: ahorro.objetivo_anual > 0
        ? `Ahorro ${anio}: ${Math.round((aportado / ahorro.objetivo_anual) * 100)} % de ${fmt(ahorro.objetivo_anual)}`
        : 'Sin objetivo anual',
      icon: <PiggyIcon className="w-5 h-5" />,
      color: 'var(--color-warning)',
    },
  ];

  return <ModulosHub modulos={modulos} accent="var(--accent-hogar)" subtitulo="Herramientas adicionales de la casa" />;
}

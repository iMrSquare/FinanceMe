import { getAhorro, getAhorroObjetivos, getHogarRecurrentes, getRegistroAgua, getRegistroLuz } from '@/lib/db';
import { totalMensualRecurrentes } from '@/lib/recurrentes';
import ModulosHub, { type Modulo } from '@/components/modulos/ModulosHub';
import { ClipboardIcon, PiggyIcon, RepeatIcon, TargetIcon } from '@/components/icons';

export const metadata = { title: 'Módulos — FinanceMe Hogar' };

const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export default async function HogarModulosPage() {
  const anio = new Date().getFullYear();
  const recurrentes = getHogarRecurrentes();
  const ahorro = getAhorro(anio);
  const aportado = ahorro.meses.reduce((s, m) => s + m.aportado, 0);
  const objetivosActivos = getAhorroObjetivos().filter(o => o.aportado < o.objetivo);
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
      color: 'var(--accent-mode)',
    },
    {
      href: '/hogar/modulos/ahorro',
      titulo: 'Ahorro anual',
      descripcion: 'El objetivo de ahorro de la casa, mes a mes.',
      dato: ahorro.objetivo_anual > 0
        ? `Ahorro ${anio}: ${Math.round((aportado / ahorro.objetivo_anual) * 100)} % de ${fmt(ahorro.objetivo_anual)}`
        : 'Sin objetivo anual',
      icon: <PiggyIcon className="w-5 h-5" />,
      color: 'var(--saving)',
    },
    {
      href: '/hogar/modulos/objetivos',
      titulo: 'Objetivos',
      descripcion: 'Metas de ahorro de la casa con importe y fecha.',
      dato: objetivosActivos.length
        ? `${objetivosActivos.length} en curso · ${fmt(objetivosActivos.reduce((s, o) => s + o.aportado, 0))} de ${fmt(objetivosActivos.reduce((s, o) => s + o.objetivo, 0))}`
        : 'Sin objetivos en curso',
      icon: <TargetIcon className="w-5 h-5" />,
      color: 'var(--saving)',
    },
  ];

  return <ModulosHub modulos={modulos} accent="var(--accent-hogar)" subtitulo="Herramientas adicionales de la casa" />;
}

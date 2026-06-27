const MESES_NOMBRES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export type EstadoObjetivo = 'completado' | 'vencido' | 'en_progreso';

export interface ObjetivoAhorroLike { objetivo: number; aportado: number; fecha_objetivo: string; }

/** `fecha_objetivo` se almacena como "YYYY-MM". Se parsea a mano (sin `Date`) para evitar desfases de zona horaria. */
export function parseMesAnio(fechaObjetivo: string): { anio: number; mes: number } {
  const [anio, mes] = fechaObjetivo.split('-').map(Number);
  return { anio, mes: mes - 1 };
}

export function fmtMesAnio(fechaObjetivo: string): string {
  const { anio, mes } = parseMesAnio(fechaObjetivo);
  return `${MESES_NOMBRES[mes]} ${anio}`;
}

export function mesesRestantes(fechaObjetivo: string): number {
  const hoy = new Date();
  const { anio, mes } = parseMesAnio(fechaObjetivo);
  const meses = (anio - hoy.getFullYear()) * 12 + (mes - hoy.getMonth());
  return Math.max(meses, 1);
}

export function estaVencido(fechaObjetivo: string): boolean {
  const hoy = new Date();
  const { anio, mes } = parseMesAnio(fechaObjetivo);
  return anio * 12 + mes < hoy.getFullYear() * 12 + hoy.getMonth();
}

export function estadoObjetivo(o: ObjetivoAhorroLike): EstadoObjetivo {
  if (o.aportado >= o.objetivo) return 'completado';
  if (estaVencido(o.fecha_objetivo)) return 'vencido';
  return 'en_progreso';
}

/** Importe mensual necesario para llegar al objetivo. `null` si no está "en progreso" (completado o vencido). */
export function mensualNecesario(o: ObjetivoAhorroLike): number | null {
  if (estadoObjetivo(o) !== 'en_progreso') return null;
  return (o.objetivo - o.aportado) / mesesRestantes(o.fecha_objetivo);
}

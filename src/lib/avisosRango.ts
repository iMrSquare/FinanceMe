import { toISODate } from './avisos';

/** Del día 1 del mes actual al último día del mes siguiente */
export function rangoAvisos(now = new Date()) {
  const desde = new Date(now.getFullYear(), now.getMonth(), 1);
  const hasta = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  return { desde, hasta, hoy: toISODate(now) };
}

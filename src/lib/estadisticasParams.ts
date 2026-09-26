import type { EstadisticasFiltro } from './db';

const YM = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Filtro de estadísticas a partir de ?desde=YYYY-MM&hasta=YYYY-MM&cat=A&cat=B */
export function parseEstadisticasParams(params: URLSearchParams, limitPorDefecto: number): EstadisticasFiltro {
  const desde = params.get('desde');
  const hasta = params.get('hasta');
  const categorias = params.getAll('cat').filter(Boolean).slice(0, 100);
  const conRango = (desde && YM.test(desde)) || (hasta && YM.test(hasta));
  return {
    desde: desde && YM.test(desde) ? desde : undefined,
    hasta: hasta && YM.test(hasta) ? hasta : undefined,
    categorias: categorias.length ? categorias : undefined,
    limit: conRango || params.get('todo') === '1' ? undefined : limitPorDefecto,
  };
}

'use client';

import { useId, type ReactNode } from 'react';

interface Opcion { key: string; asc: boolean; label: string }

/** Selector «Ordenar por» para las listas en móvil (las tablas usan cabeceras) */
export default function SortSelect({ opciones, sortKey, sortAsc, onChange, extra }: {
  opciones: Opcion[]; sortKey: string; sortAsc: boolean; onChange: (key: string, asc: boolean) => void;
  /** Control adicional a la derecha (p. ej. un filtro); la etiqueta pasa a ser solo para lectores de pantalla */
  extra?: ReactNode;
}) {
  const id = useId();
  const actual = `${sortKey}:${sortAsc ? 'asc' : 'desc'}`;
  const existe = opciones.some(o => `${o.key}:${o.asc ? 'asc' : 'desc'}` === actual);
  return (
    <div className="fm-sortbar" data-extra={extra ? '' : undefined}>
      <label htmlFor={id} className={extra ? 'sr-only' : undefined}>Ordenar por</label>
      <select id={id} value={existe ? actual : ''} onChange={e => { const [k, d] = e.target.value.split(':'); onChange(k, d === 'asc'); }}>
        {!existe && <option value="" disabled>Personalizado</option>}
        {opciones.map(o => <option key={`${o.key}:${o.asc}`} value={`${o.key}:${o.asc ? 'asc' : 'desc'}`}>{o.label}</option>)}
      </select>
      {extra}
    </div>
  );
}

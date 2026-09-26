'use client';

import { useId } from 'react';

interface Opcion { key: string; asc: boolean; label: string }

/** Selector «Ordenar por» para las listas en móvil (las tablas usan cabeceras) */
export default function SortSelect({ opciones, sortKey, sortAsc, onChange }: {
  opciones: Opcion[]; sortKey: string; sortAsc: boolean; onChange: (key: string, asc: boolean) => void;
}) {
  const id = useId();
  const actual = `${sortKey}:${sortAsc ? 'asc' : 'desc'}`;
  const existe = opciones.some(o => `${o.key}:${o.asc ? 'asc' : 'desc'}` === actual);
  return (
    <div className="fm-sortbar">
      <label htmlFor={id}>Ordenar por</label>
      <select id={id} value={existe ? actual : ''} onChange={e => { const [k, d] = e.target.value.split(':'); onChange(k, d === 'asc'); }}>
        {!existe && <option value="" disabled>Personalizado</option>}
        {opciones.map(o => <option key={`${o.key}:${o.asc}`} value={`${o.key}:${o.asc ? 'asc' : 'desc'}`}>{o.label}</option>)}
      </select>
    </div>
  );
}

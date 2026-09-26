'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';

export type SortType = 'text' | 'number' | 'date';

export interface SortAccessor<T> {
  get: (row: T) => string | number | null | undefined;
  type: SortType;
}

interface Options<T, K extends string> {
  defaultKey: NoInfer<K>;
  defaultAsc?: boolean;
  storageKey?: string;
  tieBreak?: (a: T, b: T) => number;
}

function subscribeStorage(cb: () => void) {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

function readStorage(key: string | undefined): string | null {
  if (!key) return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function isEmpty(v: unknown) {
  return v === null || v === undefined || v === '';
}

function compareValues(a: string | number, b: string | number, type: SortType): number {
  if (type === 'number') return Number(a) - Number(b);
  if (type === 'date') return String(a).localeCompare(String(b));
  return String(a).localeCompare(String(b), 'es', { sensitivity: 'base', numeric: true });
}

export function useTableSort<T, K extends string>(
  rows: T[],
  accessors: Record<K, SortAccessor<T>>,
  { defaultKey, defaultAsc = true, storageKey, tieBreak }: Options<T, K>,
) {
  const stored = useSyncExternalStore(subscribeStorage, () => readStorage(storageKey), () => null);
  const [override, setOverride] = useState<{ key: K; asc: boolean } | null>(null);

  let pref: { key: K; asc: boolean } = override ?? { key: defaultKey, asc: defaultAsc };
  if (!override && stored) {
    try {
      const saved = JSON.parse(stored);
      if (saved && saved.key in accessors) pref = { key: saved.key, asc: Boolean(saved.asc) };
    } catch {}
  }
  const sortKey = pref.key;
  const sortAsc = pref.asc;

  function toggleSort(k: K) {
    const next = { key: k, asc: sortKey === k ? !sortAsc : true };
    setOverride(next);
    if (storageKey) {
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
    }
  }

  const acc = accessors[sortKey];
  const sorted = useMemo(() => {
    if (!acc) return rows;
    return [...rows].sort((a, b) => {
      const va = acc.get(a);
      const vb = acc.get(b);
      const ea = isEmpty(va);
      const eb = isEmpty(vb);
      let cmp: number;
      if (ea && eb) cmp = 0;
      else if (ea) return 1;
      else if (eb) return -1;
      else cmp = compareValues(va as string | number, vb as string | number, acc.type);
      if (!sortAsc) cmp = -cmp;
      return cmp || (tieBreak ? tieBreak(a, b) : 0);
    });
  }, [rows, acc, sortAsc, tieBreak]);

  return { sorted, sortKey, sortAsc, toggleSort };
}

interface SortableThProps<K extends string> {
  label: React.ReactNode;
  sortKey: NoInfer<K>;
  activeKey: K;
  asc: boolean;
  onSort: (k: K) => void;
  align?: 'left' | 'right' | 'center';
  className?: string;
  style?: React.CSSProperties;
}

export function SortableTh<K extends string>({ label, sortKey, activeKey, asc, onSort, align = 'left', className, style }: SortableThProps<K>) {
  const active = activeKey === sortKey;
  return (
    <th
      aria-sort={active ? (asc ? 'ascending' : 'descending') : 'none'}
      className={`sortable-th ${align === 'right' ? 'text-right' : ''} ${className ?? ''}`}
      style={style}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        data-active={active || undefined}
        style={{ justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}
      >
        <span>{label}</span>
        <span aria-hidden="true" className="sortable-th-indicator">{active ? (asc ? '↑' : '↓') : '↕'}</span>
      </button>
    </th>
  );
}

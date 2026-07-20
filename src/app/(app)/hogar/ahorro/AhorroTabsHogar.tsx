'use client';
import { useState } from 'react';
import type { AhorroObjetivo } from '@/lib/db';
import AhorroHogarClient from './AhorroHogarClient';
import ObjetivosHogarClient from './ObjetivosHogarClient';

type Tab = 'anual' | 'objetivos';

export default function AhorroTabsHogar({ objetivos, canEdit }: { objetivos: AhorroObjetivo[]; canEdit: boolean }) {
  const [tab, setTab] = useState<Tab>('anual');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 p-1 rounded-2xl w-fit" style={{ background: 'var(--btn-hover)' }}>
        <button
          onClick={() => setTab('anual')}
          className="px-4 py-1.5 rounded-xl text-sm font-bold transition-all"
          style={tab === 'anual'
            ? { background: 'var(--color-warning)', color: '#fff', boxShadow: '0 2px 8px rgba(var(--color-warning-rgb),0.35)' }
            : { background: 'transparent', color: 'var(--text-muted)' }
          }
        >
          Objetivo anual
        </button>
        <button
          onClick={() => setTab('objetivos')}
          className="px-4 py-1.5 rounded-xl text-sm font-bold transition-all"
          style={tab === 'objetivos'
            ? { background: 'var(--color-warning)', color: '#fff', boxShadow: '0 2px 8px rgba(var(--color-warning-rgb),0.35)' }
            : { background: 'transparent', color: 'var(--text-muted)' }
          }
        >
          Objetivos
        </button>
      </div>

      {tab === 'anual' ? <AhorroHogarClient canEdit={canEdit} /> : <ObjetivosHogarClient objetivos={objetivos} canEdit={canEdit} />}
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Ingreso } from '@/lib/db';

function fmt(n: number) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

export default function IngresosClient({ ingresos: init }: { ingresos: Ingreso[] }) {
  const router = useRouter();
  const [ingresos, setIngresos] = useState(init);
  const [modal, setModal] = useState<{ open: boolean; item?: Ingreso }>({ open: false });
  const [loading, setLoading] = useState(false);

  const total = ingresos.reduce((s, i) => s + i.aportacion, 0);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      inquilino: fd.get('inquilino'),
      aportacion: parseFloat(fd.get('aportacion') as string) || 0,
    };
    if (modal.item) {
      await fetch(`/api/ingresos/${modal.item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/ingresos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setModal({ open: false });
    router.refresh();
    setLoading(false);
  }

  async function del(id: number) {
    if (!confirm('¿Eliminar?')) return;
    await fetch(`/api/ingresos/${id}`, { method: 'DELETE' });
    setIngresos(ingresos.filter(i => i.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">💰 Ingresos Mensuales</h1>
        <button
          onClick={() => setModal({ open: true })}
          className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-700"
        >
          + Añadir
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="font-semibold">Inquilinos</span>
          <span className="text-sm font-mono text-gray-600">Total: {fmt(total)}</span>
        </div>
        <div className="px-4">
          {ingresos.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Sin entradas</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-700 border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-2.5 px-3 font-semibold">Inquilino</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Aportación</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {ingresos.map((i, idx) => (
                  <tr key={i.id} className={`border-b border-gray-200 hover:bg-blue-50 group transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-2.5 px-3 font-semibold text-gray-800">{i.inquilino}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-800">{fmt(i.aportacion)}</td>
                    <td className="py-2.5 text-right pr-2">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal({ open: true, item: i })} className="p-1 text-gray-500 hover:text-gray-800">✏️</button>
                        <button onClick={() => del(i.id)} className="p-1 text-gray-500 hover:text-red-500">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModal({ open: false })}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{modal.item ? 'Editar Inquilino' : 'Nuevo Inquilino'}</h3>
              <button onClick={() => setModal({ open: false })} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input name="inquilino" defaultValue={modal.item?.inquilino} required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aportación (€)</label>
                <input name="aportacion" type="number" step="0.01" defaultValue={modal.item?.aportacion.toString()}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setModal({ open: false })} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-700 disabled:opacity-50">
                  {loading ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

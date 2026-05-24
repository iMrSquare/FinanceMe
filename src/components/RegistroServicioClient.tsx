'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RegistroServicio } from '@/lib/db';
import { BoltIcon, DropletIcon, PencilIcon, TrashIcon } from './icons';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmt(n: number) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

interface Props {
  tipo: 'luz' | 'agua';
  titulo: string;
  registros: RegistroServicio[];
}

export default function RegistroServicioClient({ tipo, titulo, registros: init }: Props) {
  const router = useRouter();
  const [registros, setRegistros] = useState(init);
  const [modal, setModal] = useState<{ open: boolean; item?: RegistroServicio }>({ open: false });
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      anio: parseInt(fd.get('anio') as string),
      mes: parseInt(fd.get('mes') as string),
      importe: parseFloat(fd.get('importe') as string) || 0,
      comentario: fd.get('comentario') || null,
    };
    if (modal.item) {
      await fetch(`/api/registros/${tipo}/${modal.item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch(`/api/registros/${tipo}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setModal({ open: false });
    router.refresh();
    setLoading(false);
  }

  async function del(id: number) {
    if (!confirm('¿Eliminar?')) return;
    await fetch(`/api/registros/${tipo}/${id}`, { method: 'DELETE' });
    setRegistros(registros.filter(r => r.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {tipo === 'luz' ? <BoltIcon className="w-6 h-6" /> : <DropletIcon className="w-6 h-6" />}
          {titulo}
        </h1>
        <button onClick={() => setModal({ open: true })} className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-700">
          + Añadir
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4">
          {registros.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Sin registros</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-700 border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-2.5 px-3 font-semibold">Período</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Importe</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Comentario</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {registros.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-gray-200 hover:bg-blue-50 group transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-2.5 px-3 font-semibold text-gray-800">{MESES[r.mes - 1]} {r.anio}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-800">{fmt(r.importe)}</td>
                    <td className="py-2.5 px-3 text-gray-600 text-xs">{r.comentario}</td>
                    <td className="py-2.5 text-right pr-2">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal({ open: true, item: r })} className="p-1 text-gray-500 hover:text-gray-800 rounded"><PencilIcon /></button>
                        <button onClick={() => del(r.id)} className="p-1 text-gray-500 hover:text-red-500 rounded"><TrashIcon /></button>
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
              <h3 className="font-semibold text-lg">{modal.item ? 'Editar Registro' : 'Nuevo Registro'}</h3>
              <button onClick={() => setModal({ open: false })} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                  <select name="mes" defaultValue={modal.item?.mes ?? new Date().getMonth() + 1}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                  <input name="anio" type="number" defaultValue={modal.item?.anio ?? new Date().getFullYear()}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Importe (€)</label>
                <input name="importe" type="number" step="0.01" defaultValue={modal.item?.importe.toString()}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comentario</label>
                <input name="comentario" defaultValue={modal.item?.comentario ?? ''}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
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

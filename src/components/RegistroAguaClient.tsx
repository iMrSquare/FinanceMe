'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { RegistroAgua, Categoria } from '@/lib/db';
import { DropletIcon, PencilIcon, TrashIcon, SettingsIcon } from './icons';
import { CircularColorPicker, autoText } from './ColorDots';
import { ConfirmDialog } from './ConfirmDialog';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

function CompaniaBadge({ nombre, companias }: { nombre: string | null; companias: Categoria[] }) {
  if (!nombre) return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>;
  const c = companias.find(c => c.nombre === nombre);
  const bg = c?.color ?? '#e5e7eb';
  return (
    <span style={{ backgroundColor: bg, color: autoText(bg) }} className="px-2 py-0.5 rounded-full text-xs font-semibold">
      {nombre}
    </span>
  );
}

const M3_THRESHOLD = 20;

function M3Bar({ m3 }: { m3: number | null }) {
  if (m3 == null) return null;
  const over = m3 > M3_THRESHOLD;
  const pct = Math.min((m3 / M3_THRESHOLD) * 100, 100);
  return (
    <div className="rounded-full h-1.5 overflow-hidden" style={{ width: 120, background: 'var(--divider)' }}>
      <div className={`h-1.5 rounded-full transition-all ${over ? 'bg-red-400' : 'bg-sky-400'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function fmt(n: number) { return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }); }
function fmtNum(n: number | null) { return n == null ? null : n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

const inputCls = 'w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 border';

type ModalState = { type: 'none' } | { type: 'add' } | { type: 'edit'; item: RegistroAgua } | { type: 'gestionar' };

interface Props {
  registros: RegistroAgua[];
  companias: Categoria[];
  canEdit?: boolean;
}

export default function RegistroAguaClient({ registros: initRegistros, companias: initCompanias, canEdit = true }: Props) {
  const router = useRouter();
  const [registros, setRegistros] = useState(initRegistros);
  const [companias, setCompanias] = useState(initCompanias);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [loading, setLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<{ msg: string; fn: () => Promise<void> } | null>(null);

  useEffect(() => { setRegistros(initRegistros); }, [initRegistros]);
  useEffect(() => { setCompanias(initCompanias); }, [initCompanias]);

  const byYear = registros.reduce((acc, r) => { (acc[r.anio] ??= []).push(r); return acc; }, {} as Record<number, RegistroAgua[]>);
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const activeYear = selectedYear ?? years[0] ?? null;

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      anio: parseInt(fd.get('anio') as string),
      nombre: fd.get('nombre') as string,
      importe: parseFloat(fd.get('importe') as string) || 0,
      m3: fd.get('m3') ? parseFloat(fd.get('m3') as string) : null,
      fecha_lectura_inicio: fd.get('fecha_lectura_inicio') || null,
      fecha_lectura_fin: fd.get('fecha_lectura_fin') || null,
      fecha_cobro: fd.get('fecha_cobro') || null,
      compania: fd.get('compania') || null,
    };
    if (modal.type === 'edit') {
      await fetch(`/api/registros/agua/${modal.item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/registros/agua', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setModal({ type: 'none' }); router.refresh(); setLoading(false);
  }

  async function del(id: number) {
    setConfirmState({ msg: '¿Eliminar este registro?', fn: async () => {
      await fetch(`/api/registros/agua/${id}`, { method: 'DELETE' });
      setRegistros(prev => prev.filter(r => r.id !== id));
    }});
  }

  const editItem = modal.type === 'edit' ? modal.item : null;
  const inputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(6,182,212,0.12)' }}>
            <DropletIcon className="w-6 h-6 text-sky-500" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Registro Agua</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Historial de consumo de agua</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {years.length > 0 && (
            <div className="relative">
              <select
                value={activeYear ?? ''}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="appearance-none bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm rounded-2xl pl-4 pr-8 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors shadow-lg shadow-sky-500/30"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs">▼</span>
            </div>
          )}
          {canEdit && (
            <>
              <button
                onClick={() => setModal({ type: 'gestionar' })}
                className="px-3 py-1.5 text-sm font-medium rounded-2xl flex items-center gap-1.5 border-2 transition-colors"
                style={{ borderColor: 'var(--btn-border)', color: 'var(--text-secondary)' }}
              >
                <SettingsIcon className="w-4 h-4" /><span className="hidden sm:inline">Gestionar compañías</span>
              </button>
              <button
                onClick={() => setModal({ type: 'add' })}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-sky-500/30 transition-colors"
              >
                + Añadir registro
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tables by year */}
      {years.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Sin registros — pulsa + Añadir registro para empezar
        </div>
      ) : activeYear != null && (
        <div key={activeYear} className="glass-card rounded-3xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-sky-500">
            <DropletIcon className="w-4 h-4 text-white" />
            <h2 className="font-bold text-white">{activeYear}</h2>
            <span className="text-white/80 text-sm font-mono ml-1">
              {fmt((byYear[activeYear] ?? []).reduce((s, r) => s + (r.importe ?? 0), 0))}
            </span>
          </div>
          {(byYear[activeYear] ?? []).length > 0 && (
            <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--divider)' }}>
              <Line
                data={{
                  labels: (byYear[activeYear] ?? []).map(r => r.nombre),
                  datasets: [{
                    label: 'Importe',
                    data: (byYear[activeYear] ?? []).map(r => r.importe ?? 0),
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14,165,233,0.07)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#0ea5e9',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                  }],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => fmt(ctx.parsed.y ?? 0) } },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: '#94a3b8', font: { size: 11 } },
                    },
                    y: {
                      beginAtZero: false,
                      grid: { color: 'rgba(148,163,184,0.08)' },
                      ticks: {
                        color: '#94a3b8',
                        font: { size: 11 },
                        callback: v => `${Number(v).toLocaleString('es-ES', { maximumFractionDigits: 0 })}€`,
                      },
                    },
                  },
                }}
                height={65}
              />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="theme-table">
              <thead>
                <tr>
                  <th>Período</th>
                  <th className="text-right">Importe</th>
                  <th className="text-right">m³</th>
                  <th></th>
                  <th>Período lectura</th>
                  <th>Fecha cobro</th>
                  <th>Compañía</th>
                  <th className="w-20 text-right pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(byYear[activeYear] ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 px-4 font-semibold">{r.nombre}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">{fmt(r.importe)}</td>
                    <td className="py-3 px-4 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {fmtNum(r.m3) ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="py-3 px-4" style={{ width: 130 }}>
                      <M3Bar m3={r.m3} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {r.fecha_lectura_inicio || r.fecha_lectura_fin
                        ? <>{fmtDate(r.fecha_lectura_inicio)} <span style={{ color: 'var(--text-muted)' }}>–</span> {fmtDate(r.fecha_lectura_fin)}</>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{fmtDate(r.fecha_cobro)}</td>
                    <td className="py-3 px-4"><CompaniaBadge nombre={r.compania} companias={companias} /></td>
                    <td className="py-3 pr-3 text-right">
                      <div className="flex gap-1 justify-end">
                        {canEdit && <button onClick={() => setModal({ type: 'edit', item: r })} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}><PencilIcon /></button>}
                        {canEdit && <button onClick={() => del(r.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 transition-colors"><TrashIcon /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {(modal.type === 'add' || modal.type === 'edit') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModal({ type: 'none' })}>
          <div className="glass-card rounded-3xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid var(--divider)' }}>
              <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <DropletIcon className="w-5 h-5 text-sky-500" />
                {editItem ? 'Editar Registro de Agua' : 'Nuevo Registro de Agua'}
              </h3>
              <button onClick={() => setModal({ type: 'none' })} className="w-7 h-7 flex items-center justify-center rounded-full text-lg hover:bg-black/10" style={{ color: 'var(--text-secondary)' }}>×</button>
            </div>
            <form onSubmit={save} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Período</label>
                  <input name="nombre" required defaultValue={editItem?.nombre ?? ''}
                    placeholder="Ej: Julio-Agosto"
                    className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Año</label>
                  <input name="anio" type="number" defaultValue={editItem?.anio ?? new Date().getFullYear()}
                    className={inputCls} style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Importe (€)</label>
                  <input name="importe" type="number" step="0.01" defaultValue={editItem?.importe ?? ''}
                    className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>m³</label>
                  <input name="m3" type="number" step="0.01" defaultValue={editItem?.m3 ?? ''}
                    className={inputCls} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Período de lectura</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Desde</span>
                    <input name="fecha_lectura_inicio" type="date" defaultValue={editItem?.fecha_lectura_inicio?.split('T')[0] ?? ''}
                      className={inputCls} style={inputStyle} />
                  </div>
                  <div>
                    <span className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Hasta</span>
                    <input name="fecha_lectura_fin" type="date" defaultValue={editItem?.fecha_lectura_fin?.split('T')[0] ?? ''}
                      className={inputCls} style={inputStyle} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Fecha de cobro</label>
                  <input name="fecha_cobro" type="date" defaultValue={editItem?.fecha_cobro?.split('T')[0] ?? ''}
                    className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Compañía</label>
                  <select name="compania" defaultValue={editItem?.compania ?? ''}
                    className={inputCls} style={inputStyle}>
                    <option value="">— Sin compañía —</option>
                    {companias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => setModal({ type: 'none' })}
                  className="px-4 py-2 text-sm font-medium border-2 rounded-2xl transition-colors"
                  style={{ borderColor: 'var(--btn-border)', color: 'var(--text-secondary)' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white rounded-2xl shadow-lg shadow-sky-500/30 disabled:opacity-50 transition-colors">
                  {loading ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gestionar compañías */}
      {modal.type === 'gestionar' && (
        <GestionarCompaniasModal
          companias={companias}
          onClose={() => setModal({ type: 'none' })}
          onChanged={updated => { setCompanias(updated); router.refresh(); }}
        />
      )}
      {confirmState && (
        <ConfirmDialog
          message={confirmState.msg}
          onConfirm={async () => { await confirmState.fn(); setConfirmState(null); }}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}

// ── Gestionar compañías ───────────────────────────────────────────────────────

const gestionInputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };

function GestionarCompaniasModal({ companias: init, onClose, onChanged }: {
  companias: Categoria[];
  onClose: () => void;
  onChanged: (cats: Categoria[]) => void;
}) {
  const [cats, setCats] = useState(init.map(c => ({ ...c })));
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#6366f1');
  const [confirmState, setConfirmState] = useState<{ msg: string; fn: () => Promise<void> } | null>(null);

  function startEdit(cat: Categoria) {
    setEditId(cat.id); setEditName(cat.nombre); setEditColor(cat.color);
  }

  async function saveEdit() {
    if (!editId) return;
    setSaving(true);
    const orig = cats.find(c => c.id === editId)!;
    await fetch(`/api/categorias/${editId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: editName, color: editColor, nombreAnterior: orig.nombre, tipo: 'agua' }),
    });
    const updated = cats.map(c => c.id === editId ? { ...c, nombre: editName, color: editColor } : c);
    setCats(updated); onChanged(updated);
    setEditId(null); setSaving(false);
  }

  async function addNew() {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch('/api/categorias', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'agua', nombre: newName.trim(), color: newColor }),
    });
    const { id } = await res.json();
    const updated = [...cats, { id, tipo: 'agua' as const, nombre: newName.trim(), color: newColor }];
    setCats(updated); onChanged(updated);
    setNewName(''); setNewColor('#6366f1'); setSaving(false);
  }

  async function del(cat: Categoria) {
    setConfirmState({ msg: `¿Eliminar "${cat.nombre}"?`, fn: async () => {
      await fetch(`/api/categorias/${cat.id}`, { method: 'DELETE' });
      const updated = cats.filter(c => c.id !== cat.id);
      setCats(updated); onChanged(updated);
    }});
  }

  return (
    <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-3xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <SettingsIcon className="w-4 h-4" /> Compañías de Agua
          </h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-lg hover:bg-black/10" style={{ color: 'var(--text-secondary)' }}>×</button>
        </div>

        <div className="px-6 space-y-2 max-h-64 overflow-y-auto">
          {cats.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin compañías aún</p>}
          {cats.map(cat => (
            <div key={cat.id} className="rounded-2xl p-3 space-y-2" style={{ border: '1px solid var(--divider)', background: 'var(--bg-page)' }}>
              {editId === cat.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: editColor, color: autoText(editColor) }}>{editName || '…'}</span>
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null); }}
                    className="flex-1 text-sm rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 border"
                    style={gestionInputStyle} autoFocus />
                  <CircularColorPicker value={editColor} onChange={setEditColor} />
                  <button onClick={saveEdit} disabled={saving || !editName.trim()}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                    {saving ? '…' : 'OK'}
                  </button>
                  <button onClick={() => setEditId(null)} className="px-2 py-1.5 rounded-xl text-xs font-medium border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)' }}>✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: cat.color, color: autoText(cat.color) }}>{cat.nombre}</span>
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cat.nombre}</span>
                  <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}><PencilIcon /></button>
                  <button onClick={() => del(cat)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 transition-colors"><TrashIcon /></button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 pt-4 pb-2">
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Añadir compañía</p>
          <div className="flex items-center gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNew()}
              placeholder="Nombre de la compañía…"
              className="flex-1 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 border"
              style={gestionInputStyle} />
            <CircularColorPicker value={newColor} onChange={setNewColor} />
            <button onClick={addNew} disabled={!newName.trim() || saving}
              className="px-4 py-2 text-sm font-bold text-white rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40">
              +
            </button>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4" style={{ borderTop: '1px solid var(--divider)', marginTop: '12px' }}>
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold border-2 rounded-2xl"
            style={{ borderColor: 'var(--btn-border)', color: 'var(--text-secondary)' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
    {confirmState && (
      <ConfirmDialog
        message={confirmState.msg}
        onConfirm={async () => { await confirmState.fn(); setConfirmState(null); }}
        onCancel={() => setConfirmState(null)}
      />
    )}
    </>
  );
}

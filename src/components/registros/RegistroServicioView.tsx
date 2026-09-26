'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Categoria } from '@/lib/db';
import { BoltIcon, DropletIcon, PencilIcon, SettingsIcon, TrashIcon } from '@/components/icons';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import Button, { IconButton } from '@/components/ui/Button';
import Section from '@/components/ui/Section';
import Modal from '@/components/ui/Modal';
import { EmptyState, useToast } from '@/components/ui/Feedback';
import { PALETA } from '@/components/gestion/GestionView';
import { useThemeVersion } from '@/lib/useThemeVersion';
import { formatEUR } from '@/lib/format';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler);

type Tipo = 'luz' | 'agua';

export interface RegistroServicio {
  id: number; anio: number; nombre: string; importe: number;
  kwh?: number | null; m3?: number | null; precio_kwh?: number | null;
  fecha_lectura_inicio: string | null; fecha_lectura_fin: string | null; fecha_cobro: string | null; compania: string | null;
}

const CFG = {
  luz: { titulo: 'Luz', unidad: 'kWh', campo: 'kwh' as const, umbral: 500, color: 'var(--color-warning)', Icon: BoltIcon, precio: true },
  agua: { titulo: 'Agua', unidad: 'm³', campo: 'm3' as const, umbral: 20, color: 'var(--color-info)', Icon: DropletIcon, precio: false },
};

const alpha = (hex: string, a: number) => {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
const num = (n: number | null | undefined, dec = 2) => (n == null ? null : n.toLocaleString('es-ES', { maximumFractionDigits: dec }));
const fecha = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso.split('T')[0] + 'T00:00:00');
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' });
};

function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}

function CompaniaChip({ tipo, nombre, companias }: { tipo: Tipo; nombre: string | null; companias: Categoria[] }) {
  if (!nombre) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const { Icon } = CFG[tipo];
  const c = companias.find(x => x.nombre === nombre);
  return <span className="fm-chip" style={c ? { ['--fm-c' as string]: c.color } : undefined}><Icon aria-hidden="true" /><span>{nombre}</span></span>;
}

function ConsumoBar({ valor, max, umbral, color }: { valor: number | null | undefined; max: number; umbral: number; color: string }) {
  if (valor == null) return null;
  const pct = Math.min((valor / Math.max(max, umbral)) * 100, 100);
  return (
    <div className="h-1.5 rounded-full overflow-hidden w-24" style={{ background: 'var(--divider)' }} aria-hidden="true">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: valor > umbral ? 'var(--money-out)' : color }} />
    </div>
  );
}

// ── Formulario de registro ──────────────────────────────────────────────────
function RegistroModal({ tipo, item, companias, onClose, onSaved }: { tipo: Tipo; item: RegistroServicio | null; companias: Categoria[]; onClose: () => void; onSaved: () => void }) {
  const cfg = CFG[tipo];
  const [saving, setSaving] = useState(false);
  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const n = (k: string) => (fd.get(k) ? parseFloat(fd.get(k) as string) : null);
    const body: Record<string, unknown> = {
      anio: parseInt(fd.get('anio') as string), nombre: fd.get('nombre'), importe: n('importe') ?? 0,
      [cfg.campo]: n(cfg.campo), fecha_lectura_inicio: fd.get('fecha_lectura_inicio') || null, fecha_lectura_fin: fd.get('fecha_lectura_fin') || null,
      fecha_cobro: fd.get('fecha_cobro') || null, compania: fd.get('compania') || null,
      ...(cfg.precio ? { precio_kwh: n('precio_kwh') } : {}),
    };
    await fetch(item ? `/api/registros/${tipo}/${item.id}` : `/api/registros/${tipo}`, {
      method: item ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    onSaved();
  }
  const campo = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div><label htmlFor={`r-${name}`} className="fm-label">{label}</label><input id={`r-${name}`} name={name} className="fm-input" {...props} /></div>
  );
  return (
    <Modal title={`${item ? 'Editar' : 'Nuevo'} registro de ${cfg.titulo.toLowerCase()}`} onClose={onClose} width="520px"
      footer={<>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" type="submit" form="form-registro" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </>}>
      <form id="form-registro" onSubmit={guardar} className="grid grid-cols-2 gap-3">
        {campo('nombre', 'Periodo', { required: true, defaultValue: item?.nombre ?? '', placeholder: 'Ej: Enero' })}
        {campo('anio', 'Año', { type: 'number', inputMode: 'numeric', defaultValue: item?.anio ?? new Date().getFullYear() })}
        {campo('importe', 'Importe (€)', { type: 'number', step: '0.01', inputMode: 'decimal', defaultValue: item?.importe ?? '' })}
        {campo(cfg.campo, `Consumo (${cfg.unidad})`, { type: 'number', step: '0.01', inputMode: 'decimal', defaultValue: item?.[cfg.campo] ?? '' })}
        {campo('fecha_lectura_inicio', 'Lectura desde', { type: 'date', defaultValue: item?.fecha_lectura_inicio?.split('T')[0] ?? '' })}
        {campo('fecha_lectura_fin', 'Lectura hasta', { type: 'date', defaultValue: item?.fecha_lectura_fin?.split('T')[0] ?? '' })}
        {campo('fecha_cobro', 'Fecha de cobro', { type: 'date', defaultValue: item?.fecha_cobro?.split('T')[0] ?? '' })}
        {cfg.precio
          ? campo('precio_kwh', 'Precio €/kWh', { type: 'number', step: '0.0001', inputMode: 'decimal', defaultValue: item?.precio_kwh ?? '' })
          : <span />}
        <div className="col-span-2">
          <label htmlFor="r-compania" className="fm-label">Compañía</label>
          <select id="r-compania" name="compania" className="fm-input" defaultValue={item?.compania ?? ''}>
            <option value="">Sin compañía</option>
            {companias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
        </div>
      </form>
    </Modal>
  );
}

// ── Compañías ───────────────────────────────────────────────────────────────
function CompaniasModal({ tipo, companias: init, onClose, onChanged }: { tipo: Tipo; companias: Categoria[]; onClose: () => void; onChanged: (c: Categoria[]) => void }) {
  const cfg = CFG[tipo];
  const toast = useToast();
  const [cats, setCats] = useState(init);
  const [form, setForm] = useState<{ id?: number; nombre: string; color: string; original?: string }>({ nombre: '', color: PALETA[0] });
  const [saving, setSaving] = useState(false);
  const [borrar, setBorrar] = useState<Categoria | null>(null);

  function actualizar(next: Categoria[]) { setCats(next); onChanged(next); }

  async function guardar() {
    if (!form.nombre.trim()) return;
    setSaving(true);
    const nombre = form.nombre.trim();
    if (form.id) {
      await fetch(`/api/categorias/${form.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre, color: form.color, nombreAnterior: form.original, tipo }) });
      actualizar(cats.map(c => (c.id === form.id ? { ...c, nombre, color: form.color } : c)));
    } else {
      const res = await fetch('/api/categorias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo, nombre, color: form.color }) });
      const { id } = await res.json();
      actualizar([...cats, { id, tipo, nombre, color: form.color } as Categoria]);
    }
    setSaving(false);
    setForm({ nombre: '', color: PALETA[0] });
    toast('Compañía guardada');
  }

  async function eliminar(c: Categoria) {
    await fetch(`/api/categorias/${c.id}`, { method: 'DELETE' });
    actualizar(cats.filter(x => x.id !== c.id));
    setBorrar(null);
    toast('Compañía eliminada');
  }

  return (
    <>
      <Modal title={`Compañías de ${cfg.titulo.toLowerCase()}`} onClose={onClose} footer={<Button onClick={onClose}>Cerrar</Button>}>
        {cats.length === 0 ? (
          <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>Aún no hay compañías.</p>
        ) : (
          <ul className="fm-card overflow-hidden mb-4">
            {cats.map(c => (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2" style={{ borderBottom: '1px solid var(--divider)' }}>
                <span className="fm-caticon !w-9 !h-9" style={{ ['--fm-c' as string]: c.color }} aria-hidden="true"><cfg.Icon /></span>
                <span className="flex-1 font-medium truncate">{c.nombre}</span>
                <IconButton label={`Editar ${c.nombre}`} onClick={() => setForm({ id: c.id, nombre: c.nombre, color: c.color, original: c.nombre })}><PencilIcon /></IconButton>
                <IconButton label={`Eliminar ${c.nombre}`} onClick={() => setBorrar(c)} className="hover:!text-money-out"><TrashIcon /></IconButton>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={e => { e.preventDefault(); guardar(); }} className="rounded-[var(--radius-control)] p-3" style={{ background: 'var(--row-hover)' }}>
          <label htmlFor="comp-nombre" className="fm-label">{form.id ? 'Editar compañía' : 'Añadir compañía'}</label>
          <div className="flex gap-2 mb-3">
            <input id="comp-nombre" className="fm-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre de la compañía" />
            <Button variant="primary" type="submit" disabled={saving || !form.nombre.trim()}>{form.id ? 'Guardar' : 'Añadir'}</Button>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Color">
            {PALETA.map(col => (
              <button key={col} type="button" aria-pressed={form.color === col} aria-label={`Color ${col}`} onClick={() => setForm({ ...form, color: col })}
                className="w-7 h-7 rounded-full cursor-pointer" style={{ background: col, border: '2px solid var(--bg-card)', boxShadow: form.color === col ? '0 0 0 2px var(--text-primary)' : '0 0 0 1px var(--btn-border)' }} />
            ))}
          </div>
          {form.id && <Button size="sm" variant="ghost" className="mt-2" onClick={() => setForm({ nombre: '', color: PALETA[0] })}>Cancelar edición</Button>}
        </form>
      </Modal>
      {borrar && <ConfirmDialog message={`¿Eliminar «${borrar.nombre}»?`} onConfirm={() => eliminar(borrar)} onCancel={() => setBorrar(null)} />}
    </>
  );
}

// ── Vista del servicio ──────────────────────────────────────────────────────
export default function RegistroServicioView({ tipo, registros: init, companias: initCompanias, canEdit = true }: {
  tipo: Tipo; registros: RegistroServicio[]; companias: Categoria[]; canEdit?: boolean;
}) {
  const cfg = CFG[tipo];
  const router = useRouter();
  const toast = useToast();
  useThemeVersion(); // vuelve a leer los colores del tema para las gráficas
  const [registros, setRegistros] = useState(init);
  const [companias, setCompanias] = useState(initCompanias);
  const [anioSel, setAnioSel] = useState<number | null>(null);
  const [modal, setModal] = useState<{ tipo: 'form'; item: RegistroServicio | null } | { tipo: 'companias' } | null>(null);
  const [borrar, setBorrar] = useState<RegistroServicio | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- sincroniza con los datos del servidor tras router.refresh() */
  useEffect(() => { setRegistros(init); }, [init]);
  useEffect(() => { setCompanias(initCompanias); }, [initCompanias]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const porAnio = registros.reduce((acc, r) => { (acc[r.anio] ??= []).push(r); return acc; }, {} as Record<number, RegistroServicio[]>);
  const anios = Object.keys(porAnio).map(Number).sort((a, b) => b - a);
  const anio = anioSel ?? anios[0] ?? null;
  const filas = anio != null ? porAnio[anio] ?? [] : [];
  const total = filas.reduce((s, r) => s + (r.importe ?? 0), 0);
  const consumoTotal = filas.reduce((s, r) => s + (r[cfg.campo] ?? 0), 0);
  const maxConsumo = Math.max(...filas.map(r => r[cfg.campo] ?? 0), cfg.umbral);

  const cs = typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null;
  const v = (name: string, def: string) => cs?.getPropertyValue(name).trim() || def;
  const acento = v(tipo === 'luz' ? '--color-warning' : '--color-info', '#9a6212');
  const grid = v('--divider', '#eceff3');
  const tick = v('--text-muted', '#5f6b7a');

  async function eliminar(r: RegistroServicio) {
    await fetch(`/api/registros/${tipo}/${r.id}`, { method: 'DELETE' });
    setRegistros(prev => prev.filter(x => x.id !== r.id));
    setBorrar(null);
    toast('Registro eliminado');
  }

  return (
    <Section id={`sec-${tipo}`} title={cfg.titulo} count={filas.length} total={formatEUR(total)} tone="neutral" color={cfg.color}
      actions={<>
        {anios.length > 0 && (
          <>
            <label className="sr-only" htmlFor={`anio-${tipo}`}>Año</label>
            <select id={`anio-${tipo}`} className="fm-input !w-auto !min-h-9 !py-1" value={anio ?? ''} onChange={e => setAnioSel(Number(e.target.value))}>
              {anios.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </>
        )}
        {canEdit && <IconButton label="Gestionar compañías" onClick={() => setModal({ tipo: 'companias' })}><SettingsIcon className="w-4 h-4" /></IconButton>}
        {canEdit && <Button size="sm" icon={<PlusIcon />} onClick={() => setModal({ tipo: 'form', item: null })} compactOnMobile>Añadir</Button>}
      </>}>
      {filas.length === 0 ? (
        <EmptyState icon={<cfg.Icon />} title={`Sin registros de ${cfg.titulo.toLowerCase()}`}
          text="Añade primero la compañía y después cada factura o lectura para ver la evolución del gasto y del consumo."
          action={canEdit ? <Button variant="primary" icon={<PlusIcon />} onClick={() => setModal({ tipo: 'form', item: null })}>Añadir registro</Button> : undefined} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5 px-4 sm:px-5 py-4" style={{ borderBottom: '1px solid var(--border-card)' }}>
            <div>
              <p className="text-[13px] mb-1" style={{ color: 'var(--text-muted)' }}>Importe · {formatEUR(total)} en {anio}</p>
              <div style={{ height: 150 }}>
                <Line
                  data={{ labels: filas.map(r => r.nombre), datasets: [{ data: filas.map(r => r.importe ?? 0), borderColor: acento, backgroundColor: alpha(acento, 0.1), fill: true, tension: 0.35, pointBackgroundColor: acento, pointRadius: 3, pointHoverRadius: 5 }] }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => formatEUR(ctx.parsed.y ?? 0) } } },
                    scales: { x: { grid: { display: false }, ticks: { color: tick, font: { size: 11 } } }, y: { grid: { color: grid }, ticks: { color: tick, font: { size: 11 }, callback: val => `${Number(val).toLocaleString('es-ES', { maximumFractionDigits: 0 })} €` } } },
                  }}
                />
              </div>
            </div>
            <div>
              <p className="text-[13px] mb-1" style={{ color: 'var(--text-muted)' }}>Consumo · {num(consumoTotal)} {cfg.unidad} en {anio}</p>
              <div style={{ height: 150 }}>
                <Bar
                  data={{ labels: filas.map(r => r.nombre), datasets: [{ data: filas.map(r => r[cfg.campo] ?? 0), backgroundColor: filas.map(r => ((r[cfg.campo] ?? 0) > cfg.umbral ? v('--money-out', '#b3412e') : acento)), borderRadius: 3, barPercentage: 0.6 }] }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${num(ctx.parsed.y ?? 0)} ${cfg.unidad}` } } },
                    scales: { x: { grid: { display: false }, ticks: { color: tick, font: { size: 11 } } }, y: { beginAtZero: true, grid: { color: grid }, ticks: { color: tick, font: { size: 11 } } } },
                  }}
                />
              </div>
            </div>
          </div>

          <table className="fm-table">
            <thead>
              <tr>
                <th>Periodo</th>
                <th className="fm-num">Consumo</th>
                <th aria-label="Nivel de consumo" />
                <th>Lectura</th>
                <th>Cobro</th>
                {cfg.precio && <th className="fm-num">€/kWh</th>}
                <th>Compañía</th>
                <th className="fm-num">Importe</th>
                {canEdit && <th style={{ width: 96 }} aria-label="Acciones" />}
              </tr>
            </thead>
            <tbody>
              {filas.map(r => (
                <tr key={r.id}>
                  <td className="font-medium">{r.nombre}</td>
                  <td className="fm-num" style={{ color: 'var(--text-secondary)' }}>{r[cfg.campo] != null ? `${num(r[cfg.campo])} ${cfg.unidad}` : '—'}</td>
                  <td><ConsumoBar valor={r[cfg.campo]} max={maxConsumo} umbral={cfg.umbral} color={acento} /></td>
                  <td className="whitespace-nowrap text-[14px]" style={{ color: 'var(--text-muted)' }}>
                    {r.fecha_lectura_inicio || r.fecha_lectura_fin ? `${fecha(r.fecha_lectura_inicio)} – ${fecha(r.fecha_lectura_fin)}` : '—'}
                  </td>
                  <td className="whitespace-nowrap text-[14px]" style={{ color: 'var(--text-muted)' }}>{fecha(r.fecha_cobro)}</td>
                  {cfg.precio && <td className="fm-num" style={{ color: 'var(--text-secondary)' }}>{r.precio_kwh != null ? r.precio_kwh.toLocaleString('es-ES', { minimumFractionDigits: 3, maximumFractionDigits: 4 }) : '—'}</td>}
                  <td><CompaniaChip tipo={tipo} nombre={r.compania} companias={companias} /></td>
                  <td className="fm-num font-medium">{formatEUR(r.importe)}</td>
                  {canEdit && (
                    <td>
                      <div className="fm-row-actions">
                        <IconButton label={`Editar ${r.nombre}`} onClick={() => setModal({ tipo: 'form', item: r })}><PencilIcon /></IconButton>
                        <IconButton label={`Eliminar ${r.nombre}`} onClick={() => setBorrar(r)} className="hover:!text-money-out"><TrashIcon /></IconButton>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="fm-list">
            {filas.map(r => {
              const c = companias.find(x => x.nombre === r.compania);
              const contenido = (
                <>
                  <span className="fm-caticon" style={{ ['--fm-c' as string]: c?.color ?? acento }} aria-hidden="true"><cfg.Icon /></span>
                  <span className="fm-list-body">
                    <span className="fm-list-title">{r.nombre}</span>
                    <span className="fm-list-meta">
                      {r[cfg.campo] != null && <span>{num(r[cfg.campo])} {cfg.unidad}</span>}
                      {r.fecha_cobro && <span>{fecha(r.fecha_cobro)}</span>}
                      {r.compania && <span>{r.compania}</span>}
                    </span>
                  </span>
                  <span className="fm-list-amount">{formatEUR(r.importe)}</span>
                </>
              );
              return (
                <li key={r.id}>
                  {canEdit
                    ? <button type="button" className="fm-list-item" onClick={() => setModal({ tipo: 'form', item: r })} aria-label={`${r.nombre}, ${formatEUR(r.importe)}. Editar`}>{contenido}</button>
                    : <div className="fm-list-item">{contenido}</div>}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {modal?.tipo === 'form' && (
        <RegistroModal tipo={tipo} item={modal.item} companias={companias} onClose={() => setModal(null)}
          onSaved={() => { setModal(null); toast('Registro guardado'); router.refresh(); }} />
      )}
      {modal?.tipo === 'companias' && (
        <CompaniasModal tipo={tipo} companias={companias} onClose={() => setModal(null)} onChanged={c => { setCompanias(c); router.refresh(); }} />
      )}
      {borrar && <ConfirmDialog message={`¿Eliminar el registro «${borrar.nombre}»?`} onConfirm={() => eliminar(borrar)} onCancel={() => setBorrar(null)} />}
    </Section>
  );
}

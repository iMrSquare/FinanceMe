'use client';

import { useCallback, useEffect, useState } from 'react';
import { BackToModulos } from '@/components/modulos/ModulosHub';
import InfoExpand from '@/components/InfoExpand';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { MonthYearInput } from '@/components/MonthYearInput';
import { PencilIcon, PiggyIcon, TrashIcon } from '@/components/icons';
import Button, { IconButton } from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';
import Summary from '@/components/ui/Summary';
import Section from '@/components/ui/Section';
import Modal from '@/components/ui/Modal';
import Segmented from '@/components/ui/Segmented';
import { EmptyState, SkeletonRows, useToast } from '@/components/ui/Feedback';
import { esMensual, objetivoMensualAhorro, type ModoAhorro } from '@/lib/ahorro';
import { estadoObjetivo, fmtMesAnio, mensualNecesario, type EstadoObjetivo } from '@/lib/ahorroObjetivos';
import { formatEUR } from '@/lib/format';

type Scope = 'personal' | 'hogar';
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface AhorroMes { id: number; mes: number; aportado: number }
interface Ahorro { objetivo_anual: number; modo?: ModoAhorro; meses: AhorroMes[] }
interface Objetivo { id: number; nombre: string; objetivo: number; aportado: number; fecha_objetivo: string; emoji: string | null }

const api = (scope: Scope) => (scope === 'personal' ? '/api/personal/ahorro' : '/api/ahorro');
const tono = (n: number) => (n > 0 ? 'var(--saving)' : n < 0 ? 'var(--money-out)' : 'var(--text-muted)');

function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}
function MinusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>;
}

function Barra({ pct }: { pct: number }) {
  const v = Math.min(Math.max(pct, 0), 100);
  return (
    // <span> en bloque: la barra también se pinta dentro del <p> de la nota del resumen
    <span className="block h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <span className="block h-full rounded-full transition-[width] duration-300" style={{ width: `${v}%`, background: 'var(--saving)' }} />
    </span>
  );
}

function Estado({ texto, tone }: { texto: string; tone: 'ok' | 'parcial' | 'mal' | 'neutro' }) {
  const color = tone === 'ok' ? 'var(--money-in)' : tone === 'parcial' ? 'var(--saving)' : tone === 'mal' ? 'var(--money-out)' : 'var(--text-muted)';
  return <span className="inline-flex px-2 py-px rounded-full text-xs font-medium whitespace-nowrap" style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>{texto}</span>;
}

// Modal con un único campo de importe
function ImporteModal({ titulo, etiqueta, inicial, permitirNegativo, onClose, onSave, ayuda }: {
  titulo: string; etiqueta: string; inicial: string; permitirNegativo?: boolean; ayuda?: string;
  onClose: () => void; onSave: (n: number) => Promise<void>;
}) {
  const [valor, setValor] = useState(inicial);
  const [saving, setSaving] = useState(false);
  const num = parseFloat(valor);
  const valido = !isNaN(num) && (permitirNegativo || num >= 0);
  async function guardar() {
    if (!valido) return;
    setSaving(true);
    await onSave(num);
  }
  return (
    <Modal title={titulo} onClose={onClose} width="400px"
      footer={<>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={guardar} disabled={saving || !valido}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </>}>
      <form onSubmit={e => { e.preventDefault(); guardar(); }}>
        <label htmlFor="imp-valor" className="fm-label">{etiqueta}</label>
        <input id="imp-valor" className="fm-input" type="number" step="0.01" inputMode="decimal" min={permitirNegativo ? undefined : 0} value={valor} onChange={e => setValor(e.target.value)} />
        {ayuda && <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{ayuda}</p>}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

// Modal del objetivo: anual (cuota recalculada) o mensual (cuota fija)
function ObjetivoAhorroModal({ year, inicial, onClose, onSave }: {
  year: number; inicial: Ahorro; onClose: () => void; onSave: (objetivoAnual: number, modo: ModoAhorro) => Promise<void>;
}) {
  const [modo, setModo] = useState<ModoAhorro>(esMensual(inicial) ? 'mensual' : 'anual');
  const importeInicial = (m: ModoAhorro) => {
    if (inicial.objetivo_anual <= 0) return '';
    const n = m === 'mensual' ? inicial.objetivo_anual / 12 : inicial.objetivo_anual;
    return String(Math.round(n * 100) / 100);
  };
  const [valor, setValor] = useState(importeInicial(modo));
  const [saving, setSaving] = useState(false);
  const num = parseFloat(valor);
  const valido = !isNaN(num) && num >= 0;
  const mensual = modo === 'mensual';

  function cambiarModo(m: ModoAhorro) {
    if (m === modo) return;
    // Convierte lo escrito para que el objetivo equivalga al mismo total del año
    setValor(valido ? String(Math.round((m === 'mensual' ? num / 12 : num * 12) * 100) / 100) : importeInicial(m));
    setModo(m);
  }
  async function guardar() {
    if (!valido) return;
    setSaving(true);
    await onSave(mensual ? num * 12 : num, modo);
  }
  return (
    <Modal title={`Objetivo de ahorro ${year}`} onClose={onClose} width="400px"
      footer={<>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={guardar} disabled={saving || !valido}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </>}>
      <form onSubmit={e => { e.preventDefault(); guardar(); }}>
        <span className="fm-label">Tipo de objetivo</span>
        <Segmented<ModoAhorro> options={[{ id: 'anual', label: 'Anual' }, { id: 'mensual', label: 'Mensual' }]} value={modo} onChange={cambiarModo} />
        <label htmlFor="obj-ahorro-valor" className="fm-label mt-3.5">{mensual ? 'Objetivo mensual (€)' : 'Objetivo anual (€)'}</label>
        <input id="obj-ahorro-valor" className="fm-input" type="number" step="0.01" inputMode="decimal" min={0} value={valor} onChange={e => setValor(e.target.value)} />
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
          {mensual
            ? `La misma cantidad todos los meses${valido && num > 0 ? ` (${formatEUR(num * 12)} al año)` : ''}.`
            : 'La cuota mensual se recalcula según lo que llevas ahorrado.'}
        </p>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

// ── Objetivo anual ──────────────────────────────────────────────────────────
function Anual({ scope, canEdit }: { scope: Scope; canEdit: boolean }) {
  const toast = useToast();
  const [year, setYear] = useState(new Date().getFullYear());
  const [ahorro, setAhorro] = useState<Ahorro | null>(null);
  const [editObjetivo, setEditObjetivo] = useState(false);
  const [editMes, setEditMes] = useState<number | null>(null);

  const cargar = useCallback((y: number) => fetch(`${api(scope)}?year=${y}`).then(r => r.json()).then(d => setAhorro(d)).catch(() => setAhorro({ objetivo_anual: 0, meses: [] })), [scope]);
  useEffect(() => { cargar(year); }, [year, cargar]);

  const meses = ahorro?.meses ?? [];
  const objetivoAnual = ahorro?.objetivo_anual ?? 0;
  const hayObjetivo = objetivoAnual > 0;
  const mensual = !!ahorro && esMensual(ahorro);
  const base = hayObjetivo ? objetivoAnual / 12 : 0;
  const total = meses.reduce((s, m) => s + m.aportado, 0);
  const pct = hayObjetivo ? (total / objetivoAnual) * 100 : 0;
  const hoy = new Date();
  const esEsteAnio = year === hoy.getFullYear();
  const cuota = objetivoMensualAhorro({ objetivo_anual: objetivoAnual, meses, modo: ahorro?.modo }, year);

  async function guardarObjetivo(n: number, modo: ModoAhorro) {
    await fetch(api(scope), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year, objetivoAnual: n, modo }) });
    setEditObjetivo(false); toast('Objetivo actualizado'); cargar(year);
  }
  async function guardarMes(i: number, n: number) {
    await fetch(`${api(scope)}/mes`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year, mes: i + 1, aportado: n }) });
    setEditMes(null); toast('Aportación guardada'); cargar(year);
  }

  const filas = meses.map((m, i) => {
    const futuro = year > hoy.getFullYear() || (esEsteAnio && i > hoy.getMonth());
    const actual = esEsteAnio && i === hoy.getMonth();
    // Los meses pasados conservan el objetivo original; el actual y los futuros, la cuota recalculada
    const objetivo = esEsteAnio && i >= hoy.getMonth() ? cuota : base;
    const mostrar = !(futuro && m.aportado === 0);
    const diff = m.aportado - objetivo;
    const estado = !hayObjetivo || !mostrar ? null
      : m.aportado < 0 ? { t: 'Retirada', tone: 'mal' as const }
      : m.aportado === 0 ? { t: 'Sin aportar', tone: 'mal' as const }
      : m.aportado >= objetivo ? { t: 'Cumplido', tone: 'ok' as const }
      : { t: 'Parcial', tone: 'parcial' as const };
    return { m, i, actual, objetivo, mostrar, diff, estado };
  });

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1" role="group" aria-label="Año">
          <IconButton label="Año anterior" onClick={() => setYear(y => y - 1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg></IconButton>
          <span className="w-16 text-center text-lg font-semibold" aria-live="polite">{year}</span>
          <IconButton label="Año siguiente" onClick={() => setYear(y => y + 1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></IconButton>
        </div>
        {canEdit && <Button size="sm" icon={<PencilIcon />} onClick={() => setEditObjetivo(true)}>{hayObjetivo ? 'Editar objetivo' : 'Fijar objetivo'}</Button>}
      </div>

      <Summary
        label={`Ahorrado en ${year}`}
        value={formatEUR(total)}
        tone={total < 0 ? 'out' : 'saving'}
        note={hayObjetivo ? (
          <span className="block">
            <span className="block mb-1.5">{pct.toFixed(0)} % del objetivo de {formatEUR(objetivoAnual)}</span>
            <Barra pct={pct} />
          </span>
        ) : 'Aún no hay objetivo anual para este año'}
        stats={[
          mensual
            ? { label: 'Objetivo mensual', value: formatEUR(base), sub: `${formatEUR(objetivoAnual)} al año` }
            : { label: 'Objetivo anual', value: hayObjetivo ? formatEUR(objetivoAnual) : '—', sub: hayObjetivo ? `${formatEUR(base)} al mes` : 'sin fijar' },
          { label: 'Cuota mensual', value: hayObjetivo ? formatEUR(cuota) : '—', tone: 'saving', sub: mensual ? 'fija todos los meses' : esEsteAnio ? 'recalculada según lo ahorrado' : 'objetivo ÷ 12' },
          { label: 'Pendiente', value: hayObjetivo ? formatEUR(Math.max(objetivoAnual - total, 0)) : '—', sub: 'para cumplir el objetivo' },
        ]}
      />

      <Section id="sec-ahorro-meses" title="Desglose mensual" total={formatEUR(total)} tone="saving">
        {ahorro === null ? <SkeletonRows rows={6} /> : (
          <>
            <table className="fm-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th className="fm-num">Objetivo</th>
                  <th className="fm-num">Aportado</th>
                  <th className="fm-num">Diferencia</th>
                  <th>Estado</th>
                  {canEdit && <th style={{ width: 64 }} aria-label="Acciones" />}
                </tr>
              </thead>
              <tbody>
                {filas.map(f => (
                  <tr key={f.m.id} style={f.actual ? { background: 'var(--row-hover)' } : undefined}>
                    <td>
                      <span className="font-medium">{MESES[f.i]}</span>
                      {f.actual && <span className="ml-2 text-xs font-medium" style={{ color: 'var(--accent-mode)' }}>Mes actual</span>}
                    </td>
                    <td className="fm-num" style={{ color: 'var(--text-muted)' }}>{hayObjetivo ? formatEUR(f.objetivo) : '—'}</td>
                    <td className="fm-num font-medium" style={{ color: f.mostrar ? tono(f.m.aportado) : 'var(--text-muted)' }}>{f.mostrar ? formatEUR(f.m.aportado) : '—'}</td>
                    <td className="fm-num" style={{ color: hayObjetivo && f.mostrar ? (f.diff >= 0 ? 'var(--money-in)' : 'var(--money-out)') : 'var(--text-muted)' }}>
                      {hayObjetivo && f.mostrar ? formatEUR(f.diff, { signo: true }) : '—'}
                    </td>
                    <td>{f.estado ? <Estado texto={f.estado.t} tone={f.estado.tone} /> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    {canEdit && <td><div className="fm-row-actions"><IconButton label={`Editar aportación de ${MESES[f.i]}`} onClick={() => setEditMes(f.i)}><PencilIcon /></IconButton></div></td>}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '1px solid var(--border-card)' }}>
                  <td className="font-semibold">Total</td>
                  <td className="fm-num font-semibold">{hayObjetivo ? formatEUR(objetivoAnual) : '—'}</td>
                  <td className="fm-num font-semibold" style={{ color: tono(total) }}>{formatEUR(total)}</td>
                  <td className="fm-num font-semibold" style={{ color: hayObjetivo ? (total - objetivoAnual >= 0 ? 'var(--money-in)' : 'var(--money-out)') : 'var(--text-muted)' }}>
                    {hayObjetivo ? formatEUR(total - objetivoAnual, { signo: true }) : '—'}
                  </td>
                  <td>{hayObjetivo && <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{pct.toFixed(0)} %</span>}</td>
                  {canEdit && <td />}
                </tr>
              </tfoot>
            </table>
            <ul className="fm-list">
              {filas.map(f => {
                const contenido = (
                  <>
                    <span className="fm-list-body">
                      <span className="fm-list-title">{MESES[f.i]}{f.actual && <span className="ml-2 text-xs font-medium" style={{ color: 'var(--accent-mode)' }}>Mes actual</span>}</span>
                      <span className="fm-list-meta">
                        {hayObjetivo && <span>Objetivo {formatEUR(f.objetivo)}</span>}
                        {f.estado && <span>{f.estado.t}</span>}
                      </span>
                    </span>
                    <span className="fm-list-amount" style={{ color: f.mostrar ? tono(f.m.aportado) : 'var(--text-muted)' }}>{f.mostrar ? formatEUR(f.m.aportado) : '—'}</span>
                  </>
                );
                return (
                  <li key={f.m.id}>
                    {canEdit
                      ? <button type="button" className="fm-list-item" onClick={() => setEditMes(f.i)} aria-label={`${MESES[f.i]}: ${formatEUR(f.m.aportado)}. Editar aportación`}>{contenido}</button>
                      : <div className="fm-list-item">{contenido}</div>}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Section>

      {editObjetivo && (
        <ObjetivoAhorroModal year={year} inicial={ahorro ?? { objetivo_anual: 0, meses: [] }} onClose={() => setEditObjetivo(false)} onSave={guardarObjetivo} />
      )}
      {editMes !== null && (
        <ImporteModal titulo={`Aportación de ${MESES[editMes].toLowerCase()}`} etiqueta="Importe aportado (€)" permitirNegativo
          inicial={String(meses[editMes]?.aportado ?? 0)} ayuda="Admite 0 y valores negativos si retiraste dinero."
          onClose={() => setEditMes(null)} onSave={n => guardarMes(editMes, n)} />
      )}
    </>
  );
}

// ── Objetivos concretos ─────────────────────────────────────────────────────
const ESTADO: Record<EstadoObjetivo, { t: string; tone: 'ok' | 'mal' | 'neutro' }> = {
  completado: { t: 'Completado', tone: 'ok' }, vencido: { t: 'Vencido', tone: 'mal' }, en_progreso: { t: 'En curso', tone: 'neutro' },
};
const EMOJI_PRESETS = ['🎯', '🏖️', '🎮', '🚗', '🏠', '💻', '📱', '🎁', '💍', '👶', '🎓', '❤️', '⚽', '✈️', '🐶', '💰'];

interface ObjForm { id?: number; nombre: string; objetivo: string; fecha_objetivo: string; emoji: string }

function ObjetivoModal({ form, setForm, onClose, onSave, saving }: { form: ObjForm; setForm: (f: ObjForm) => void; onClose: () => void; onSave: () => void; saving: boolean }) {
  const valido = form.nombre.trim() && form.objetivo && form.fecha_objetivo;
  return (
    <Modal title={form.id ? 'Editar objetivo' : 'Nuevo objetivo'} onClose={onClose}
      footer={<>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={onSave} disabled={saving || !valido}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </>}>
      <form onSubmit={e => { e.preventDefault(); if (valido) onSave(); }}>
        <fieldset className="mb-3.5">
          <legend className="fm-label">Emoji (opcional)</legend>
          <div className="flex flex-wrap gap-1">
            {EMOJI_PRESETS.map(e => (
              <button key={e} type="button" onClick={() => setForm({ ...form, emoji: form.emoji === e ? '' : e })} aria-pressed={form.emoji === e} aria-label={`Emoji ${e}`}
                className="w-10 h-10 rounded-[var(--radius-control)] text-xl grid place-items-center cursor-pointer transition-colors"
                style={{ background: form.emoji === e ? 'color-mix(in srgb, var(--accent-mode) 14%, transparent)' : 'transparent', outline: form.emoji === e ? '2px solid var(--accent-mode)' : undefined }}>
                {e}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="mb-3.5">
          <label htmlFor="obj-nombre" className="fm-label">Nombre</label>
          <input id="obj-nombre" className="fm-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Vacaciones" />
        </div>
        <div className="mb-3.5">
          <label htmlFor="obj-importe" className="fm-label">Importe objetivo (€)</label>
          <input id="obj-importe" className="fm-input" type="number" step="0.01" min="0" inputMode="decimal" value={form.objetivo} onChange={e => setForm({ ...form, objetivo: e.target.value })} placeholder="0,00" />
        </div>
        <div>
          <span className="fm-label">Fecha objetivo</span>
          <MonthYearInput value={form.fecha_objetivo} onChange={v => setForm({ ...form, fecha_objetivo: v })} className="fm-input" ariaLabel="Fecha objetivo" />
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

function Objetivos({ scope, canEdit }: { scope: Scope; canEdit: boolean }) {
  const toast = useToast();
  const base = `${api(scope)}/objetivos`;
  const [items, setItems] = useState<Objetivo[] | null>(null);
  const [form, setForm] = useState<ObjForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [borrar, setBorrar] = useState<Objetivo | null>(null);
  const [mover, setMover] = useState<{ o: Objetivo; signo: 1 | -1 } | null>(null);
  const [verCompletados, setVerCompletados] = useState(false);

  const cargar = useCallback(() => fetch(base).then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([])), [base]);
  useEffect(() => { cargar(); }, [cargar]);

  async function guardar() {
    if (!form) return;
    setSaving(true);
    const body = { nombre: form.nombre.trim(), objetivo: Number(form.objetivo), fecha_objetivo: form.fecha_objetivo, emoji: form.emoji || null };
    const res = await fetch(form.id ? `${base}/${form.id}` : base, { method: form.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    if (!res.ok) { toast('No se pudo guardar el objetivo', 'error'); return; }
    setForm(null); toast('Objetivo guardado'); cargar();
  }
  async function moverDinero(o: Objetivo, delta: number) {
    await fetch(`${base}/${o.id}/aportado`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aportado: o.aportado + delta }) });
    setMover(null); toast(delta >= 0 ? 'Dinero añadido' : 'Dinero retirado'); cargar();
  }
  async function eliminar(o: Objetivo) {
    await fetch(`${base}/${o.id}`, { method: 'DELETE' });
    setBorrar(null); toast('Objetivo eliminado'); cargar();
  }

  const lista = items ?? [];
  const completados = lista.filter(o => estadoObjetivo(o) === 'completado').length;
  const visibles = lista.filter(o => verCompletados || estadoObjetivo(o) !== 'completado');
  const totalAportado = lista.reduce((s, o) => s + o.aportado, 0);
  const totalObjetivo = lista.reduce((s, o) => s + o.objetivo, 0);
  const mensualTotal = lista.reduce((s, o) => s + (mensualNecesario(o) ?? 0), 0);
  const nuevo = () => setForm({ nombre: '', objetivo: '', fecha_objetivo: '', emoji: '' });

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        {completados > 0 ? (
          <Button size="sm" variant="ghost" onClick={() => setVerCompletados(v => !v)}>{verCompletados ? 'Ocultar completados' : `Ver completados (${completados})`}</Button>
        ) : <span />}
        {canEdit && <Button size="sm" variant="primary" icon={<PlusIcon />} onClick={nuevo}>Nuevo objetivo</Button>}
      </div>

      {lista.length > 0 && (
        <Summary label="Ahorrado en objetivos" value={formatEUR(totalAportado)} tone="saving"
          note={totalObjetivo > 0 ? <span className="block"><span className="block mb-1.5">{Math.round((totalAportado / totalObjetivo) * 100)} % de {formatEUR(totalObjetivo)}</span><Barra pct={(totalAportado / totalObjetivo) * 100} /></span> : undefined}
          stats={[
            { label: 'Objetivos', value: String(lista.length), sub: `${completados} completado${completados !== 1 ? 's' : ''}` },
            { label: 'Aportación mensual', value: formatEUR(mensualTotal), tone: 'saving', sub: 'para cumplirlos a tiempo' },
          ]} />
      )}

      {items === null ? <div className="fm-card"><SkeletonRows rows={3} /></div> : lista.length === 0 ? (
        <div className="fm-card">
          <EmptyState icon={<PiggyIcon />} title="Aún no hay objetivos de ahorro"
            text="Define una meta (unas vacaciones, un coche…), una fecha y ve registrando lo que aportas."
            action={canEdit ? <Button variant="primary" icon={<PlusIcon />} onClick={nuevo}>Nuevo objetivo</Button> : undefined} />
        </div>
      ) : visibles.length === 0 ? (
        <div className="fm-card"><EmptyState title="Todos los objetivos están completados" action={<Button onClick={() => setVerCompletados(true)}>Ver completados</Button>} /></div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibles.map(o => {
            const est = estadoObjetivo(o);
            const pct = o.objetivo > 0 ? (o.aportado / o.objetivo) * 100 : 0;
            const mensual = mensualNecesario(o);
            return (
              <li key={o.id} className="fm-card p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base flex items-center gap-2 truncate" style={{ color: 'var(--text-primary)' }}>
                      {o.emoji && <span className="text-xl leading-none" aria-hidden="true">{o.emoji}</span>}{o.nombre}
                    </h3>
                    <p className="text-[13px] mt-0.5 first-letter:uppercase" style={{ color: 'var(--text-muted)' }}>Para {fmtMesAnio(o.fecha_objetivo)}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Estado texto={ESTADO[est].t} tone={ESTADO[est].tone} />
                    {canEdit && <>
                      <IconButton label={`Editar ${o.nombre}`} onClick={() => setForm({ id: o.id, nombre: o.nombre, objetivo: String(o.objetivo), fecha_objetivo: o.fecha_objetivo.slice(0, 7), emoji: o.emoji ?? '' })}><PencilIcon /></IconButton>
                      <IconButton label={`Eliminar ${o.nombre}`} onClick={() => setBorrar(o)} className="hover:!text-money-out"><TrashIcon /></IconButton>
                    </>}
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between mb-1.5 text-sm">
                    <span><strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatEUR(o.aportado)}</strong> <span style={{ color: 'var(--text-muted)' }}>de {formatEUR(o.objetivo)}</span></span>
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{Math.min(pct, 100).toFixed(0)} %</span>
                  </div>
                  <Barra pct={pct} />
                </div>
                <p className="text-sm" style={{ color: est === 'vencido' ? 'var(--money-out)' : 'var(--text-secondary)' }}>
                  {est === 'completado' ? 'Objetivo conseguido'
                    : est === 'vencido' ? `Fecha superada; faltan ${formatEUR(o.objetivo - o.aportado)}`
                    : mensual != null ? <>Aporta <strong style={{ color: 'var(--text-primary)' }}>{formatEUR(mensual)}</strong> al mes para llegar a tiempo</> : null}
                </p>
                {canEdit && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" icon={<PlusIcon />} onClick={() => setMover({ o, signo: 1 })} className="flex-1 sm:flex-none">Añadir</Button>
                    <Button size="sm" variant="ghost" icon={<MinusIcon />} onClick={() => setMover({ o, signo: -1 })} className="flex-1 sm:flex-none">Retirar</Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {form && <ObjetivoModal form={form} setForm={setForm} onClose={() => setForm(null)} onSave={guardar} saving={saving} />}
      {mover && (
        <ImporteModal titulo={`${mover.signo > 0 ? 'Añadir a' : 'Retirar de'} ${mover.o.nombre}`} etiqueta="Importe (€)" inicial=""
          ayuda={`Llevas ${formatEUR(mover.o.aportado)} de ${formatEUR(mover.o.objetivo)}.`}
          onClose={() => setMover(null)} onSave={n => moverDinero(mover.o, mover.signo * Math.abs(n))} />
      )}
      {borrar && <ConfirmDialog message={`¿Eliminar «${borrar.nombre}»?`} onConfirm={() => eliminar(borrar)} onCancel={() => setBorrar(null)} />}
    </>
  );
}

/** Módulo independiente: «Ahorro anual» u «Objetivos» */
export default function AhorroView({ scope, vista, canEdit = true }: { scope: Scope; vista: 'anual' | 'objetivos'; canEdit?: boolean }) {
  const anual = vista === 'anual';
  return (
    <div>
      <div className="mb-3"><BackToModulos href={`/${scope}/modulos`} /></div>
      <PageHeader
        title={anual ? 'Ahorro anual' : 'Objetivos'}
        subtitle={anual
          ? (scope === 'personal' ? 'Tu objetivo de ahorro, anual o mensual' : 'El objetivo de ahorro de la casa, anual o mensual')
          : (scope === 'personal' ? 'Tus metas de ahorro con fecha' : 'Las metas de ahorro de la casa con fecha')}
        info={
          <InfoExpand title={anual ? '¿Qué es Ahorro anual?' : '¿Qué son los Objetivos?'}>
            <p>
              {anual
                ? 'Fija cuánto quieres ahorrar, al año o al mes, y apunta lo que aportas. Con objetivo anual, la cuota se ajusta a lo que llevas. Aparece como fila Modular en el Presupuesto.'
                : 'Metas con importe y fecha. Ve añadiendo dinero a cada una; lo que toca aportar al mes aparece como fila Modular en el Presupuesto.'}
            </p>
          </InfoExpand>
        }
      />
      {anual ? <Anual scope={scope} canEdit={canEdit} /> : <Objetivos scope={scope} canEdit={canEdit} />}
    </div>
  );
}

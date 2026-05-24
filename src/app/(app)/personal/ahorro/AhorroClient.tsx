'use client';
import { useEffect, useState, useRef } from 'react';
import type { PersonalAhorro, PersonalAhorroMes } from '@/lib/db';

const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 border transition-colors';
const inputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };

function MonthStatus({ aportado, objetivo }: { aportado: number; objetivo: number }) {
  if (objetivo <= 0) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  if (aportado <= 0) return <span className="text-xs font-bold" style={{ color: '#ef4444' }}>✗</span>;
  if (aportado >= objetivo) return <span className="text-xs font-bold" style={{ color: '#10b981' }}>✓</span>;
  return <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>~</span>;
}

function PencilIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>;
}

interface EditableAmountProps {
  value: number;
  mesIndex: number;
  onSave: (mesIndex: number, value: number) => Promise<void>;
}

function EditableAmount({ value, mesIndex, onSave }: EditableAmountProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(String(value)); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  function handleBlur() {
    setEditing(false);
    const num = parseFloat(draft);
    if (!isNaN(num) && num !== value) onSave(mesIndex, num);
    else setDraft(String(value));
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step="0.01"
        min="0"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={e => { if (e.key === 'Enter') inputRef.current?.blur(); if (e.key === 'Escape') { setEditing(false); setDraft(String(value)); } }}
        className="w-32 rounded-xl px-3 py-1.5 text-sm text-right font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400/50 border-2 ml-auto block"
        style={{ background: 'var(--bg-page)', color: '#10b981', borderColor: '#10b981' }}
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center justify-between gap-2 w-32 ml-auto rounded-xl px-3 py-1.5 text-sm font-mono font-semibold border transition-all hover:border-emerald-400/60"
      style={{
        color: value > 0 ? '#10b981' : 'var(--text-muted)',
        borderColor: 'var(--btn-border)',
        background: 'var(--bg-page)',
      }}
      title="Clic para editar"
    >
      <span className="opacity-40"><PencilIcon /></span>
      <span>{value > 0 ? fmt(value) : '—'}</span>
    </button>
  );
}

export default function AhorroClient() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [ahorro, setAhorro] = useState<PersonalAhorro | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingObjetivo, setEditingObjetivo] = useState(false);
  const [objetivoDraft, setObjetivoDraft] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchAhorro(y: number) {
    setLoading(true);
    const data = await fetch(`/api/personal/ahorro?year=${y}`).then(r => r.json());
    setAhorro(data);
    setLoading(false);
  }

  useEffect(() => { fetchAhorro(year); }, [year]);

  async function saveObjetivo() {
    const num = parseFloat(objetivoDraft);
    if (isNaN(num) || num < 0) { setEditingObjetivo(false); return; }
    setSaving(true);
    await fetch('/api/personal/ahorro', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, objetivoAnual: num }),
    });
    setSaving(false);
    setEditingObjetivo(false);
    fetchAhorro(year);
  }

  async function saveMes(mesIndex: number, aportado: number) {
    await fetch('/api/personal/ahorro/mes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, mes: mesIndex + 1, aportado }),
    });
    fetchAhorro(year);
  }

  const meses: PersonalAhorroMes[] = ahorro?.meses ?? [];
  const objetivoAnual = ahorro?.objetivo_anual ?? 0;
  const objetivoMensual = objetivoAnual > 0 ? objetivoAnual / 12 : 0;
  const totalAportado = meses.reduce((s, m) => s + m.aportado, 0);
  const porcentaje = objetivoAnual > 0 ? Math.min((totalAportado / objetivoAnual) * 100, 100) : 0;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Ahorro</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Seguimiento de tu objetivo de ahorro anual</p>
          </div>
        </div>
        {/* Year selector */}
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y - 1)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors" style={{ background: 'var(--btn-hover)', color: 'var(--text-primary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="text-lg font-bold w-16 text-center" style={{ color: 'var(--text-primary)' }}>{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors" style={{ background: 'var(--btn-hover)', color: 'var(--text-primary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Objetivo anual */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
          <p className="text-[10px] sm:text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Objetivo anual</p>
          {editingObjetivo ? (
            <div className="flex items-center gap-1 sm:gap-2 mt-1">
              <input
                type="number" step="0.01" min="0"
                value={objetivoDraft}
                onChange={e => setObjetivoDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveObjetivo(); if (e.key === 'Escape') setEditingObjetivo(false); }}
                className="w-full rounded-lg px-2 py-1 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/50 border border-white/30"
                style={{ background: 'rgba(255,255,255,0.15)' }}
                autoFocus
              />
              <button onClick={saveObjetivo} disabled={saving} className="text-xs font-bold text-white/90 px-2 py-1 rounded-lg border border-white/30 shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
                {saving ? '…' : '✓'}
              </button>
              <button onClick={() => setEditingObjetivo(false)} className="text-xs font-bold text-white/70 shrink-0">✕</button>
            </div>
          ) : (
            <button
              onClick={() => { setObjetivoDraft(String(objetivoAnual)); setEditingObjetivo(true); }}
              className="text-base sm:text-2xl font-extrabold text-white hover:opacity-80 transition-opacity text-left leading-tight"
              title="Clic para editar objetivo"
            >
              {objetivoAnual > 0 ? fmt(objetivoAnual) : 'Sin objetivo'}
            </button>
          )}
          {!editingObjetivo && <p className="hidden sm:block text-xs text-white/60 mt-1">Clic para editar</p>}
        </div>

        {/* Objetivo mensual — solo desktop */}
        <div className="hidden sm:block glass-card rounded-3xl p-6">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Objetivo mensual</p>
          <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {objetivoMensual > 0 ? fmt(objetivoMensual) : '—'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>objetivo ÷ 12</p>
        </div>

        {/* Conseguido */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Conseguido en {year}</p>
          <p className="text-base sm:text-2xl font-extrabold leading-tight" style={{ color: totalAportado > 0 ? '#10b981' : 'var(--text-muted)' }}>
            {fmt(totalAportado)}
          </p>
          {objetivoAnual > 0 && (
            <>
              <div className="h-1.5 rounded-full overflow-hidden mt-2 sm:mt-3 mb-1" style={{ background: 'var(--divider)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${porcentaje}%`, background: porcentaje >= 100 ? '#10b981' : porcentaje >= 50 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{porcentaje.toFixed(1)}% del objetivo</p>
            </>
          )}
        </div>
      </div>

      {/* Monthly table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Desglose mensual</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Haz clic en el importe para editarlo</p>
        </div>
        {loading ? (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--divider)' }}>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Mes</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Objetivo</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Aportado</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Diferencia</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {meses.map((m, i) => {
                  const isCurrent = year === currentYear && i === currentMonth;
                  const isFuture = year > currentYear || (year === currentYear && i > currentMonth);
                  const diff = m.aportado - objetivoMensual;
                  return (
                    <tr
                      key={m.id}
                      style={{ borderBottom: '1px solid var(--divider)', background: isCurrent ? 'var(--bg-page)' : '' }}
                      onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'var(--bg-page)'; }}
                      onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = ''; }}
                    >
                      <td className="px-6 py-3 font-semibold flex items-center gap-2">
                        <span style={{ color: 'var(--text-primary)' }}>{MESES[i]}</span>
                        {isCurrent && (
                          <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                            Actual
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {objetivoMensual > 0 ? fmt(objetivoMensual) : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <EditableAmount value={m.aportado} mesIndex={i} onSave={saveMes} />
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-sm">
                        {objetivoMensual > 0 && m.aportado > 0 ? (
                          <span style={{ color: diff >= 0 ? '#10b981' : '#ef4444' }}>
                            {diff >= 0 ? '+' : ''}{fmt(diff)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {isFuture && m.aportado <= 0 ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                        ) : (
                          <MonthStatus aportado={m.aportado} objetivo={objetivoMensual} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {meses.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--divider)' }}>
                    <td className="px-6 py-4 font-bold" style={{ color: 'var(--text-primary)' }}>Total</td>
                    <td className="px-6 py-4 text-right font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                      {objetivoAnual > 0 ? fmt(objetivoAnual) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold font-mono" style={{ color: '#10b981' }}>
                      {fmt(totalAportado)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold font-mono">
                      {objetivoAnual > 0 && totalAportado > 0 ? (
                        <span style={{ color: (totalAportado - objetivoAnual) >= 0 ? '#10b981' : '#ef4444' }}>
                          {(totalAportado - objetivoAnual) >= 0 ? '+' : ''}{fmt(totalAportado - objetivoAnual)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {objetivoAnual > 0 && (
                        <span className="text-xs font-bold" style={{ color: porcentaje >= 100 ? '#10b981' : porcentaje >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {porcentaje.toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

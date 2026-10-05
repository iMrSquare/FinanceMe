'use client';
import { useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import type { SessionUser, ColorMode } from '@/lib/auth';
import { SunIcon, MoonIcon, LaptopIcon } from './icons';
import { CircularColorPicker } from './ColorDots';
import Segmented from './ui/Segmented';

type Modo = 'personal' | 'hogar';

interface Paleta { bg: string; card: string; border: string; text: string; muted: string }
interface Tema {
  id: string;
  name: string;
  desc: string;
  personal: string;
  hogar: string;
  radius: number;
  light: Paleta;
  dark: Paleta;
}

/** Temas disponibles; los valores replican los de globals.css para la vista previa */
export const TEMAS: Tema[] = [
  {
    id: 'institucional', name: 'Institucional', desc: 'Sobrio y neutro. Predeterminado.',
    personal: '#10b981', hogar: '#0ea5e9', radius: 6,
    light: { bg: '#f4f6f8', card: '#ffffff', border: '#dde2e8', text: '#172033', muted: '#5f6b7a' },
    dark: { bg: '#0e1623', card: '#152033', border: '#26344a', text: '#e6ebf2', muted: '#8e9aab' },
  },
  {
    id: 'ambar', name: 'Ámbar', desc: 'Grises cálidos; casi negro en oscuro.',
    personal: '#34d399', hogar: '#38bdf8', radius: 9,
    light: { bg: '#f7f7f5', card: '#ffffff', border: '#e4e4e2', text: '#14161b', muted: '#6c707b' },
    dark: { bg: '#0f1115', card: '#16181d', border: '#26282d', text: '#f2f3f5', muted: '#767e8c' },
  },
  {
    id: 'rosa', name: 'Vino', desc: 'Rosados y granate, esquinas suaves.',
    personal: '#e11d48', hogar: '#c026d3', radius: 9,
    light: { bg: '#fdf2f8', card: '#ffffff', border: '#fbcfe8', text: '#4a0e2e', muted: '#a9517d' },
    dark: { bg: '#1a0410', card: '#2b0a1c', border: '#44142e', text: '#fce7f3', muted: '#a06a86' },
  },
  {
    id: 'contraste', name: 'Contraste', desc: 'Blanco y negro, máxima legibilidad.',
    personal: '#059669', hogar: '#2563eb', radius: 3,
    light: { bg: '#ffffff', card: '#ffffff', border: '#1f1f1f', text: '#000000', muted: '#737373' },
    dark: { bg: '#000000', card: '#000000', border: '#e5e5e5', text: '#ffffff', muted: '#a3a3a3' },
  },
];

export const temaPorId = (id: string) => TEMAS.find(t => t.id === id) ?? TEMAS[0];

const COLOR_MODES: { id: ColorMode; label: string }[] = [
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
  { id: 'system', label: 'Sistema' },
];

interface Appearance {
  theme: string;
  colorMode: ColorMode;
  accentPersonal: string | null;
  accentHogar: string | null;
}

function applyDom({ theme, colorMode, accentPersonal, accentHogar }: Appearance) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  const wantsDark = colorMode === 'dark' || (colorMode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', wantsDark);
  if (accentPersonal) root.style.setProperty('--accent-personal', accentPersonal);
  else root.style.removeProperty('--accent-personal');
  if (accentHogar) root.style.setProperty('--accent-hogar', accentHogar);
  else root.style.removeProperty('--accent-hogar');
}

function suscribirEsquema(cb: () => void) {
  const mq = matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/** Estado y guardado de la apariencia del usuario (Mi perfil y tutorial) */
export function useAppearance(session: SessionUser) {
  const [theme, setTheme] = useState(TEMAS.some(t => t.id === session.theme) ? session.theme : 'institucional');
  const [colorMode, setColorMode] = useState<ColorMode>(session.colorMode);
  const [accentPersonal, setAccentPersonal] = useState<string | null>(session.accentPersonal);
  const [accentHogar, setAccentHogar] = useState<string | null>(session.accentHogar);
  const [modoInicio, setModoInicio] = useState<Modo>(session.modoInicio ?? 'personal');
  const [saveErr, setSaveErr] = useState('');
  const sistemaOscuro = useSyncExternalStore(suscribirEsquema, () => matchMedia('(prefers-color-scheme: dark)').matches, () => false);

  const oscuro = colorMode === 'dark' || (colorMode === 'system' && sistemaOscuro);
  const tema = temaPorId(theme);
  const displayPersonal = accentPersonal ?? tema.personal;
  const displayHogar = accentHogar ?? tema.hogar;

  async function commit(next: Partial<Appearance> & { modoInicio?: Modo }) {
    const a: Appearance = { theme, colorMode, accentPersonal, accentHogar, ...next };
    const modo = next.modoInicio ?? modoInicio;
    applyDom(a);
    try {
      localStorage.setItem('appearance', JSON.stringify({ theme: a.theme, accentPersonal: a.accentPersonal, accentHogar: a.accentHogar }));
    } catch { /* ignore */ }
    try {
      const res = await fetch('/api/auth/update-appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...a, modoInicio: modo }),
      });
      setSaveErr(res.ok ? '' : 'No se pudo guardar la preferencia');
    } catch {
      setSaveErr('No se pudo guardar la preferencia');
    }
  }

  return {
    theme, colorMode, accentPersonal, accentHogar, modoInicio, saveErr, oscuro, displayPersonal, displayHogar,
    selectTheme: (id: string) => { setTheme(id); commit({ theme: id }); },
    selectColorMode: (m: ColorMode) => { setColorMode(m); commit({ colorMode: m }); },
    selectAccentPersonal: (hex: string | null) => { setAccentPersonal(hex); commit({ accentPersonal: hex }); },
    selectAccentHogar: (hex: string | null) => { setAccentHogar(hex); commit({ accentHogar: hex }); },
    selectModoInicio: (m: Modo) => { setModoInicio(m); commit({ modoInicio: m }); },
  };
}

export type AppearanceState = ReturnType<typeof useAppearance>;

/** Mini maqueta de la app con la paleta del tema */
function TemaPreview({ tema, oscuro }: { tema: Tema; oscuro: boolean }) {
  const p = oscuro ? tema.dark : tema.light;
  const r = tema.radius;
  return (
    <div className="relative h-[76px] overflow-hidden flex gap-1.5 p-2" aria-hidden="true"
      style={{ background: p.bg, borderRadius: r + 2, border: `1px solid ${oscuro ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'}` }}>
      {/* Barra lateral */}
      <div className="w-[18%] flex flex-col gap-1 pt-0.5">
        <span className="h-1.5 rounded-full w-full" style={{ background: p.text, opacity: 0.8 }} />
        <span className="h-1.5 rounded-full w-3/4" style={{ background: tema.personal }} />
        <span className="h-1.5 rounded-full w-2/3" style={{ background: p.muted, opacity: 0.5 }} />
        <span className="h-1.5 rounded-full w-3/4" style={{ background: p.muted, opacity: 0.5 }} />
      </div>
      {/* Tarjeta con cifra y botones */}
      <div className="flex-1 flex flex-col justify-between p-2" style={{ background: p.card, border: `1px solid ${p.border}`, borderRadius: r }}>
        <div className="space-y-1">
          <span className="block h-1.5 rounded-full w-1/2" style={{ background: p.muted, opacity: 0.7 }} />
          <span className="block h-2.5 rounded-full w-3/4" style={{ background: p.text }} />
        </div>
        <div className="flex gap-1">
          <span className="h-3 w-7" style={{ background: tema.personal, borderRadius: Math.min(r, 6) }} />
          <span className="h-3 w-7" style={{ background: tema.hogar, borderRadius: Math.min(r, 6) }} />
        </div>
      </div>
    </div>
  );
}

export function ThemePicker({ a, labelId }: { a: AppearanceState; labelId: string }) {
  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = TEMAS[(i + delta + TEMAS.length) % TEMAS.length];
    a.selectTheme(next.id);
    (e.currentTarget.parentElement?.querySelector(`[data-tema="${next.id}"]`) as HTMLElement | null)?.focus();
  }

  return (
    <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-2 gap-2.5">
      {TEMAS.map((t, i) => {
        const active = a.theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            data-tema={t.id}
            tabIndex={active ? 0 : -1}
            onClick={() => a.selectTheme(t.id)}
            onKeyDown={e => onKey(e, i)}
            className="group text-left p-1.5 rounded-[var(--radius-card)] border transition-colors cursor-pointer hover:border-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-mode)]"
            style={{
              borderColor: active ? 'var(--accent-mode)' : 'var(--btn-border)',
              boxShadow: active ? 'inset 0 0 0 1px var(--accent-mode)' : undefined,
            }}
          >
            <TemaPreview tema={t} oscuro={a.oscuro} />
            <span className="flex items-start gap-2 px-1 pt-2 pb-0.5">
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.name}</span>
                <span className="block text-[12px] leading-snug mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.desc}</span>
              </span>
              <span className="mt-0.5 w-4 h-4 rounded-full border-2 grid place-items-center shrink-0"
                style={{ borderColor: active ? 'var(--accent-mode)' : 'var(--btn-border)' }} aria-hidden="true">
                {active && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-mode)' }} />}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ColorModePicker({ a }: { a: AppearanceState }) {
  return (
    <Segmented
      options={COLOR_MODES.map(m => {
        const Icon = m.id === 'light' ? SunIcon : m.id === 'dark' ? MoonIcon : LaptopIcon;
        return { ...m, icon: <Icon className="w-4 h-4" /> };
      })}
      value={a.colorMode}
      onChange={a.selectColorMode}
    />
  );
}

export function AccentPickers({ a }: { a: AppearanceState }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {([
        { label: 'Personal', value: a.displayPersonal, custom: a.accentPersonal, onChange: a.selectAccentPersonal },
        { label: 'Hogar', value: a.displayHogar, custom: a.accentHogar, onChange: a.selectAccentHogar },
      ]).map(x => (
        <div key={x.label} className="flex items-center gap-3 rounded-[var(--radius-control)] border px-3 py-2.5" style={{ borderColor: 'var(--btn-border)' }}>
          <CircularColorPicker value={x.value} onChange={x.onChange} label={`Color de ${x.label}`} />
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{x.label}</p>
            {x.custom
              ? <button type="button" onClick={() => x.onChange(null)} className="text-[13px] hover:underline cursor-pointer" style={{ color: 'var(--text-muted)' }}>Restablecer</button>
              : <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Del tema</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ModoInicioPicker({ a, hogarDisponible }: { a: AppearanceState; hogarDisponible: boolean }) {
  return (
    <>
      <Segmented<Modo>
        options={[
          { id: 'personal', label: 'Personal', icon: <span className="w-2.5 h-2.5 rounded-full" style={{ background: a.displayPersonal }} aria-hidden="true" /> },
          { id: 'hogar', label: 'Hogar', icon: <span className="w-2.5 h-2.5 rounded-full" style={{ background: a.displayHogar }} aria-hidden="true" /> },
        ]}
        value={a.modoInicio}
        onChange={a.selectModoInicio}
        disabled={m => m === 'hogar' && !hogarDisponible}
      />
      <p className="text-[13px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
        {hogarDisponible ? 'También se usa al abrir la app instalada.' : 'Hogar aún no está activado por el administrador.'}
      </p>
    </>
  );
}

'use client';
import { useState } from 'react';
import type { SessionUser, ColorMode } from '@/lib/auth';
import { SunIcon, MoonIcon, LaptopIcon } from './icons';
import { CircularColorPicker } from './ColorDots';

const THEMES: { id: string; name: string }[] = [
  { id: 'indigo', name: 'Clásico' },
  { id: 'ambar', name: 'Ámbar' },
  { id: 'monokai', name: 'Monokai' },
  { id: 'dracula', name: 'Dracula' },
  { id: 'rosa', name: 'Vino' },
  { id: 'contraste', name: 'Contraste' },
];

const THEME_PREVIEWS: Record<string, { bg: string; personal: string; hogar: string; radius: string }> = {
  indigo:    { bg: '#eef2ff', personal: '#10b981', hogar: '#0ea5e9', radius: '10px' },
  ambar:     { bg: '#0c0e11', personal: '#34d399', hogar: '#38bdf8', radius: '10px' },
  monokai:   { bg: '#272822', personal: '#a6e22e', hogar: '#66d9ef', radius: '4px' },
  dracula:   { bg: '#282a36', personal: '#50fa7b', hogar: '#8be9fd', radius: '4px' },
  rosa:      { bg: '#fce7f3', personal: '#e11d48', hogar: '#c026d3', radius: '10px' },
  contraste: { bg: '#e5e5e5', personal: '#059669', hogar: '#2563eb', radius: '4px' },
};

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

interface Props { session: SessionUser; }

export default function AppearanceCard({ session }: Props) {
  const [theme, setTheme] = useState(session.theme);
  const [colorMode, setColorMode] = useState<ColorMode>(session.colorMode);
  const [accentPersonal, setAccentPersonal] = useState<string | null>(session.accentPersonal);
  const [accentHogar, setAccentHogar] = useState<string | null>(session.accentHogar);
  const [saveErr, setSaveErr] = useState('');

  const themeDefaults = THEME_PREVIEWS[theme] ?? THEME_PREVIEWS.indigo;
  const displayPersonal = accentPersonal ?? themeDefaults.personal;
  const displayHogar = accentHogar ?? themeDefaults.hogar;

  async function commit(next: Appearance) {
    applyDom(next);
    try {
      localStorage.setItem('appearance', JSON.stringify({
        theme: next.theme, accentPersonal: next.accentPersonal, accentHogar: next.accentHogar,
      }));
    } catch { /* ignore */ }
    try {
      const res = await fetch('/api/auth/update-appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      setSaveErr(res.ok ? '' : 'No se pudo guardar la preferencia');
    } catch {
      setSaveErr('No se pudo guardar la preferencia');
    }
  }

  function selectTheme(id: string) {
    setTheme(id);
    commit({ theme: id, colorMode, accentPersonal, accentHogar });
  }

  function selectColorMode(next: ColorMode) {
    setColorMode(next);
    commit({ theme, colorMode: next, accentPersonal, accentHogar });
  }

  function selectAccentPersonal(hex: string) {
    setAccentPersonal(hex);
    commit({ theme, colorMode, accentPersonal: hex, accentHogar });
  }

  function selectAccentHogar(hex: string) {
    setAccentHogar(hex);
    commit({ theme, colorMode, accentPersonal, accentHogar: hex });
  }

  function resetAccentPersonal() {
    setAccentPersonal(null);
    commit({ theme, colorMode, accentPersonal: null, accentHogar });
  }

  function resetAccentHogar() {
    setAccentHogar(null);
    commit({ theme, colorMode, accentPersonal, accentHogar: null });
  }

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center gap-2.5 mb-1" style={{ color: 'var(--accent-primary)' }}>
        <SunIcon className="w-[18px] h-[18px]" />
        <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Apariencia</h2>
      </div>
      <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Elige el tema, el modo claro/oscuro y los colores de acento de Personal y Hogar.</p>

      {/* Theme tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {THEMES.map(t => {
          const preview = THEME_PREVIEWS[t.id];
          const active = theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTheme(t.id)}
              className="rounded-2xl p-3 border-2 text-left transition-colors"
              style={{
                borderColor: active ? 'var(--sidebar-hover-c)' : 'var(--btn-border)',
                background: active ? 'var(--sidebar-hover-bg)' : 'var(--bg-page)',
              }}
            >
              <div
                className="w-full h-8 flex items-center justify-center gap-1.5 mb-2"
                style={{ background: preview.bg, borderRadius: preview.radius }}
              >
                <span className="w-3 h-3 rounded-full" style={{ background: preview.personal }} />
                <span className="w-3 h-3 rounded-full" style={{ background: preview.hogar }} />
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
            </button>
          );
        })}
      </div>

      {/* Color mode */}
      <div className="flex items-center gap-1 p-1 rounded-xl mb-5" style={{ background: 'var(--btn-hover)' }}>
        {COLOR_MODES.map(m => {
          const active = colorMode === m.id;
          const Icon = m.id === 'light' ? SunIcon : m.id === 'dark' ? MoonIcon : LaptopIcon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => selectColorMode(m.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={active
                ? { background: 'var(--bg-sidebar)', color: 'var(--text-primary)', boxShadow: '0 1px 4px var(--shadow-card)' }
                : { color: 'var(--text-muted)' }
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Accent pickers */}
      <div className="flex items-start justify-center gap-10">
        <div className="flex flex-col items-center gap-1.5">
          <CircularColorPicker value={displayPersonal} onChange={selectAccentPersonal} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Personal</p>
          {accentPersonal && (
            <button type="button" onClick={resetAccentPersonal} className="text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>
              Restablecer
            </button>
          )}
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <CircularColorPicker value={displayHogar} onChange={selectAccentHogar} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Hogar</p>
          {accentHogar && (
            <button type="button" onClick={resetAccentHogar} className="text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>
              Restablecer
            </button>
          )}
        </div>
      </div>

      {saveErr && <p className="text-xs text-error font-medium mt-4">{saveErr}</p>}
    </div>
  );
}

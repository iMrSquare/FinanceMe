'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { CalendarIcon, BoltIcon, DropletIcon, GridIcon, ReceiptIcon } from './icons';

function RegistrosIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  );
}
import type { SessionUser } from '@/lib/auth';
import Image from 'next/image';
import { APP_VERSION } from '@/lib/constants';
import { useVersionNotification } from './VersionProvider';

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

function SavingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  );
}

function SubscriptionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}

interface NavItem { href: string; label: string; shortLabel?: string; icon: React.ReactElement; color: string; }

const NAV_HOGAR: NavItem[] = [
  { href: '/hogar',              label: 'Resumen',      icon: <GridIcon     className="w-[18px] h-[18px]" />, color: '#0ea5e9' },
  { href: '/hogar/mes',          label: 'Mes',          icon: <CalendarIcon className="w-[18px] h-[18px]" />, color: '#0ea5e9' },
  { href: '/hogar/presupuesto',  label: 'Presupuesto',  icon: <ReceiptIcon  className="w-[18px] h-[18px]" />, color: '#0ea5e9' },
  { href: '/hogar/registros',    label: 'Registros',    icon: <RegistrosIcon />,                               color: '#0ea5e9' },
  { href: '/hogar/ahorro',       label: 'Ahorro',       icon: <SavingsIcon />,                                 color: '#0ea5e9' },
];

const NAV_PERSONAL: NavItem[] = [
  { href: '/personal',                label: 'Resumen',       icon: <GridIcon className="w-[18px] h-[18px]" />,    color: '#10b981' },
  { href: '/personal/mes',            label: 'Mes',           icon: <CalendarIcon className="w-[18px] h-[18px]" />, color: '#10b981' },
  { href: '/personal/presupuesto',    label: 'Presupuesto',   icon: <ReceiptIcon className="w-[18px] h-[18px]" />,  color: '#10b981' },
  { href: '/personal/suscripciones',  label: 'Suscripciones', shortLabel: 'Suscs.', icon: <SubscriptionIcon />,     color: '#10b981' },
  { href: '/personal/ahorro',         label: 'Ahorro',        icon: <SavingsIcon />,                                color: '#10b981' },
];

function withCenterResumen(items: NavItem[]): NavItem[] {
  const idx = items.findIndex(i => i.label === 'Resumen');
  if (idx === -1) return items;
  const resumen = items[idx];
  const rest = items.filter((_, i) => i !== idx);
  const mid = Math.ceil(rest.length / 2);
  return [...rest.slice(0, mid), resumen, ...rest.slice(mid)];
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  visor: 'Visor',
};

interface Props { session: SessionUser | null; hogarActivated: boolean; }

export default function Sidebar({ session, hogarActivated }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { show: hasNewVersion } = useVersionNotification();
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [mode, setMode] = useState<'hogar' | 'personal'>('personal');
  const [showHogarModal, setShowHogarModal] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    if (localStorage.getItem('sidebar') === 'collapsed') setCollapsed(true);
    const saved = localStorage.getItem('app-mode');
    if (saved === 'hogar') setMode('hogar');
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/personal')) {
      setMode('personal');
      localStorage.setItem('app-mode', 'personal');
    } else if (pathname.startsWith('/hogar')) {
      setMode('hogar');
      localStorage.setItem('app-mode', 'hogar');
    }
    setMobileOpen(false);
    setPendingHref(null);
  }, [pathname]);

  function toggleMode(next: 'hogar' | 'personal') {
    if (next === 'hogar' && !hogarActivated) {
      setShowHogarModal(true);
      return;
    }
    applyMode(next);
  }

  function applyMode(next: 'hogar' | 'personal') {
    setMode(next);
    localStorage.setItem('app-mode', next);
    if (next === 'personal' && !pathname.startsWith('/personal')) router.push('/personal');
    if (next === 'hogar' && pathname.startsWith('/personal')) router.push('/hogar');
  }

  async function confirmHogar() {
    const res = await fetch('/api/hogar/activate', { method: 'POST' });
    if (!res.ok) return;
    setShowHogarModal(false);
    setMobileOpen(false);
    applyMode('hogar');
    router.refresh();
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Hide bottom nav on scroll down, show on scroll up
  useEffect(() => {
    let el: HTMLElement | null = null;
    let remove: (() => void) | null = null;

    function attach() {
      el = document.querySelector('main');
      if (!el) return false;
      function onScroll() {
        const current = el!.scrollTop;
        const diff = current - lastScrollRef.current;
        if (Math.abs(diff) < 5) return;
        setNavHidden(diff > 0 && current > 60);
        lastScrollRef.current = current;
      }
      el.addEventListener('scroll', onScroll, { passive: true });
      remove = () => el!.removeEventListener('scroll', onScroll);
      return true;
    }

    if (!attach()) {
      const t = setTimeout(attach, 200);
      return () => clearTimeout(t);
    }
    return () => remove?.();
  }, []);

  // Reset nav visibility on navigation
  useEffect(() => {
    setNavHidden(false);
    lastScrollRef.current = 0;
  }, [pathname]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar', next ? 'collapsed' : 'expanded');
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  function isActive(href: string) {
    if (href === '/hogar') return pathname === '/hogar';
    if (href === '/hogar/mes') return pathname.startsWith('/hogar/mes');
    if (href === '/personal') return pathname === '/personal';
    return pathname.startsWith(href);
  }

  function isActiveMobile(href: string) {
    return pendingHref ? pendingHref === href : isActive(href);
  }

  const initials = session
    ? session.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const navItems = mode === 'personal' ? NAV_PERSONAL : NAV_HOGAR;
  const mobileNavItems = withCenterResumen(navItems);

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────── */}
      <aside
        className={`${collapsed ? 'w-16' : 'w-64'} shrink-0 hidden lg:flex flex-col border-r transition-all duration-300 overflow-hidden`}
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--sidebar-border)' }}
      >
        {/* Top */}
        <div className="flex-1 flex flex-col px-3 pt-6 pb-3 min-h-0">

          {/* Brand row */}
          <div className={`flex items-center mb-8 ${collapsed ? 'justify-center' : 'justify-between px-1'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
                <Image src="/logo_FinanceMe-Hogar.png" alt="FinanceMe Hogar" width={36} height={36} className="w-full h-full object-cover" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <h1 className="font-bold text-base leading-tight truncate" style={{ color: 'var(--text-primary)' }}>FinanceMe</h1>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>Control Financiero</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={toggleCollapsed}
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                style={{ color: 'var(--text-muted)', background: 'var(--btn-hover)' }}
                title="Colapsar"
              >
                <ChevronLeftIcon />
              </button>
            )}
          </div>

          {/* Mode switcher */}
          {!collapsed && (
            <div className="mb-5">
              <div className="flex items-center gap-1 p-1 rounded-2xl" style={{ background: 'var(--btn-hover)' }}>
                <button
                  onClick={() => toggleMode('personal')}
                  className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={mode === 'personal'
                    ? { background: '#10b981', color: '#fff', boxShadow: '0 2px 8px rgba(16,185,129,0.35)' }
                    : { background: 'transparent', color: 'var(--text-muted)' }
                  }
                >
                  Personal
                </button>
                <button
                  onClick={() => toggleMode('hogar')}
                  disabled={!hogarActivated && session?.role !== 'admin'}
                  className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={mode === 'hogar'
                    ? { background: '#0ea5e9', color: '#fff', boxShadow: '0 2px 8px rgba(14,165,233,0.35)' }
                    : { background: 'transparent', color: 'var(--text-muted)', opacity: !hogarActivated && session?.role !== 'admin' ? 0.4 : 1, cursor: !hogarActivated && session?.role !== 'admin' ? 'not-allowed' : 'pointer' }
                  }
                  title={!hogarActivated && session?.role !== 'admin' ? 'Pendiente de activación por un administrador' : undefined}
                >
                  Hogar
                </button>
              </div>
              {!hogarActivated && session?.role !== 'admin' && (
                <p className="text-[10px] mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
                  Pendiente de activación por un administrador
                </p>
              )}
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center mb-4">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: mode === 'hogar' ? '#0ea5e9' : '#10b981' }}
                title={mode === 'hogar' ? 'Hogar' : 'Personal'}
              />
            </div>
          )}

          {/* Expand button when collapsed */}
          {collapsed && (
            <button
              onClick={toggleCollapsed}
              className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-6 transition-colors"
              style={{ color: 'var(--text-muted)', background: 'var(--btn-hover)' }}
              title="Expandir"
            >
              <ChevronRightIcon />
            </button>
          )}

          {/* Nav */}
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon, color }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? label : undefined}
                  className={`flex items-center py-2.5 rounded-2xl font-medium text-sm transition-all duration-200 ${collapsed ? 'justify-center px-2' : 'gap-3 px-3 hover:translate-x-0.5'}`}
                  style={active
                    ? { background: 'var(--sidebar-hover-bg)', color: 'var(--sidebar-hover-c)' }
                    : { color: 'var(--text-secondary)' }
                  }
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover-bg)'; (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-hover-c)'; } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; } }}
                >
                  <span style={{ color: active ? 'var(--sidebar-hover-c)' : color }}>{icon}</span>
                  {!collapsed && label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom */}
        <div className="px-3 pb-6 space-y-2">
          {/* Theme toggle */}
          {collapsed ? (
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-center py-2.5 rounded-2xl transition-colors"
              style={{ color: 'var(--text-secondary)', background: 'var(--sidebar-hover-bg)' }}
              title={dark ? 'Modo oscuro' : 'Modo claro'}
            >
              {dark ? <MoonIcon /> : <SunIcon />}
            </button>
          ) : (
            <div className="flex items-center justify-between px-3 py-3 rounded-2xl" style={{ background: 'var(--sidebar-hover-bg)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {dark ? 'Modo oscuro' : 'Modo claro'}
              </span>
              <button
                onClick={toggleTheme}
                className="relative w-10 h-5 rounded-full bg-indigo-600 transition-colors focus:outline-none shrink-0"
                aria-label="Cambiar tema"
              >
                <span
                  className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 flex items-center justify-center text-indigo-600"
                  style={{ transform: dark ? 'translateX(20px)' : 'translateX(0)' }}
                >
                  {dark ? <MoonIcon /> : <SunIcon />}
                </span>
              </button>
            </div>
          )}

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-2'} py-2 rounded-2xl transition-colors`}
              style={{ background: menuOpen ? 'var(--sidebar-hover-bg)' : 'transparent' }}
              title={collapsed ? session?.nombre ?? 'Usuario' : undefined}
            >
              {session?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.avatarUrl} alt={session.nombre} width={32} height={32} className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {initials}
                </div>
              )}
              {!collapsed && session && (
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{session.nombre}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>@{session.username}</p>
                </div>
              )}
              {!collapsed && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" style={{ color: 'var(--text-muted)', transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              )}
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div
                className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl overflow-hidden shadow-xl z-50"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}
              >
                <Link href="/perfil" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors w-full" style={{ color: 'var(--text-primary)' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover-bg)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                  <UserIcon />Mi Perfil
                </Link>
                {session?.role === 'admin' && (
                  <Link href="/ajustes" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors w-full" style={{ color: 'var(--text-primary)' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover-bg)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <SettingsIcon />Ajustes
                  </Link>
                )}
                <div style={{ borderTop: '1px solid var(--divider)' }} />
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors w-full text-left" style={{ color: '#ef4444' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                  <LogoutIcon />Cerrar sesión
                </button>
              </div>
            )}
          </div>
          {!collapsed && (
            <Link href="/changelog" className="flex items-center justify-center gap-1.5 mt-3 text-xs hover:underline">
              {hasNewVersion ? (
                <>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-red-500">new</span>
                  <span className="px-2 py-0.5 rounded-full font-bold text-white bg-red-500">{APP_VERSION}</span>
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>{APP_VERSION}</span>
              )}
            </Link>
          )}
        </div>
      </aside>

      {/* ── MOBILE HEADER ───────────────────────────────────── */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b"
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--sidebar-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0">
            <Image src="/logo_FinanceMe-Hogar.png" alt="FinanceMe" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>FinanceMe</p>
            <p className="text-[10px] leading-tight" style={{ color: mode === 'personal' ? '#10b981' : '#0ea5e9' }}>
              {mode === 'personal' ? 'Personal' : 'Hogar'}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center"
            aria-label="Abrir menú"
          >
            {session?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.avatarUrl} alt={session.nombre} width={36} height={36} className="w-9 h-9 object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                {initials}
              </div>
            )}
          </button>
          {hasNewVersion && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
              style={{ border: '2px solid var(--bg-sidebar)' }}
            >
              1
            </span>
          )}
        </div>
      </header>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t"
        style={{
          background: 'var(--bg-sidebar)',
          borderColor: 'var(--sidebar-border)',
          transform: navHidden ? 'translateY(100%)' : 'translateY(0)',
          transition: 'transform 300ms ease',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          height: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {mobileNavItems.map(({ href, label, shortLabel, icon, color }) => {
          const active = isActiveMobile(href);
          if (label === 'Resumen') {
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setPendingHref(href)}
                className="flex-1 flex flex-col items-center justify-center active:opacity-70"
              >
                <span
                  className="flex items-center justify-center w-14 h-14 rounded-full -mt-7 shrink-0"
                  style={{
                    background: active ? color : 'var(--btn-hover)',
                    boxShadow: active ? `0 4px 14px ${color}66` : 'none',
                    border: '4px solid var(--bg-sidebar)',
                  }}
                >
                  <span style={{ color: active ? '#fff' : 'var(--text-muted)' }}>{icon}</span>
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setPendingHref(href)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 active:opacity-70"
            >
              <span
                className="flex items-center justify-center w-9 h-9 rounded-full"
                style={{ background: active ? `${color}1f` : 'transparent' }}
              >
                <span style={{ color: active ? color : 'var(--text-muted)' }}>{icon}</span>
              </span>
              <span
                className="text-[10px] font-semibold leading-tight"
                style={{ color: active ? color : 'var(--text-muted)' }}
              >
                {shortLabel ?? label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── MOBILE DRAWER ───────────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sheet */}
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl pt-3 pb-8 px-5 space-y-3 max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-card)' }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: 'var(--text-muted)', opacity: 0.35 }} />

            {/* User info */}
            <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--bg-page)' }}>
              {session?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.avatarUrl} alt={session.nombre} width={44} height={44} className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{session?.nombre}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{session ? `@${session.username}` : ''}</p>
              </div>
            </div>

            {/* Mode switcher */}
            <div>
              <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--bg-page)' }}>
                <button
                  onClick={() => { toggleMode('personal'); setMobileOpen(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={mode === 'personal'
                    ? { background: '#10b981', color: '#fff', boxShadow: '0 2px 8px rgba(16,185,129,0.35)' }
                    : { background: 'transparent', color: 'var(--text-muted)' }
                  }
                >
                  Personal
                </button>
                <button
                  onClick={() => { toggleMode('hogar'); setMobileOpen(false); }}
                  disabled={!hogarActivated && session?.role !== 'admin'}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={mode === 'hogar'
                    ? { background: '#0ea5e9', color: '#fff', boxShadow: '0 2px 8px rgba(14,165,233,0.35)' }
                    : { background: 'transparent', color: 'var(--text-muted)', opacity: !hogarActivated && session?.role !== 'admin' ? 0.4 : 1, cursor: !hogarActivated && session?.role !== 'admin' ? 'not-allowed' : 'pointer' }
                  }
                  title={!hogarActivated && session?.role !== 'admin' ? 'Pendiente de activación por un administrador' : undefined}
                >
                  Hogar
                </button>
              </div>
              {!hogarActivated && session?.role !== 'admin' && (
                <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
                  Pendiente de activación por un administrador
                </p>
              )}
            </div>

            {/* Theme toggle */}
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: 'var(--bg-page)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {dark ? 'Modo oscuro' : 'Modo claro'}
              </span>
              <button
                onClick={toggleTheme}
                className="relative w-10 h-5 rounded-full bg-indigo-600 focus:outline-none shrink-0"
                aria-label="Cambiar tema"
              >
                <span
                  className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 flex items-center justify-center text-indigo-600"
                  style={{ transform: dark ? 'translateX(20px)' : 'translateX(0)' }}
                >
                  {dark ? <MoonIcon /> : <SunIcon />}
                </span>
              </button>
            </div>

            {/* Links */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-card)' }}>
              <Link
                href="/perfil"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium border-b"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-card)' }}
              >
                <UserIcon />
                Mi Perfil
              </Link>
              {session?.role === 'admin' && (
                <Link
                  href="/ajustes"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium border-b"
                  style={{ color: 'var(--text-primary)', borderColor: 'var(--border-card)' }}
                >
                  <SettingsIcon />
                  Ajustes
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium w-full text-left"
                style={{ color: '#ef4444' }}
              >
                <LogoutIcon />
                Cerrar sesión
              </button>
            </div>

            <Link href="/changelog" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-1.5 pt-1 text-xs hover:underline">
              {hasNewVersion ? (
                <>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-red-500">new</span>
                  <span className="px-2 py-0.5 rounded-full font-bold text-white bg-red-500">{APP_VERSION}</span>
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>{APP_VERSION}</span>
              )}
            </Link>
          </div>
        </>
      )}

      {/* Hogar first-time activation modal */}
      {showHogarModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div className="glass-card rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: 'rgba(14,165,233,0.15)' }}>
                🏠
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Activar modo Hogar</h2>
            </div>

            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              El modo Hogar es <strong>compartido entre todos los usuarios</strong> de la aplicación. Los gastos, préstamos, agua y luz serán visibles y editables por todos.
            </p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
              Te recomendamos revisar los usuarios y sus permisos en <strong>Ajustes → Usuarios</strong> antes de empezar a usarlo.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowHogarModal(false)}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                style={{ background: 'var(--btn-hover)', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmHogar}
                className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', boxShadow: '0 2px 12px rgba(14,165,233,0.35)' }}
              >
                Activar Hogar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

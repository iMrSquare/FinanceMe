'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { CalendarIcon, GridIcon, ReceiptIcon, ModulesIcon, BellIcon } from './icons';
import type { SessionUser } from '@/lib/auth';
import Logo from './Logo';
import { APP_VERSION } from '@/lib/constants';
import { useVersionNotification } from './VersionProvider';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { disablePushOnLogout } from '@/lib/pushClient';

function PanelIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" />
      <path d={collapsed ? 'm13 10 2 2-2 2' : 'm15 10-2 2 2 2'} />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

interface NavItem { href: string; label: string; icon: React.ReactElement; }

const iconCls = 'w-[18px] h-[18px]';
const navFor = (base: '/hogar' | '/personal'): NavItem[] => [
  { href: base, label: 'Resumen', icon: <GridIcon className={iconCls} /> },
  { href: `${base}/mes`, label: 'Mes', icon: <CalendarIcon className={iconCls} /> },
  { href: `${base}/presupuesto`, label: 'Presupuesto', icon: <ReceiptIcon className={iconCls} /> },
  { href: `${base}/modulos`, label: 'Módulos', icon: <ModulesIcon className={iconCls} /> },
  { href: `${base}/avisos`, label: 'Avisos', icon: <BellIcon className={iconCls} /> },
];
const NAV_HOGAR = navFor('/hogar');
const NAV_PERSONAL = navFor('/personal');

function withCenterResumen(items: NavItem[]): NavItem[] {
  const idx = items.findIndex(i => i.label === 'Resumen');
  if (idx === -1) return items;
  const resumen = items[idx];
  const rest = items.filter((_, i) => i !== idx);
  const mid = Math.ceil(rest.length / 2);
  return [...rest.slice(0, mid), resumen, ...rest.slice(mid)];
}

interface Props {
  session: SessionUser | null;
  hogarActivated: boolean;
  /** Versión publicada más reciente que la instalada (solo administradores) */
  updateDisponible?: string | null;
}

export default function Sidebar({ session, hogarActivated, updateDisponible }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { show: hasNewVersion } = useVersionNotification();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [mode, setMode] = useState<'hogar' | 'personal'>('personal');
  const [showHogarModal, setShowHogarModal] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastScrollRef = useRef(0);

  const hogarBloqueado = !hogarActivated && session?.role !== 'admin';

  /* eslint-disable react-hooks/set-state-in-effect -- sincroniza con localStorage y la ruta actual */
  useEffect(() => {
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
    setNavHidden(false);
    lastScrollRef.current = 0;
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // El acento de botones y navegación sigue al ámbito activo (ver globals.css)
  useEffect(() => {
    document.documentElement.dataset.ambito = mode;
  }, [mode]);

  function toggleMode(next: 'hogar' | 'personal') {
    if (next === 'hogar' && !hogarActivated) {
      setShowHogarModal(true);
      return;
    }
    applyMode(next);
  }

  function handleLogoClick() {
    const next = mode === 'personal' ? 'hogar' : 'personal';
    if (next === 'hogar' && hogarBloqueado) return;
    toggleMode(next);
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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') setMenuOpen(false); }
    if (menuOpen) { document.addEventListener('mousedown', handleClick); document.addEventListener('keydown', handleKey); }
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey); };
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Oculta la barra inferior al bajar y la muestra al subir
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

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar', next ? 'collapsed' : 'expanded');
  }

  async function handleLogout() {
    // Antes de soltar la sesión: si no, este dispositivo seguiría recibiendo los avisos de la cuenta
    await disablePushOnLogout().catch(() => {});
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  function isActive(href: string) {
    if (href === '/hogar') return pathname === '/hogar';
    if (href === '/personal') return pathname === '/personal';
    return pathname.startsWith(href);
  }
  const isActiveMobile = (href: string) => (pendingHref ? pendingHref === href : isActive(href));

  const initials = session ? session.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??';
  const navItems = mode === 'personal' ? NAV_PERSONAL : NAV_HOGAR;
  const mobileNavItems = withCenterResumen(navItems);
  const cambiarA = mode === 'personal' ? 'Hogar' : 'Personal';
  const modoLabel = mode === 'personal' ? 'Personal' : 'Hogar';
  const modoColor = mode === 'personal' ? 'var(--accent-personal)' : 'var(--accent-hogar)';

  const avatar = (size: number) => session?.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={session.avatarUrl} alt="" width={size} height={size} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <span className="rounded-full grid place-items-center font-semibold text-xs shrink-0" style={{ width: size, height: size, background: 'var(--accent-mode)', color: 'var(--on-accent)' }}>{initials}</span>
  );

  const tabs = () => (
    <div className="fm-tabs" role="group" aria-label="Ámbito">
      <button type="button" className="fm-tab" data-ambito="personal" aria-pressed={mode === 'personal'} onClick={() => { setMobileOpen(false); toggleMode('personal'); }}>
        Personal
      </button>
      <button type="button" className="fm-tab" data-ambito="hogar" aria-pressed={mode === 'hogar'} onClick={() => { setMobileOpen(false); toggleMode('hogar'); }} disabled={hogarBloqueado}
        title={hogarBloqueado ? 'Pendiente de activación por un administrador' : undefined}>
        Hogar
      </button>
    </div>
  );

  const version = (
    <Link href="/changelog" className="flex items-center justify-center gap-1.5 text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>
      {hasNewVersion ? (
        <>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--accent-mode)', color: 'var(--on-accent)' }}>Nuevo</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{APP_VERSION}</span>
        </>
      ) : APP_VERSION}
    </Link>
  );

  const avisoActualizacion = updateDisponible ? (
    <Link href="/ajustes#actualizaciones" onClick={() => setMobileOpen(false)}
      className="flex items-center justify-center gap-1.5 mt-1.5 text-xs font-medium hover:underline" style={{ color: 'var(--accent-mode)' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-mode)' }} aria-hidden="true" />
      {updateDisponible} disponible
    </Link>
  ) : null;

  const menuLinkCls = 'flex items-center gap-3 px-4 py-3 text-sm font-medium w-full text-left transition-colors hover:bg-[var(--btn-hover)]';

  return (
    <>
      {/* ── Escritorio ─────────────────────────────────────── */}
      <aside
        className={`${collapsed ? 'w-[76px]' : 'w-64'} shrink-0 hidden lg:flex flex-col border-r transition-[width] duration-200`}
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--sidebar-border)' }}
        aria-label="Navegación principal"
      >
        <div className={`flex-1 flex flex-col pt-5 pb-3 min-h-0 ${collapsed ? 'px-3 items-center' : 'px-4'}`}>
          <div className={`flex items-center mb-6 gap-2 ${collapsed ? 'flex-col' : 'justify-between'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <button onClick={handleLogoClick} className="w-9 h-9 shrink-0 rounded-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent-mode)]"
                title={`Cambiar a ${cambiarA}`} aria-label={`Cambiar a ${cambiarA}`}>
                <Logo mode={mode} className="w-full h-full" />
              </button>
              {!collapsed && (
                <span className="min-w-0 leading-tight">
                  <span className="block font-semibold text-[17px] tracking-[-0.01em] truncate" style={{ color: 'var(--text-primary)' }}>FinanceMe</span>
                  <span className="block text-xs font-medium" style={{ color: modoColor }}>{modoLabel}</span>
                </span>
              )}
            </div>
            <button onClick={toggleCollapsed}
              className="w-8 h-8 rounded-lg grid place-items-center shrink-0 border cursor-pointer transition-colors hover:bg-[var(--btn-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent-mode)]"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--btn-border)' }}
              title={collapsed ? 'Expandir menú' : 'Contraer menú'} aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'} aria-expanded={!collapsed}>
              <PanelIcon collapsed={collapsed} />
            </button>
          </div>

          {!collapsed && (
            <div className="mb-5">
              {tabs()}
              {hogarBloqueado && (
                <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>Hogar pendiente de activación por un administrador</p>
              )}
            </div>
          )}

          <nav className="flex flex-col gap-0.5 w-full" aria-label="Secciones">
            {navItems.map(({ href, label, icon }) => (
              <Link key={href} href={href} className={`fm-nav-item ${collapsed ? 'justify-center !px-0 w-12 mx-auto' : ''}`}
                aria-current={isActive(href) ? 'page' : undefined} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined}>
                {icon}
                {!collapsed && label}
              </Link>
            ))}
          </nav>
        </div>

        <div className={`pb-5 space-y-3 ${collapsed ? 'px-3' : 'px-4'}`}>
          <div className="relative pt-3" ref={menuRef} style={{ borderTop: '1px solid var(--sidebar-border)' }}>
            <button onClick={() => setMenuOpen(o => !o)} aria-expanded={menuOpen} aria-haspopup="menu"
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-2'} py-2 rounded-lg cursor-pointer transition-colors hover:bg-[var(--btn-hover)]`}
              style={{ background: menuOpen ? 'var(--btn-hover)' : undefined }}
              title={collapsed ? session?.nombre ?? 'Usuario' : undefined} aria-label={collapsed ? `Menú de ${session?.nombre ?? 'usuario'}` : undefined}>
              {avatar(32)}
              {!collapsed && session && (
                <span className="min-w-0 flex-1 text-left">
                  <span className="block font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{session.nombre}</span>
                  <span className="block text-xs truncate" style={{ color: 'var(--text-muted)' }}>@{session.username}</span>
                </span>
              )}
              {!collapsed && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0"
                  style={{ color: 'var(--text-muted)', transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              )}
            </button>

            {menuOpen && (
              <div role="menu" className="absolute bottom-full left-0 mb-2 w-56 rounded-[var(--radius-card)] overflow-hidden z-50 fm-card" style={{ boxShadow: '0 12px 32px rgba(10,16,28,.18)' }}>
                <Link role="menuitem" href="/perfil" onClick={() => setMenuOpen(false)} className={menuLinkCls} style={{ color: 'var(--text-primary)' }}><UserIcon />Mi perfil</Link>
                {session?.role === 'admin' && (
                  <Link role="menuitem" href="/ajustes" onClick={() => setMenuOpen(false)} className={menuLinkCls} style={{ color: 'var(--text-primary)' }}><SettingsIcon />Configuración</Link>
                )}
                <div style={{ borderTop: '1px solid var(--divider)' }} />
                <button role="menuitem" onClick={handleLogout} className={`${menuLinkCls} cursor-pointer`} style={{ color: 'var(--money-out)' }}><LogoutIcon />Cerrar sesión</button>
              </div>
            )}
          </div>
          {!collapsed && version}
          {!collapsed && avisoActualizacion}
        </div>
      </aside>

      {/* ── Cabecera móvil ─────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-3 px-4 h-14 border-b"
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--sidebar-border)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={handleLogoClick} className="w-8 h-8 shrink-0 rounded-lg" title={`Cambiar a ${cambiarA}`} aria-label={`Cambiar a ${cambiarA}`}>
            <Logo mode={mode} className="w-full h-full" />
          </button>
          <span className="font-semibold text-base truncate" style={{ color: 'var(--text-primary)' }}>
            FinanceMe <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span> <span style={{ color: modoColor }}>{modoLabel}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileOpen(true)} className="relative rounded-full" aria-label="Abrir menú de usuario">
            {avatar(34)}
            {(hasNewVersion || updateDisponible) && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full" style={{ background: 'var(--money-out)', border: '2px solid var(--bg-sidebar)' }} aria-label="Hay una versión nueva" />
            )}
          </button>
        </div>
      </header>

      {/* ── Barra inferior móvil ───────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t" aria-label="Secciones"
        style={{
          background: 'var(--bg-sidebar)', borderColor: 'var(--sidebar-border)',
          transform: navHidden ? 'translateY(100%)' : 'translateY(0)', transition: 'transform 300ms ease',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
        {mobileNavItems.map(({ href, label, icon }) => {
          const active = isActiveMobile(href);
          return (
            <Link key={href} href={href} onClick={() => setPendingHref(href)} className="fm-bottom-item" aria-current={active ? 'page' : undefined}
              aria-label={label === 'Resumen' ? 'Resumen' : undefined}>
              {label === 'Resumen' ? <span className="fm-bottom-fab">{icon}</span> : <>{icon}<span>{label}</span></>}
            </Link>
          );
        })}
      </nav>

      {/* ── Menú de usuario móvil ──────────────────────────── */}
      {mobileOpen && (
        <Modal title="Tu cuenta" onClose={() => setMobileOpen(false)}>
          <Link href="/perfil" onClick={() => setMobileOpen(false)} aria-label="Ir a Mi perfil"
            className="flex items-center gap-3 p-3 mb-4 rounded-[var(--radius-control)] transition-colors active:bg-[var(--btn-hover)]" style={{ background: 'var(--row-hover)' }}>
            {avatar(44)}
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{session?.nombre}</span>
              <span className="block text-xs truncate" style={{ color: 'var(--text-muted)' }}>{session ? `@${session.username} · Ver mi perfil` : ''}</span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--text-muted)' }}><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
          <div className="mb-4">
            <div className="[&_.fm-tab]:min-h-11">{tabs()}</div>
            {hogarBloqueado && (
              <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>Hogar pendiente de activación por un administrador</p>
            )}
          </div>
          <div className="fm-card overflow-hidden mb-4">
            {session?.role === 'admin' && (
              <Link href="/ajustes" onClick={() => setMobileOpen(false)} className={menuLinkCls} style={{ color: 'var(--text-primary)', minHeight: 48, borderBottom: '1px solid var(--divider)' }}><SettingsIcon />Configuración</Link>
            )}
            <button onClick={handleLogout} className={menuLinkCls} style={{ color: 'var(--money-out)', minHeight: 48 }}><LogoutIcon />Cerrar sesión</button>
          </div>
          {version}
          {avisoActualizacion}
        </Modal>
      )}

      {/* ── Activación de Hogar ────────────────────────────── */}
      {showHogarModal && (
        <Modal title="Activar Hogar" onClose={() => setShowHogarModal(false)}
          footer={<>
            <Button onClick={() => setShowHogarModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={confirmHogar}>Activar Hogar</Button>
          </>}>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Hogar es un espacio <strong>compartido por todos los usuarios</strong> de la aplicación: los gastos, ingresos y registros de luz y agua serán visibles y editables por todos.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Antes de empezar, revisa los usuarios y sus permisos en <strong>Configuración → Usuarios</strong>.
          </p>
        </Modal>
      )}
    </>
  );
}

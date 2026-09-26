'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionUser } from '@/lib/auth-edge';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Logo from './Logo';
import { CalendarIcon, GridIcon, ReceiptIcon, ModulesIcon, BellIcon, HomeIcon } from './icons';
import { useAppearance, ThemePicker, ColorModePicker, ModoInicioPicker } from './AppearanceControls';

interface Props {
  session: SessionUser;
  hogarDisponible: boolean;
  onClose: () => void;
}

/* ── Pasos de configuración ─────────────────────────────────────────────── */

function PasoBienvenida({ nombre }: { nombre: string }) {
  return (
    <div className="text-center py-2">
      <Logo className="w-16 h-16 mx-auto" />
      <p className="text-[15px] mt-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Hola, {nombre.split(' ')[0]}. FinanceMe te ayuda a llevar tus cuentas del mes: qué gastas, en qué y cuánto ahorras.
      </p>
      <p className="text-sm mt-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Primero dejaremos a tu gusto tu perfil y cómo se ve la aplicación. Después te enseñamos, una a una, las partes básicas.
        Son un par de minutos y puedes saltarlo cuando quieras.
      </p>
    </div>
  );
}

function PasoAvatar({ session }: { session: SessionUser }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(session.avatarUrl);
  const [estado, setEstado] = useState<'' | 'subiendo' | 'ok'>('');
  const [error, setError] = useState('');
  const iniciales = session.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setEstado('subiendo');
    setUrl(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append('avatar', file);
    const res = await fetch('/api/auth/upload-avatar', { method: 'POST', body: fd }).catch(() => null);
    if (!res?.ok) {
      setError((await res?.json().catch(() => null))?.error ?? 'No se pudo subir la foto. Prueba con una imagen JPG o PNG más pequeña.');
      setUrl(session.avatarUrl);
      setEstado('');
      return;
    }
    setEstado('ok');
    router.refresh();
  }

  async function quitar() {
    setError('');
    const res = await fetch('/api/auth/upload-avatar', { method: 'DELETE' }).catch(() => null);
    if (!res?.ok) { setError('No se pudo quitar la foto'); return; }
    setUrl(null);
    setEstado('');
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center text-center py-2">
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        Aparece en el menú y ayuda a distinguir a cada persona si compartís el Hogar.
      </p>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Tu foto de perfil" width={112} height={112} className="w-28 h-28 rounded-full object-cover" />
      ) : (
        <div className="w-28 h-28 rounded-full bg-accent-mode text-on-accent grid place-items-center text-4xl font-semibold" aria-hidden="true">{iniciales}</div>
      )}
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        <Button variant={url ? 'secondary' : 'primary'} onClick={() => fileRef.current?.click()} disabled={estado === 'subiendo'}>
          {estado === 'subiendo' ? 'Subiendo…' : url ? 'Cambiar foto' : 'Elegir foto'}
        </Button>
        {url && estado !== 'subiendo' && <Button variant="ghost" onClick={quitar}>Quitar</Button>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={subir} aria-label="Foto de perfil" />
      <p className="text-[13px] mt-3 min-h-5" role="status" style={{ color: error ? 'var(--money-out)' : 'var(--text-muted)' }}>
        {error || (estado === 'ok' ? 'Foto guardada.' : 'Opcional: puedes hacerlo más tarde en Mi perfil.')}
      </p>
    </div>
  );
}

function PasoApariencia({ session, hogarDisponible }: { session: SessionUser; hogarDisponible: boolean }) {
  const a = useAppearance(session);
  return (
    <div className="space-y-5">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Los cambios se aplican al momento. Podrás ajustarlos cuando quieras en Mi perfil › Apariencia.</p>
      <div>
        <p id="tut-tema" className="fm-label">Tema</p>
        <ThemePicker a={a} labelId="tut-tema" />
      </div>
      <fieldset>
        <legend className="fm-label">Modo</legend>
        <ColorModePicker a={a} />
      </fieldset>
      <fieldset>
        <legend className="fm-label">Al iniciar sesión, abrir</legend>
        <ModoInicioPicker a={a} hogarDisponible={hogarDisponible} />
      </fieldset>
      {a.saveErr && <p role="alert" className="text-sm text-money-out font-medium">{a.saveErr}</p>}
    </div>
  );
}

/* ── Pasos de explicación ───────────────────────────────────────────────── */

function PasoParte({ icon, donde, children }: { icon: ReactNode; donde: string; children: ReactNode }) {
  return (
    <div className="py-1">
      <div className="flex items-center gap-3 mb-4">
        <span className="fm-caticon !w-12 !h-12 [&>svg]:!w-6 [&>svg]:!h-6" style={{ ['--fm-c' as string]: 'var(--accent-mode)' }} aria-hidden="true">{icon}</span>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{donde}</p>
      </div>
      <div className="space-y-3 text-[15px] leading-relaxed [&_strong]:font-semibold [&_strong]:text-[var(--text-primary)]" style={{ color: 'var(--text-secondary)' }}>
        {children}
      </div>
    </div>
  );
}

interface Paso { titulo: string; contenido: ReactNode }

export default function WelcomeTutorialModal({ session, hogarDisponible, onClose }: Props) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const cuerpoRef = useRef<HTMLDivElement>(null);
  const primeraVez = useRef(true);

  const pasos: Paso[] = [
    { titulo: 'Te damos la bienvenida a FinanceMe', contenido: <PasoBienvenida nombre={session.nombre} /> },
    { titulo: 'Tu foto de perfil', contenido: <PasoAvatar session={session} /> },
    { titulo: 'Elige cómo se ve', contenido: <PasoApariencia session={session} hogarDisponible={hogarDisponible} /> },
    {
      titulo: 'Personal y Hogar',
      contenido: (
        <PasoParte icon={<HomeIcon />} donde="Selector en el menú lateral · en el móvil, tocando tu avatar">
          <p>La aplicación tiene dos espacios con las mismas secciones. <strong>Personal</strong> es solo tuyo: nadie más ve tus datos.</p>
          <p><strong>Hogar</strong> es compartido por todos los usuarios para los gastos de la casa. Lo activa un administrador, y cada persona puede editar o solo consultar según su rol.</p>
          <p>Cada espacio tiene su color, así siempre sabes en cuál estás.</p>
        </PasoParte>
      ),
    },
    {
      titulo: 'Presupuesto',
      contenido: (
        <PasoParte icon={<ReceiptIcon />} donde="Menú › Presupuesto">
          <p>Es la base de todo: tus <strong>ingresos</strong> y <strong>gastos fijos</strong> de cada mes (alquiler, luz, nómina…), con su día de cobro.</p>
          <p>Antes de añadirlos, crea tus <strong>categorías</strong> y <strong>bancos</strong> desde Presupuesto › Categorías y Bancos. Cada categoría lleva un icono y un color que verás en toda la app.</p>
        </PasoParte>
      ),
    },
    {
      titulo: 'Mes',
      contenido: (
        <PasoParte icon={<CalendarIcon />} donde="Menú › Mes">
          <p>Cada mes empieza <strong>importando el Presupuesto</strong>: se rellena solo con tus fijos, recurrentes y ahorro.</p>
          <p>A partir de ahí anotas cada gasto con su fecha, categoría y banco. Los gastos se ven en rojo y los ingresos en verde, y puedes ordenar cualquier columna.</p>
        </PasoParte>
      ),
    },
    {
      titulo: 'Módulos',
      contenido: (
        <PasoParte icon={<ModulesIcon />} donde="Menú › Módulos">
          <p><strong>Recurrentes</strong>: suscripciones y pagos mensuales, trimestrales o anuales.</p>
          <p><strong>Ahorro anual</strong>: tu objetivo del año y lo que apartas cada mes. <strong>Objetivos</strong>: metas concretas con importe y fecha.</p>
          <p>En Hogar hay además <strong>Registros</strong> de luz y agua. Todo lo que configures aquí aparece solo en el Presupuesto.</p>
        </PasoParte>
      ),
    },
    {
      titulo: 'Avisos',
      contenido: (
        <PasoParte icon={<BellIcon />} donde="Menú › Avisos">
          <p>Los <strong>próximos pagos</strong> de este mes y del siguiente, sacados del Presupuesto y de Recurrentes.</p>
          <p>Activa las <strong>notificaciones</strong> y te avisamos en este dispositivo la víspera y el mismo día de cada pago.</p>
        </PasoParte>
      ),
    },
    {
      titulo: 'Resumen y Estadísticas',
      contenido: (
        <PasoParte icon={<GridIcon />} donde="Menú › Resumen · en el móvil, el botón central">
          <p>El <strong>Resumen</strong> es tu portada: balance del mes, calendario de pagos, ahorro y las categorías en las que más gastas.</p>
          <p>Desde ahí entras en <strong>Estadísticas</strong> para ver cómo evolucionan tus gastos, filtrando por periodo y categoría.</p>
        </PasoParte>
      ),
    },
    {
      titulo: 'Todo listo',
      contenido: (
        <div className="text-center py-4">
          <span className="fm-caticon !w-14 !h-14 mx-auto [&>svg]:!w-7 [&>svg]:!h-7" style={{ ['--fm-c' as string]: 'var(--money-in)' }} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </span>
          <p className="text-[15px] mt-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Te recomendamos empezar por el Presupuesto. Puedes volver a ver esta guía cuando quieras desde Mi perfil › Tutorial.
          </p>
        </div>
      ),
    },
  ];

  const ultimo = i === pasos.length - 1;

  // Al cambiar de paso, el foco va al contenido para que el lector de pantalla lo anuncie
  useEffect(() => {
    if (primeraVez.current) { primeraVez.current = false; return; }
    cuerpoRef.current?.focus();
  }, [i]);

  function empezar() {
    onClose();
    router.push('/personal/presupuesto');
  }

  return (
    <Modal title={pasos[i].titulo} onClose={onClose} width="560px"
      footer={
        <>
          {i > 0 && <Button onClick={() => setI(i - 1)}>Atrás</Button>}
          {ultimo
            ? <Button variant="primary" onClick={empezar}>Ir al Presupuesto</Button>
            : <Button variant="primary" onClick={() => setI(i + 1)}>{i === 0 ? 'Empezar' : 'Siguiente'}</Button>}
        </>
      }>
      <div className="flex items-center gap-3 -mt-1 mb-5">
        <div className="flex-1 flex gap-1" aria-hidden="true">
          {pasos.map((_, n) => (
            <span key={n} className="h-1 flex-1 rounded-full transition-colors" style={{ background: n <= i ? 'var(--accent-mode)' : 'var(--divider)' }} />
          ))}
        </div>
        <span className="text-[13px] tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>{i + 1} de {pasos.length}</span>
        {!ultimo && (
          <button type="button" onClick={onClose} className="text-[13px] font-medium shrink-0 min-h-8 px-1 hover:underline cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            Saltar
          </button>
        )}
      </div>
      <div ref={cuerpoRef} tabIndex={-1} className="outline-none min-h-[260px]">
        {pasos[i].contenido}
      </div>
    </Modal>
  );
}

'use client';

interface Props {
  onClose: () => void;
}

interface Section {
  title: string;
  body: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    title: '1. Configura tu Presupuesto Personal',
    body: (
      <>Lo primero es crear tu <strong>Presupuesto</strong> en el apartado Personal: son tus gastos
      fijos de cada mes y tus ingresos. Antes de añadirlos, crea tus <strong>categorías</strong> y{' '}
      <strong>bancos</strong>, ya que los filtros y las estadísticas se nutren de ellos.</>
    ),
  },
  {
    title: '2. Suscripciones y Ahorro',
    body: (
      <>Con el presupuesto creado, añade tus <strong>Suscripciones</strong> (si tienes) y ajusta tu{' '}
      <strong>objetivo de ahorro</strong>.</>
    ),
  },
  {
    title: '3. Tu primer Mes',
    body: (
      <>Crea tu primer <strong>Mes</strong> importando los datos desde el Presupuesto: se rellenará
      automáticamente con tus gastos e ingresos fijos. A partir de ahí, registra cada gasto del mes
      con su categoría, fecha y banco correspondientes.</>
    ),
  },
  {
    title: '4. Modo Hogar (opcional)',
    body: (
      <>Si eres administrador, puedes activar el <strong>Hogar</strong>: un espacio de control de
      gastos compartido por todos los usuarios. Revisa los usuarios y sus roles en Ajustes. Funciona
      igual que el Personal, salvo que en lugar de Suscripciones tiene un apartado de{' '}
      <strong>Registros de Luz y Agua</strong>, donde primero añades la compañía y luego vas anotando
      manualmente los consumos para ver el historial de gasto (estos registros no se generan desde el
      Presupuesto ni el Mes).</>
    ),
  },
  {
    title: '5. Resumen y estadísticas',
    body: (
      <>En <strong>Resumen</strong> encontrarás accesos a las estadísticas, un calendario de próximos
      pagos y un resumen general que se alimenta de tu Presupuesto.</>
    ),
  },
];

export default function WelcomeTutorialModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card rounded-3xl w-full max-w-xl flex flex-col max-h-[88dvh] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 shrink-0 px-5 pt-5 sm:px-8 sm:pt-8 pb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
            style={{ background: 'rgba(99,102,241,0.12)' }}
          >
            👋
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Bienvenido a FinanceMe
            </h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
              Guía rápida de cómo funciona la aplicación
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 space-y-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {SECTIONS.map(s => (
            <section key={s.title}>
              <h3 className="font-bold text-base mb-1.5" style={{ color: 'var(--text-primary)' }}>
                {s.title}
              </h3>
              <p className="leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="shrink-0 px-5 pb-5 pt-4 sm:px-8 sm:pb-8" style={{ borderTop: '1px solid var(--divider)' }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 2px 12px rgba(99,102,241,0.35)' }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

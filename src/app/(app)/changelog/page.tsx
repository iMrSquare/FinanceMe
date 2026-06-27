import VersionSeenMarker from '@/components/VersionSeenMarker';

export const metadata = { title: 'Novedades — FinanceMe' };

type Tipo = 'Novedades' | 'Mejoras' | 'Correcciones';

interface Grupo {
  tipo: Tipo;
  items: string[];
}

interface Release {
  version: string;
  fecha: string;
  destacado?: boolean;
  intro?: string;
  grupos: Grupo[];
}

const TIPO_META: Record<Tipo, { color: string; emoji: string }> = {
  Novedades: { color: '#10b981', emoji: '✨' },
  Mejoras: { color: '#6366f1', emoji: '🔧' },
  Correcciones: { color: '#f59e0b', emoji: '🐛' },
};

const RELEASES: Release[] = [
  {
    version: 'v1.4.0',
    fecha: '27 de junio de 2026',
    destacado: true,
    intro: 'Objetivos de ahorro, tutorial de bienvenida y un buen repaso de import/export y diseño.',
    grupos: [
      {
        tipo: 'Novedades',
        items: [
          'Objetivos de ahorro: crea objetivos concretos (importe y fecha límite) en Personal y Hogar, con cálculo automático de la aportación mensual necesaria y seguimiento del progreso.',
          'Tutorial de bienvenida: guía de inicio que explica el flujo de trabajo de la app, se muestra automáticamente la primera vez y se puede volver a abrir desde Mi Perfil.',
          'Iconos de información: botón desplegable en las páginas principales que explica para qué sirve cada apartado.',
          'Página de novedades (esta misma) accesible desde el número de versión del menú lateral.',
        ],
      },
      {
        tipo: 'Mejoras',
        items: [
          'La aportación mensual de los objetivos en progreso se añade automáticamente al Presupuesto, con categoría y banco configurables.',
          'Presupuesto: cabecera de tabla con color propio para distinguirla de los títulos de columna.',
          'Mes de Hogar: cabeceras de tabla unificadas con las de Personal (icono, tamaño y color).',
          'Menú lateral: iconos unificados según el modo (verde en Personal, azul en Hogar) y, en móvil, Resumen como botón central destacado con indicador de página.',
          'Mi Perfil: secciones organizadas en dos columnas en escritorio.',
        ],
      },
      {
        tipo: 'Correcciones',
        items: [
          'Import/Export Personal y Hogar: el backup ahora incluye todos los datos (objetivos de ahorro, ingresos fijos, presupuesto automático, registros de luz y agua) y deja de perder los campos de banco, cobro y vencimiento al importar.',
          'Personal: al sobrescribir o reimportar un mes, las filas automáticas (Suscripciones, Ahorro y Objetivos) se vuelven a generar, igual que en Hogar.',
          'Tutorial: en móvil se puede desplazar todo el contenido y el botón de cierre queda siempre accesible.',
          'Iconos de información: el desplegable ya no se sale de la pantalla en móvil.',
        ],
      },
    ],
  },
  {
    version: 'v1.0.0',
    fecha: '6 de junio de 2026',
    intro: 'Primera versión estable: Modo Personal completo y mejoras significativas al Modo Hogar.',
    grupos: [
      {
        tipo: 'Novedades',
        items: [
          'Modo Personal — Seguimiento mensual: registra gastos e ingresos mes a mes con categorías, bancos y fechas.',
          'Modo Personal — Presupuesto: gastos fijos y suscripciones como base del mes, con auto-rellenado al abrir un nuevo mes.',
          'Modo Personal — Estadísticas: gráficos de evolución de gastos por categoría con selector de período (3 meses, 6 meses, todo).',
          'Modo Personal — Gestión: administra tus categorías y bancos desde una sección dedicada.',
        ],
      },
      {
        tipo: 'Mejoras',
        items: [
          'Hogar — Nueva vista de mes rediseñada, más clara y consistente con el resto de la app.',
          'Hogar — Presupuesto con soporte de fecha de cobro, banco y vencimiento.',
          'Hogar — Calendario de pagos y próximos pagos integrados en el Resumen, tomando los datos del presupuesto.',
          'Hogar — Estadísticas con gráfico apilado por categoría, tarjetas de detalle y selector de período.',
        ],
      },
      {
        tipo: 'Correcciones',
        items: [
          'Import/Export Personal completo: el backup incluye meses, gastos, ingresos y configuración de presupuesto automático.',
          'Migración de préstamos: los registros de la tabla de préstamos se migran automáticamente a gastos al arrancar, sin pérdida de datos.',
          'Corrección de tipos en el menú lateral.',
        ],
      },
    ],
  },
  {
    version: 'v0.9.2',
    fecha: '24 de mayo de 2026',
    grupos: [
      {
        tipo: 'Correcciones',
        items: [
          'Corrección del avatar de usuario.',
          'Corrección del modal de inicio del módulo de Hogar.',
          'Mejoras en el README.',
        ],
      },
    ],
  },
  {
    version: 'v0.9.1',
    fecha: '24 de mayo de 2026',
    intro: 'Primera versión pública de FinanceMe, una aplicación web de gestión financiera para uso personal y del hogar.',
    grupos: [
      {
        tipo: 'Novedades',
        items: [
          'Hogar — Registro mensual de gastos compartidos, préstamos y gastos fijos.',
          'Hogar — Seguimiento de consumo de luz y agua con histórico de lecturas.',
          'Hogar — Resumen y estadísticas por mes.',
          'Personal — Control de gastos por categoría, suscripciones, ahorro mensual y presupuesto configurable.',
          'General — Autenticación con JWT y roles, import/export de datos, diseño responsive instalable como PWA y base de datos local SQLite.',
        ],
      },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <VersionSeenMarker />
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.12)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Novedades</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Historial de versiones de FinanceMe</p>
        </div>
        <a
          href="https://github.com/iMrSquare/FinanceMe"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ver en GitHub"
          title="Ver en GitHub"
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-colors"
          style={{ borderColor: 'var(--btn-border)', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.21.7.82.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
          </svg>
        </a>
      </div>

      {/* Releases */}
      <div className="space-y-6">
        {RELEASES.map(rel => (
          <div key={rel.version} className="glass-card rounded-3xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <span
                className="px-3 py-1 rounded-full text-sm font-bold text-white"
                style={{ background: rel.destacado ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'var(--text-muted)' }}
              >
                {rel.version}
              </span>
              {rel.destacado && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                  Actual
                </span>
              )}
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{rel.fecha}</span>
            </div>

            {rel.intro && (
              <p className="text-sm mt-2 mb-5" style={{ color: 'var(--text-secondary)' }}>{rel.intro}</p>
            )}

            <div className={rel.intro ? 'space-y-5' : 'space-y-5 mt-4'}>
              {rel.grupos.map(grupo => {
                const meta = TIPO_META[grupo.tipo];
                return (
                  <div key={grupo.tipo}>
                    <h3 className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: meta.color }}>
                      <span>{meta.emoji}</span>{grupo.tipo}
                    </h3>
                    <ul className="space-y-1.5">
                      {grupo.items.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-10 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        FinanceMe &copy; {new Date().getFullYear()} — <a href="https://imrsquare.com" target="_blank" rel="noopener noreferrer" className="hover:underline">imrsquare.com</a>
      </footer>
    </div>
  );
}

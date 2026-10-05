import { Sparkles, Wrench, Bug, type LucideIcon } from 'lucide-react';
import VersionSeenMarker from '@/components/VersionSeenMarker';
import PageHeader from '@/components/ui/PageHeader';

export const metadata = { title: 'Novedades' };

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

const TIPO_META: Record<Tipo, { color: string; Icon: LucideIcon }> = {
  Novedades: { color: 'var(--money-in)', Icon: Sparkles },
  Mejoras: { color: 'var(--accent-mode)', Icon: Wrench },
  Correcciones: { color: 'var(--color-warning)', Icon: Bug },
};

const RELEASES: Release[] = [
  {
    version: 'v0.1.4',
    fecha: '5 de octubre de 2026',
    destacado: true,
    intro: 'Control de lo que ya ha venido en el Mes, crear y eliminar cualquier mes, Recurrentes más flexibles y objetivo de ahorro mensual. Las versiones pasan a numerarse como 0.1.x.',
    grupos: [
      {
        tipo: 'Novedades',
        items: [
          'Mes: check en cada gasto para marcar lo que ya ha venido y filtro «Solo pendientes».',
          'Mes: crea cualquier mes, pasado o futuro, y elimínalo con doble confirmación y tu contraseña.',
          'Recurrentes: periodicidad bimensual y elección de los meses en que se cobra cada uno.',
          'Ahorro anual: el objetivo puede ser anual o mensual.',
        ],
      },
      {
        tipo: 'Mejoras',
        items: [
          'Notificaciones de Avisos más fiables.',
          'Presupuesto: las filas automáticas pasan a llamarse Modulares.',
          'Recurrentes en Total mensual: sin categoría ni banco por recurrente.',
          'Mes: «Tasa de ahorro» pasa a llamarse «Margen».',
          'Selectores más visibles en todos los temas, títulos de pestaña uniformes, textos de ayuda más cortos e inicio de sesión renovado.',
        ],
      },
      {
        tipo: 'Correcciones',
        items: [
          'Un mes pasado que desbloqueabas ya no se vuelve a bloquear solo al recargar.',
          'Aviso de la consola en la barra de progreso de Ahorro anual.',
        ],
      },
    ],
  },
  {
    version: 'v0.1.3',
    fecha: '26 de septiembre de 2026',
    intro: 'Nuevo diseño más sobrio y profesional, pensado también para el móvil, nueva sección Avisos con notificaciones en el dispositivo, Módulos para agrupar Registros, Recurrentes, Ahorro anual y Objetivos, Recurrentes también en Hogar, tablas ordenables y filtros avanzados en Estadísticas.',
    grupos: [
      {
        tipo: 'Novedades',
        items: [
          'Nuevo diseño en toda la aplicación: interfaz más sobria, tipografía IBM Plex Sans, cifras alineadas en columnas y superficies sólidas. Nuevo tema predeterminado, Institucional (azul marino, con los acentos verde de Personal y azul de Hogar de siempre), que sustituye a Clásico; también se retiran Monokai y Dracula, y quien los usaba pasa a Institucional. Ámbar, Vino y Contraste siguen disponibles en Mi perfil › Apariencia.',
          'Apariencia: nueva opción para elegir con qué modo, Personal u Hogar, se abre la aplicación al iniciar sesión o al abrir la app instalada.',
          'Iconos de categoría: cada categoría lleva un icono de su color, elegido en una galería de más de 160 iconos con buscador. Las categorías existentes reciben automáticamente uno según su nombre, y el icono aparece delante de cada gasto en el Mes y el Presupuesto.',
          'Categorías y Bancos (antes Gestión): nueva página común a Personal y Hogar, con paleta de colores, color personalizado y el icono de banco teñido con el color de cada banco.',
          'Navegación en el móvil: barra inferior con Resumen como botón central; cambio entre Personal y Hogar desde el menú de tu cuenta (avatar), donde también se accede a Mi perfil tocando tu tarjeta de usuario. La cabecera indica el modo activo con su color.',
          'Menú lateral contraíble en escritorio para ganar espacio; el modo activo se muestra bajo el nombre de la aplicación.',
          'Aviso de actualizaciones: los administradores ven cuándo hay una versión nueva publicada, con sus novedades y cómo actualizar en Configuración › Actualizaciones. Tras actualizar el servidor, quien tenga la aplicación abierta recibe un aviso para recargarla.',
          'Avisos (Personal y Hogar): lista de próximos pagos de este mes y del siguiente — gastos del Presupuesto con día de cobro y Recurrentes —, en color los próximos y en gris los que ya han pasado.',
          'Avisos: notificaciones en el dispositivo (Android, iOS y escritorio) la víspera y el mismo día de cada pago, activables por dispositivo y con botón de prueba. Requieren HTTPS; en iPhone/iPad, tener la app instalada en la pantalla de inicio (iOS 16.4+).',
          'Módulos (Personal y Hogar): nuevo apartado que agrupa las herramientas adicionales. En Hogar contiene Registros de luz y agua, Recurrentes, Ahorro anual y Objetivos; en Personal, Recurrentes, Ahorro anual y Objetivos. Ahorro anual y Objetivos pasan a ser dos módulos independientes en lugar de pestañas de una misma página.',
          'Recurrentes en Hogar: seguros, comunidad, IBI y otros pagos mensuales, trimestrales o anuales de la casa, con su fila automática en el Presupuesto.',
          'Recurrentes (antes Suscripciones): nueva opción, en la propia página de Recurrentes, para añadirlos al Presupuesto y al Mes como una línea con el total mensual o desglosados. Desglosados, cada uno lleva su importe, día de cobro, categoría y banco, que también se pueden cambiar tocando la fila en el Presupuesto. Los trimestrales y anuales solo se añaden en el mes en que se cobran.',
          'Tablas del Mes (Personal y Hogar): ordenables por cualquier columna pulsando su cabecera; el orden elegido se recuerda al volver.',
          'Estadísticas: filtros por periodo (último mes, 3, 6 o 12 meses, año actual, todo o un rango personalizado, incluidos años anteriores) y por categorías, recogidos en un desplegable que muestra el filtro activo y el total.',
        ],
      },
      {
        tipo: 'Mejoras',
        items: [
          'En el móvil, las tablas se muestran como listas con el icono de la categoría y la fecha, la categoría y el banco en una sola línea; los formularios se abren como hoja inferior, con campos y botones más grandes.',
          'Importes con el mismo formato en toda la aplicación (separador de miles y signo menos tipográfico); los gastos del Mes se muestran en rojo y los ingresos en verde.',
          'Confirmaciones breves al guardar o eliminar, estados vacíos con indicaciones de qué hacer y esqueletos de carga en lugar de pantallas en blanco.',
          'Diálogos más accesibles: se cierran con Escape, mantienen el foco del teclado dentro y lo devuelven al cerrar.',
          'Los emojis de la interfaz se sustituyen por iconos; los emojis que eliges para tus objetivos de ahorro se mantienen.',
          'Pantalla de inicio de sesión, Mi perfil y Configuración renovadas con el nuevo diseño. En Configuración, cada rol explica qué puede hacer y la lista de usuarios se adapta al móvil.',
          'Tutorial de bienvenida renovado, paso a paso: bienvenida, foto de perfil, apariencia (tema, modo claro u oscuro y modo de inicio) y una pantalla para cada parte básica de la aplicación. Se muestra una vez a todos los usuarios al actualizar; después, solo desde Mi perfil › Tutorial.',
          'La fila automática de los objetivos de ahorro en el Presupuesto y el Mes pasa a llamarse «Objetivos», igual que su módulo.',
          'Resumen renovado en Personal y Hogar: tarjeta inicial como la del Mes con el balance del mes, el Presupuesto, los Recurrentes, el Ahorro anual y los Objetivos, y cada cifra lleva a su sección. Próximos pagos, calendario más claro en el móvil, Recurrentes (ahora también en Hogar), categorías con más gasto y una gráfica de ingresos y gastos.',
          'Selector de temas con una vista previa de cada tema en el modo claro u oscuro que tengas activo.',
          'Suscripciones pasa a llamarse Recurrentes en toda la aplicación. Los enlaces antiguos redirigen automáticamente.',
          'Presupuesto, Recurrentes y tablas de gastos fijos usan la misma ordenación, ahora numérica en importes y días de cobro.',
          'Importar y exportar datos incluye los Recurrentes de Hogar y la configuración de redondeo y desglose de las filas automáticas.',
          'Accesibilidad: más contraste en los textos secundarios de todos los temas, cifras tabulares en las tablas y respeto de la preferencia del sistema de reducir animaciones.',
          'Nuevos iconos de instalación para Android (192 px y adaptativo) y aplicación renombrada a "FinanceMe".',
        ],
      },
      {
        tipo: 'Correcciones',
        items: [
          'Seguridad: varias rutas de datos de Hogar se podían consultar o modificar sin iniciar sesión; ahora requieren sesión y, para modificar, permisos de edición.',
          'Próximo cobro de los recurrentes trimestrales: se calcula a partir de su fecha de cobro original en lugar de contar desde el mes actual.',
          'Consultar los gastos o ingresos de un mes de Hogar inexistente ya no lo crea vacío.',
        ],
      },
    ],
  },
  {
    version: 'v0.1.2',
    fecha: '1 de agosto de 2026',
    intro: 'Tanda de correcciones tras el cambio de mes de julio a agosto: suscripciones que desaparecían del calendario, la cuota de Ahorro mensual mal calculada, el Mes de Hogar que se quedaba "atascado", y duplicados al importar datos.',
    grupos: [
      {
        tipo: 'Correcciones',
        items: [
          'Resumen (Personal): las suscripciones ya no desaparecen del calendario ni de "Próximos pagos" en cuanto pasa su día de cobro dentro del mes.',
          'Resumen (Personal): "Próximos pagos" pasa a "Próximos 10 pagos" (antes 5), mezclando gastos y suscripciones ordenados por fecha; en el calendario, cuando un día tiene muchos pagos, las suscripciones se muestran antes que los gastos ya registrados.',
          'Ahorro mensual automático (Presupuesto y Resumen, Personal y Hogar): ahora usa la misma cuota recalculada que la página de Ahorro (según lo aportado y los meses que quedan) en vez de una media fija del objetivo anual entre 12.',
          'Estadísticas (Personal y Hogar): el filtro de período por defecto se adapta al histórico disponible — 6 meses si los hay, si no 3, y si tampoco hay, el mes actual.',
          'Mes (Hogar): visitar la página de un mes ya no lo crea vacío en silencio — antes esto podía dejar sin efecto el botón "Crear mes" al no importar los gastos fijos; ahora se comporta igual que en Personal.',
          'Exportar Hogar: el backup incluye ahora también el objetivo anual de ahorro y sus aportaciones mensuales, que antes no se guardaban.',
          'Importar datos (Personal y Hogar): reimportar el mismo archivo ya no duplica gastos fijos, suscripciones, objetivos de ahorro, fijos ni registros de luz/agua — si se detectan registros ya existentes, se avisa y se puede elegir sobrescribirlos o mantener los actuales.',
          'Importar objetivos de ahorro (Personal y Hogar): se restaura también el emoji, que se perdía al importar.',
        ],
      },
    ],
  },
  {
    version: 'v0.1.1',
    fecha: '31 de julio de 2026',
    intro: 'Nueva sección de Apariencia en Mi Perfil (temas, modo claro/oscuro/sistema y colores de acento), candado por Mes, Objetivos de ahorro con botones de añadir/retirar, y un Resumen renovado en Personal y Hogar con categorías con más gasto y filtros de Estadísticas más completos.',
    grupos: [
      {
        tipo: 'Novedades',
        items: [
          'Apariencia (Mi Perfil): nueva tarjeta para elegir tema — Clásico, Ámbar, Monokai, Dracula, Vino o Contraste — cada uno con su propia paleta de colores y forma de esquinas.',
          'Apariencia: modo claro, oscuro o según el sistema, ahora seleccionable desde Mi Perfil (antes solo había un interruptor claro/oscuro en el menú lateral).',
          'Apariencia: colores de acento de Personal y Hogar personalizables de forma independiente al tema elegido, con opción de restablecer al valor del tema.',
          'Nuevo logo de la aplicación, actualizado también en el favicon y el icono de instalación.',
          'Mes (Personal y Hogar): candado para bloquear o desbloquear la imputación de gastos e ingresos; los meses vencidos se bloquean automáticamente y se pueden desbloquear para corregir datos.',
          'Objetivos de ahorro (Personal y Hogar): emoji junto al nombre, botones de Añadir y Retirar dinero (en vez de editar el total a mano), y el porcentaje sobre la barra de progreso con "300 € de 500 €" debajo.',
          'Resumen (Personal y Hogar): rediseñado con accesos directos a Presupuesto, Mes y Ahorro desde las tarjetas principales, calendario de próximos pagos que toma los gastos reales del Mes, y nueva tarjeta de categorías con más gasto de los últimos 6 meses.',
          'Resumen (Hogar): nueva tarjeta con los últimos registros de Luz y Agua.',
          'Estadísticas (Personal y Hogar): nuevos filtros de período "Mes actual" y "Año actual", además de los ya existentes.',
        ],
      },
      {
        tipo: 'Mejoras',
        items: [
          'Mi Perfil reorganizado: perfil de usuario y cambiar contraseña juntos en una columna; apariencia, tutorial y tus datos personales en la otra.',
          'La pantalla de inicio de sesión se muestra siempre en tema claro, para que el acceso sea consistente sea cual sea tu tema elegido.',
          'El logo de la aplicación (escritorio y móvil) cambia entre modo Hogar y Personal al pulsarlo.',
          'Objetivo anual de ahorro: admite aportaciones en 0 o negativas para marcar meses sin aportación o con retirada, y recalcula la cuota mensual dinámicamente según el progreso.',
          'Registros de Luz y Agua: gráfica de consumo (kWh/m³) siempre visible junto a la de importe, con el mismo color.',
          'Estadísticas: el selector de período pasa a ser un desplegable, más cómodo en móvil y sin problemas de desbordamiento.',
          'Ajustes pasa a llamarse Configuración en el menú lateral.',
        ],
      },
      {
        tipo: 'Correcciones',
        items: [
          'Registros de luz y agua: la gráfica de importes sigue ahora el color del tema y de la cabecera de su tabla — antes se quedaba siempre en negro y no reaccionaba al cambiar de tema.',
          'Menú lateral (forma colapsada): el menú de usuario ya no aparece cortado o invisible al pulsarlo.',
          'La tematización del usuario se guarda en la base de datos: el tema elegido se aplica igual entrando desde cualquier dispositivo.',
          'Objetivo anual de ahorro: corregido el cálculo de la cuota mensual cuando el mes en curso ya tenía una aportación registrada.',
          'Estadísticas: la flecha del desplegable de período ya no se sale de la tarjeta en Safari para iOS.',
        ],
      },
    ],
  },
  {
    version: 'v0.1.0',
    fecha: '18 de julio de 2026',
    intro: 'Primera versión estable de FinanceMe: Modo Personal completo, mejoras significativas al Modo Hogar, Objetivos de ahorro, tutorial de bienvenida y una notable tanda de fiabilidad en Presupuesto, Gestión y Mes.',
    grupos: [
      {
        tipo: 'Novedades',
        items: [
          'Modo Personal — Seguimiento mensual: registra gastos e ingresos mes a mes con categorías, bancos y fechas.',
          'Modo Personal — Presupuesto: gastos fijos y suscripciones como base del mes, con auto-rellenado al abrir un nuevo mes.',
          'Modo Personal — Estadísticas: gráficos de evolución de gastos por categoría con selector de período (3 meses, 6 meses, todo).',
          'Modo Personal — Gestión: administra tus categorías y bancos desde una sección dedicada.',
          'Objetivos de ahorro: crea objetivos concretos (importe y fecha límite) en Personal y Hogar, con cálculo automático de la aportación mensual necesaria y seguimiento del progreso.',
          'Tutorial de bienvenida: guía de inicio que explica el flujo de trabajo de la app, se muestra automáticamente la primera vez y se puede volver a abrir desde Mi Perfil.',
          'Iconos de información: botón desplegable en las páginas principales que explica para qué sirve cada apartado.',
          'Página de novedades (esta misma) accesible desde el número de versión del menú lateral.',
          'Mes: solo se puede crear el mes actual o, como máximo, el siguiente; el resto se van habilitando a medida que avanza el calendario.',
          'Suscripciones: nuevo interruptor para activar o desactivar el redondeo al alza del total mensual en la fila automática del Presupuesto.',
          'Presupuesto: los gastos con fecha de vencimiento se eliminan automáticamente en cuanto esa fecha queda atrás.',
          'Ahorro (Hogar): nueva pestaña "Objetivo anual", igual que en Personal — define un objetivo de ahorro anual, sigue el desglose mes a mes y visualiza el progreso, junto a los objetivos de ahorro concretos ya existentes.',
          'Presupuesto (Hogar): nueva fila automática "Ahorro mensual" (objetivo anual ÷ 12), con categoría y banco configurables, igual que en Personal.',
          'Mes: la tarjeta de Balance añade el estado "Neutro" (gris, con "=") cuando ingresos y gastos coinciden exactamente, junto a Superávit y Déficit.',
        ],
      },
      {
        tipo: 'Mejoras',
        items: [
          'Hogar — Nueva vista de mes rediseñada, más clara y consistente con el resto de la app.',
          'Hogar — Presupuesto con soporte de fecha de cobro, banco y vencimiento.',
          'Hogar — Calendario de pagos y próximos pagos integrados en el Resumen, tomando los datos del presupuesto.',
          'Hogar — Estadísticas con gráfico apilado por categoría, tarjetas de detalle y selector de período.',
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
          'Import/Export Personal completo: el backup incluye meses, gastos, ingresos y configuración de presupuesto automático.',
          'Migración de préstamos: los registros de la tabla de préstamos se migran automáticamente a gastos al arrancar, sin pérdida de datos.',
          'Corrección de tipos en el menú lateral.',
          'Import/Export Personal y Hogar: el backup ahora incluye todos los datos (objetivos de ahorro, ingresos fijos, presupuesto automático, registros de luz y agua) y deja de perder los campos de banco, cobro y vencimiento al importar.',
          'Personal: al sobrescribir o reimportar un mes, las filas automáticas (Suscripciones, Ahorro y Objetivos) se vuelven a generar, igual que en Hogar.',
          'Tutorial: en móvil se puede desplazar todo el contenido y el botón de cierre queda siempre accesible.',
          'Iconos de información: el desplegable ya no se sale de la pantalla en móvil.',
          'Gestión: al crear o editar una categoría o banco y volver a Presupuesto, la lista se actualiza al instante sin recargar la página.',
          'Vencimiento: formato de fecha unificado (DD-MM-AAAA) en los presupuestos de Personal y Hogar.',
          'Presupuesto: las categorías y bancos con fondo claro ya muestran el texto en color oscuro para mejorar la legibilidad.',
          'Objetivos de ahorro: el selector de mes y año vuelve a funcionar correctamente en Safari.',
          'Hogar: la fila automática de Objetivos de ahorro ya se suma al total de Gastos Fijos.',
          'En móvil, las filas automáticas del Presupuesto (Suscripciones, Ahorro, Objetivos) ya se pueden editar tocándolas, igual que el resto de filas.',
          'El contador de conceptos de la tabla de Gastos Fijos ya tiene en cuenta las filas automáticas.',
          'Gestión (móvil): al escribir un nombre largo de categoría o banco, el campo ya no empuja el botón OK fuera de la pantalla.',
          'Editar una categoría o un banco: el cambio de nombre se propaga ahora a todos los gastos, gastos fijos y configuraciones automáticas que ya lo usaban, tanto en Hogar como en Personal.',
          'Mes de Hogar: la tabla de Gastos usa el mismo contraste automático de texto que el resto de la app, en vez de texto blanco fijo sobre colores claros.',
          'Presupuesto de Hogar: al volver de Gestión, la tabla de gastos, los ingresos y las filas automáticas se actualizan al instante sin recargar la página.',
          'Presupuesto de Hogar: los filtros de categoría y banco muestran ahora todas las categorías y bancos configurados en Gestión, no solo los que ya se usan en algún gasto.',
          'Mes: al importar el Presupuesto para crear un mes nuevo, las filas automáticas de Ahorro mensual y Objetivos de ahorro ya incluyen la categoría y el banco configurados.',
        ],
      },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <VersionSeenMarker />
      <PageHeader title="Novedades" subtitle="Historial de versiones de FinanceMe"
        actions={
          <a
            href="https://github.com/iMrSquare/FinanceMe"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver en GitHub"
            title="Ver en GitHub"
            className="w-11 h-11 rounded-[var(--radius-control)] grid place-items-center border transition-colors hover:bg-[var(--btn-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-mode)]"
            style={{ borderColor: 'var(--btn-border)', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.21.7.82.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
            </svg>
          </a>
        } />

      <div className="space-y-5">
        {RELEASES.map(rel => (
          <article key={rel.version} className="fm-card p-5 sm:p-7" aria-labelledby={`rel-${rel.version}`}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id={`rel-${rel.version}`} className="text-xl font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{rel.version}</h2>
              {rel.destacado && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'color-mix(in srgb, var(--accent-mode) 12%, transparent)', color: 'var(--accent-mode)' }}>
                  Actual
                </span>
              )}
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{rel.fecha}</span>
            </div>

            {rel.intro && (
              <p className="text-[15px] mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{rel.intro}</p>
            )}

            <div className="space-y-5 mt-5">
              {rel.grupos.map(grupo => {
                const { color, Icon } = TIPO_META[grupo.tipo];
                return (
                  <section key={grupo.tipo}>
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Icon className="w-4 h-4" style={{ color }} aria-hidden="true" />{grupo.tipo}
                    </h3>
                    <ul className="space-y-2 pl-6">
                      {grupo.items.map((item, i) => (
                        <li key={i} className="relative text-sm leading-relaxed before:content-[''] before:absolute before:-left-4 before:top-[0.6em] before:w-1 before:h-1 before:rounded-full before:bg-[var(--text-muted)]"
                          style={{ color: 'var(--text-secondary)' }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      <footer className="mt-10 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        FinanceMe &copy; {new Date().getFullYear()} · <a href="https://imrsquare.com" target="_blank" rel="noopener noreferrer" className="hover:underline">imrsquare.com</a>
      </footer>
    </div>
  );
}

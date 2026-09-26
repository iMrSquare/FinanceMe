# Design System Master File — FinanceMe

> **LÓGICA:** al construir una página concreta, comprueba primero
> `design-system/financeme/pages/[nombre-pagina].md`.
> Si existe, sus reglas **sobrescriben** este Master.
> Si no existe, sigue estrictamente las reglas de aquí.

Este documento describe el sistema **ya construido y en producción** de FinanceMe
(no una propuesta genérica) — es la foto real del código a fecha 2026-09-26,
auditada contra las reglas de `ui-ux-pro-max` y con los huecos reales marcados
en **Recomendaciones pendientes**.

---

**Proyecto:** FinanceMe — gestión financiera personal y del hogar (gastos, ingresos,
préstamos, suscripciones, luz/agua, presupuesto, objetivos de ahorro).
**Categoría:** Personal Finance Tracker (PWA autenticada, no landing pública).
**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Chart.js / react-chartjs-2 · idioma de interfaz: español.
**Auditado:** 2026-09-26 · **Actualizado:** v1.2.0.

---

## 1. Arquitectura de color (3 capas, en `globals.css`)

El color **no se hardcodea nunca** en los componentes: todo pasa por custom
properties CSS que cambian según `[data-theme]` y `.dark`. Cualquier componente
nuevo debe usar estas variables (o las utilidades Tailwind que las exponen vía
`@theme inline`: `bg-accent-personal`, `text-error`, `ring-accent-hogar`, etc.),
nunca un hex suelto.

- **Tier 1 — Semántico** (`--color-success/error/warning/info` + su variante
  `-dark` para hover/pressed). Invariante entre temas, solo cambia claro/oscuro.
- **Tier 2 — Acento + forma, por tema** (`--accent-personal`, `--accent-hogar`,
  `--accent-primary(-dark)`, y la escala de radios `--radius-lg/xl/2xl/3xl`).
- **Tier 3 — Superficie + texto, por tema × claro/oscuro** (`--bg-page`,
  `--bg-sidebar`, `--bg-card`, `--border-card`, `--text-primary/secondary/muted`,
  `--row-hover`, `--sidebar-hover-bg/c`, `--divider`, `--btn-border/hover`).

### Temas disponibles (`AppearanceCard.tsx`)

| id | Nombre visible | Acento primario | Radios | Personalidad |
|---|---|---|---|---|
| `indigo` | Clásico (default) | `#6366f1` | Redondeado (0.5–1.5rem) | Neutro, SaaS |
| `ambar` | Ámbar | `#ffbc23` | Redondeado | Cálido, dorado sobre gris casi negro |
| `monokai` | Monokai | `#f92672` | Anguloso (0.25–0.75rem) | Editor de código |
| `dracula` | Dracula | `#bd93f9` | Anguloso | Púrpura/cian clásico |
| `rosa` | Vino | `#db2777` | Redondeado | Magenta/rosa |
| `contraste` | Contraste | `#171717` (`#000` dark) | Anguloso | Blanco/negro puro, máximo contraste |

Cada tema fija también `--accent-personal` / `--accent-hogar` (para distinguir
visualmente las secciones "Personal" vs "Hogar" en toda la app) y puede
sobrescribirse por usuario vía `accentPersonal`/`accentHogar` en su sesión
(`RootLayout` los inyecta como inline `style` sobre `<html>`).

**Colores semánticos (Tier 1, iguales en los 6 temas):**

| Rol | Claro | Oscuro |
|---|---|---|
| Success | `#10b981` | `#34d399` |
| Error | `#ef4444` | `#f87171` |
| Warning | `#f59e0b` | `#fbbf24` |
| Info | `#0ea5e9` | `#38bdf8` |

Esto ya coincide con la convención estándar para dashboards financieros
(verde ganancia / rojo pérdida / ámbar aviso) — no tocar sin motivo.

---

## 2. Tipografía

- **Fuente única:** Inter (`next/font/google`, subset `latin`), aplicada en
  `body` vía `inter.className`. No hay una segunda familia para headings.
- **Por qué es correcta para este producto:** alta legibilidad a tamaños
  pequeños, buen soporte de cifras tabulares, es el estándar de facto en
  fintech/dashboards. **No cambiar** solo por seguir una recomendación genérica.
- Tamaño base de cuerpo: 16px (heredado, sin overrides que lo bajen).
- Idioma: español (`lang="es"` en `<html>`) — cualquier copy nuevo debe ir en
  español, coherente con el resto de la UI.

---

## 3. Iconografía

- Set **propio** en `src/components/icons.tsx`: SVG outline, `viewBox="0 0 24 24"`,
  `strokeWidth="1.75"`, `strokeLinecap/Linejoin="round"`, tamaño base `w-4 h-4`
  (16px), escalable por prop `className`.
- Estética deliberadamente alineada con Lucide (que también está en
  `package.json` como dependencia, pero el set custom es el que se usa en la
  práctica) — **mantener el mismo `strokeWidth` (1.75) y viewBox (24×24)** al
  añadir iconos nuevos para no romper la consistencia visual.
- Cero emojis como iconos en toda la base — correcto, mantener así.

---

## 4. Layout, navegación y touch targets

- **Desktop (`lg:` y superior):** sidebar fija (`Sidebar.tsx`), colapsable.
- **Secciones (ambos modos):** Resumen · Mes · Presupuesto · Módulos · Avisos.
  Módulos usa `ModulesIcon` (capas) para no confundirse con el `GridIcon` de Resumen.
- **Mobile (`< lg`):** navbar superior fija de 56px (`h-14`) + barra de
  navegación inferior fija (`fixed bottom-0`) con safe-area
  (`.pb-safe-nav` = `padding-bottom: 5rem + env(safe-area-inset-bottom)`,
  reducido a `2.5rem` en `lg:`).
- **Tamaños táctiles ya verificados ≥ 44×44px:** ítems de la barra inferior
  (`h-14`), FAB central (`w-14 h-14`, 56px), avatares de menú (`w-11 h-11`,
  44px). Cumple la regla de touch target de `ui-ux-pro-max` (prioridad 2,
  CRITICAL) — no reducir por debajo de 44px al tocar estos componentes.
- Contenedores en `max-w-5xl mx-auto`, sin anchos fijos en px que rompan en
  móvil.

---

## 5. Componentes y utilidades reutilizables (`globals.css`)

| Clase | Uso | Notas |
|---|---|---|
| `.glass-card` | Tarjetas con `backdrop-filter: blur(12px)` + `--bg-card` translúcido + `--border-card` + sombra `--shadow-card` | Glassmorphism como estilo secundario, coherente con la recomendación "Personal Finance Tracker → Glassmorphism" de la base de datos |
| `.theme-table` | Tablas de registros/movimientos: header uppercase 11px sobre `--bg-page`, filas con `--divider` y hover `--row-hover` | Usar siempre esta clase en listados de movimientos en lugar de estilos ad-hoc |
| `.pb-safe-nav` | Padding inferior con safe-area para el contenido bajo la bottom nav | Aplicar en cualquier página nueva con scroll bajo la nav móvil |
| Transición global | `*, *::before, *::after { transition: background-color, border-color, color 0.2s ease }` | Da el cambio de tema instantáneo pero suave; no dupliques transiciones de color en componentes |

---

### Patrones añadidos en v1.2.0

| Pieza | Dónde | Regla |
|---|---|---|
| `useTableSort` + `SortableTh` | `src/components/SortableTable.tsx` | Toda tabla ordenable usa este hook (texto/número/fecha, vacíos al final, orden recordado en `localStorage` con `storageKey` propio). La cabecera es un `<button>` dentro del `<th>` con `aria-sort` y área ≥44px (`th.sortable-th` en `globals.css`). |
| Hub de Módulos | `src/components/modulos/ModulosHub.tsx` | Tarjetas `.glass-card` con icono, descripción y un dato resumen. Para añadir un módulo, se añade una entrada al array de la página `/{personal,hogar}/modulos`. Cada módulo lleva `BackToModulos` arriba. |
| Avisos | `src/components/avisos/*` | Próximos pagos en color de acento del ámbito, «hoy/mañana» en `--color-warning` y los pasados en `--text-muted` tachados. La tarjeta de notificaciones explica siempre por qué no se pueden activar (HTTPS, iOS sin instalar, permiso bloqueado). |
| Modal de fila automática | `src/components/AutoConfigModal.tsx` | Mismo modal para Recurrentes, Ahorro y Objetivos en ambos presupuestos. Las opciones excluyentes van como control segmentado (`aria-pressed`), no como selects. |
| Filtros de Estadísticas | `src/components/estadisticas/EstadisticasView.tsx` | Periodos como control segmentado, rango con `MonthYearInput` (prop `years`), categorías como chips conmutables con el color de la categoría. |

## 6. Espaciado y radios

- No hay una escala `--space-*` custom: se usa la escala por defecto de
  Tailwind (múltiplos de 4px). Mantenerla — no introducir una escala paralela.
- Los radios **sí son un token de marca por tema** (Tier 2): temas
  "redondeados" (indigo, ambar, rosa) usan `0.5/0.75/1/1.5rem` para
  `lg/xl/2xl/3xl`; temas "angulosos" (monokai, dracula, contraste) usan
  `0.25/0.375/0.5/0.75rem`. Al maquetar un componente nuevo, usa `rounded-lg`
  / `rounded-xl` / etc. (que Tailwind resuelve contra estas variables) en vez
  de un radio fijo en px, para que respete el tema activo.

---

## 7. Recomendaciones pendientes (hallazgos reales de la auditoría)

Verificados con cálculo de contraste WCAG real sobre los valores actuales de
`globals.css` (no es una suposición genérica):

### 7.1 — `--text-muted` no cumplía WCAG AA en 5 de 6 temas — ✅ CORREGIDO (2026-09-26)

Ratio de contraste de `--text-muted` contra `--bg-page` (mínimo exigido para
texto normal: **4.5:1**). Aplicado en `globals.css` en el `:root` fallback,
`.dark` genérico y los 6 bloques `[data-theme="..."]` / `[data-theme="..."].dark`:

| Tema | Claro (antes → ahora) | Oscuro (antes → ahora) |
|---|---|---|
| indigo | `#94a3b8` (2.39:1) → `#5e718d` (**4.64:1**) | `#64748b` (3.75:1) → `#72839a` (**4.61:1**) |
| ambar | `#8b8f99` (3.02:1) → `#6c707b` (**4.62:1**) | `#6b7280` (3.91:1) → `#767e8c` (**4.62:1**) |
| monokai | `#a39e8c` (2.52:1) → `#76705e` (**4.65:1**) | `#75715e` (3.03:1) → `#94907a` (**4.62:1**) |
| dracula | `#9aa0c4` (2.36:1) → `#626ca4` (**4.60:1**) | `#6272a4` (3.03:1) → `#8592b8` (**4.61:1**) |
| rosa | `#c98fac` (2.40:1) → `#a9517d` (**4.62:1**) | `#a06a86` — ya cumplía (**4.59:1**), sin cambios |
| contraste | `#737373` — ya cumplía (**4.74:1**), sin cambios | `#a3a3a3` — ya cumplía (**8.33:1**), sin cambios |

Las 12 combinaciones (6 temas × claro/oscuro) cumplen ahora AA. El tono de cada
tema se mantuvo (mismo matiz, solo se ajustó la luminosidad).

### 7.2 — `prefers-reduced-motion` — ✅ HECHO (v1.2.0)

Bloque `@media (prefers-reduced-motion: reduce)` en `globals.css` que anula
animaciones y transiciones. Cualquier animación nueva lo respeta sin más.

### 7.3 — Cifras con `tabular-nums` — ✅ HECHO (v1.2.0)

`.theme-table td` usa `font-variant-numeric: tabular-nums`. En importes fuera de
`.theme-table` (tarjetas de resumen, Avisos, Estadísticas) se usa la utilidad
Tailwind `tabular-nums`. Hazlo igual en cualquier cifra nueva.

### 7.4 — `cursor-pointer` inconsistente (Prioridad 2, bajo impacto)

Solo 13 de 75 archivos `.tsx` usan `cursor-pointer` explícito. Los `<button>`
sin `cursor-pointer` explícito heredan el cursor por defecto del navegador
(no siempre "mano"). No es bloqueante, pero conviene añadir
`cursor-pointer` de forma sistemática a botones/elementos clicables nuevos.

---

## 8. Anti-patrones específicos de este proyecto

- ❌ No metas un hex suelto en un componente — usa las custom properties de
  Tier 1/2/3 o las utilidades Tailwind que las exponen.
- ❌ No añadas un 7º tema sin repetir el cálculo de contraste de la sección 7.1
  para sus 4 combinaciones (texto-muted/secundario × claro/oscuro).
- ❌ No mezcles radios fijos en px con la escala `--radius-*` del tema activo.
- ❌ No dupliques estilos de tabla ad-hoc — usa `.theme-table`.
- ❌ Nada de emojis como iconos; sigue el estilo del set en `icons.tsx`.

## Checklist de accesibilidad general (ya cumplido salvo lo listado en §7)

- [x] Sin emojis como iconos
- [x] Touch targets ≥ 44×44px en nav móvil
- [x] Transiciones de color 150–300ms (200ms)
- [x] Sin scroll horizontal (contenedores `max-w-*` + Tailwind responsive)
- [x] Safe-area respetada en PWA (`.pb-safe-nav`)
- [x] Contraste AA en `--text-muted` (ver §7.1 — corregido)
- [x] `prefers-reduced-motion` (ver §7.2)
- [x] `tabular-nums` en cifras (ver §7.3)

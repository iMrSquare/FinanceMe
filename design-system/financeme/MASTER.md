# Design System Master File — FinanceMe

> **LÓGICA:** al construir una página concreta, comprueba primero
> `design-system/financeme/pages/[nombre-pagina].md`.
> Si existe, sus reglas **sobrescriben** este Master.
> Si no existe, sigue estrictamente las reglas de aquí.

Foto real del sistema **«Libro de cuentas»** introducido en v1.2.0 (2026-09-26).
Sustituye al estilo anterior (glassmorphism, degradados, Inter, emojis).

---

**Proyecto:** FinanceMe — finanzas personales y del hogar (presupuesto, meses,
recurrentes, ahorro, registros de luz/agua, avisos).
**Categoría:** Personal Finance Tracker (PWA autenticada, no landing pública).
**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Chart.js · lucide-react · interfaz en español.

**Principio:** una app de dinero tiene que parecer un libro de cuentas bien
llevado. Superficies sólidas, cifras alineadas, color solo con significado
(entra / sale / ahorro / modo activo) y cero decoración.

---

## 1. Color (en `globals.css`)

Nunca un hex suelto en un componente: todo pasa por custom properties que
cambian con `[data-theme]` y `.dark`, o por las utilidades de `@theme inline`.

### Tokens semánticos (úsalos primero)

| Token | Utilidad Tailwind | Uso |
|---|---|---|
| `--money-in` | `text-money-in` | Ingresos, saldo positivo, «cumplido» |
| `--money-out` | `text-money-out` | Gastos (importes del Mes en rojo), déficit, errores de formulario, acciones destructivas |
| `--saving` | `text-saving` | Ahorro y objetivos |
| `--accent-mode` | `bg-accent-mode`, `text-accent-mode` | Acento del modo activo: navegación, foco, botón primario, tabs |
| `--on-accent` | `text-on-accent` | Texto sobre `--accent-mode` |
| `--radius-control / card / modal` | `rounded-[var(--radius-card)]`… | Radios por jerarquía (control < tarjeta < modal) |

`--accent-mode` resuelve a `--accent-personal` o `--accent-hogar` según
`<html data-ambito>`, que fija `Sidebar.tsx`. Sin ámbito (login) usa Hogar.

Superficie y texto (por tema × claro/oscuro): `--bg-page`, `--bg-card`,
`--border-card`, `--divider`, `--row-hover`, `--btn-border`, `--btn-hover`,
`--text-primary/secondary/muted`.

`--color-success/error/warning/info` siguen existiendo para avisos genéricos
(p. ej. «hoy/mañana» en Avisos usa `--color-warning`).

### Temas (`AppearanceCard.tsx`)

| id | Nombre | Personal | Hogar | Notas |
|---|---|---|---|---|
| `institucional` | **Institucional (predeterminado)** | `#10b981` | `#0ea5e9` | Tinta `#172033` sobre `#f4f6f8`; oscuro `#0e1623`. Acentos heredados de Clásico; `--on-accent` oscuro (`#0e1623`) porque el blanco no llega a 4,5:1 |
| `ambar` | Ámbar | `#34d399` | `#38bdf8` | Oscuro cálido |
| `rosa` | Vino | `#e11d48` | `#c026d3` | Redondeado |
| `contraste` | Contraste | `#059669` | `#2563eb` | Blanco/negro |

Clásico (`indigo`), Monokai y Dracula se retiraron en v1.2.0: la migración pasa
a sus usuarios a `institucional` y `layout.tsx` hace lo mismo con cualquier tema
desconocido. Los acentos se pueden personalizar por
usuario (`accentPersonal` / `accentHogar`).

Contraste verificado AA en Institucional claro y oscuro (texto, muted,
money-in/out, on-accent). Ojo: el acento como color de texto sobre blanco
(`#10b981`, `#0ea5e9`) queda por debajo de 4,5:1; úsalo en texto solo junto a
un icono o con peso 600, nunca como único portador de información. Si añades un tema, repite el cálculo.

### Chart.js

El canvas no entiende `var()` ni `color-mix()`. Lee el valor con
`getComputedStyle(document.documentElement).getPropertyValue('--token')` y pasa
hex o `rgba(r,g,b,a)` (usa los tokens `*-rgb`).

---

## 2. Tipografía

- **IBM Plex Sans** (`next/font/google`, pesos 400/500/600). Sobria, con
  cifras claras y aire institucional.
- El peso máximo es **600**: `.font-bold/.font-extrabold/.font-black` se
  reducen a 600 en `globals.css`. No cargues 700.
- `body { font-feature-settings: "tnum" 1 }`: todas las cifras son tabulares.
- Escala: título de página 24/28px semibold (`PageHeader`), sección 16px,
  cuerpo 15–16px, meta 13–14px. Nada por debajo de 12px.
- **Sentence case siempre.** Sin etiquetas en mayúsculas ni tracking amplio.
- Importes con `formatEUR(n, { signo?, decimales? })` de `src/lib/format.ts`
  (separador de miles siempre y signo menos tipográfico «−»).

---

## 3. Iconografía

- Interfaz: set propio de `src/components/icons.tsx` (outline, 24×24, trazo
  1.75) y `lucide-react` cuando falte algo. Mismo trazo y tamaño.
- **Categorías:** `src/lib/categoryIcons.ts` — 167 iconos lucide en 13 grupos
  con palabras clave en español. `sugerirIcono(nombre)` asigna uno por nombre;
  `getCategoryIcon(id)` lo resuelve; `<CategoryIconGlyph iconId>` lo pinta.
- **Bancos:** siempre `BANK_ICON` (Landmark) teñido con el color del banco.
- **Cero emojis en la interfaz.** Única excepción: el emoji que el usuario elige
  para cada objetivo de ahorro (es contenido suyo).

---

## 4. Layout y navegación

- **Secciones (ambos modos):** Resumen · Mes · Presupuesto · Módulos · Avisos.
- **Módulos:** Recurrentes, Ahorro anual y Objetivos (+ Registros en Hogar). Hub
  en 2 columnas en móvil y 3 en escritorio; un módulo nuevo es una entrada más
  en el array de su `page.tsx`.
- **Inicio:** `/` redirige en servidor al modo de inicio del usuario
  (`users.modo_inicio`, Apariencia) si tiene acceso; si no, a Personal.
- **Escritorio (≥1024px):** barra lateral contraíble. Logo + «FinanceMe» y el
  modo activo debajo, tabs Personal/Hogar con su color (se ocultan al contraer).
- **Móvil (<1024px):**
  - Cabecera «FinanceMe · Personal» con el modo en su color.
  - Barra inferior de 5 ítems con Resumen como botón central (FAB sin
    etiqueta, con `aria-label`).
  - El avatar abre la hoja «Tu cuenta»: tarjeta de usuario (lleva a Mi perfil),
    selector Personal/Hogar, Configuración (admin), Cerrar sesión y versión.
- Contenido bajo la barra inferior con `.pb-safe-nav` (safe-area incluida).
- Touch targets ≥44px: `Button` md = 44px, ítems de lista ≥64px, inputs 44px.
- Sin scroll horizontal a 375px: tablas → listas por debajo de 640px.

---

## 5. Primitivas (`src/components/ui/` + `.fm-*` en `globals.css`)

| Pieza | Uso |
|---|---|
| `PageHeader` | Título, subtítulo, `info` (InfoExpand) y `actions`. `stackOnMobile` pasa las acciones bajo el título. |
| `Button` / `IconButton` | Variantes `primary · secondary · ghost · danger`, tamaños `md · sm`, `icon`, `href`, `compactOnMobile` (solo icono en móvil). `IconButton` exige `label`. `buttonClasses()` para `<label>` de subida de ficheros. |
| `Summary` | Cifra protagonista + 2–4 cifras secundarias (`fm-summary`). Tonos: `in · out · saving · neutral`. |
| `Section` | Tarjeta con cabecera (barra de color, título, contador, total, acciones). |
| `.fm-table` / `.fm-list` | La misma colección se pinta como tabla (≥640px) y como lista (<640px). En lista: icono de categoría delante, título y meta separada por « · ». |
| `SortableTh` + `useTableSort` / `SortSelect` | Ordenación recordada en `localStorage`. En móvil, `SortSelect` en `.fm-sortbar`. |
| `CategoryBadge` / `CategoryChip` / `BankChip` | Icono en cuadrado tintado (`fm-caticon`) o chip con icono de color y texto neutro. En oscuro el color se aclara con `color-mix`. |
| `Modal` | Centrado en escritorio y hoja inferior en móvil. Escape, foco atrapado y devuelto. `footer` con botones. |
| `ConfirmDialog` | Confirmación. `danger` (por defecto) pinta el botón en `--money-out`; `danger={false}` para acciones no destructivas (Importar). |
| `SettingsCard` / `FormError` | Tarjeta de ajustes (título, descripción, icono, acciones) y error de formulario con `role="alert"`. |
| `PasswordForm` / `PasswordChecklist` | Cambio de contraseña con requisitos en vivo; reutilizado en Mi perfil, cambio obligatorio y Configuración. |
| `Switch` | Interruptor accesible (`role="switch"`) con etiqueta y descripción. |
| `IconPicker` | Galería de iconos de categoría con buscador y grupos. |
| `EmptyState` / `SkeletonRows` / `useToast` | Vacío con indicación de qué hacer, esqueleto de carga y aviso breve (`ToastProvider` en `(app)/layout`). |
| `.fm-input` / `.fm-label` | Campos de 44px con texto de 16px (sin zoom en iOS) y etiqueta visible siempre. |
| `.fm-tabs` / `.fm-tab` | Pestañas (Ahorro, selector de modo). |

Vistas compartidas entre Personal y Hogar (una sola implementación, parametrizada
por `scope`): `MesView`, `PresupuestoView`, `GestionView` (Categorías y Bancos),
`AhorroView` (`vista="anual" | "objetivos"`: dos módulos, sin pestañas), `RecurrentesClient`, `AvisosClient`, `EstadisticasView`,
`RegistroServicioView` (luz/agua).

---

## 6. Estados y feedback

- Guardar o eliminar → `toast('Gasto guardado')`. El verbo del botón y el del
  aviso coinciden.
- Errores → junto al formulario con `FormError`, diciendo qué pasó y cómo
  arreglarlo. Sin disculpas ni mensajes vagos.
- Cargas → `SkeletonRows`, no spinners a pantalla completa.
- Listas vacías → `EmptyState` con la acción que las llena.
- Movimiento: 150–200 ms, solo como respuesta a una acción (abrir hoja, aviso).
  `prefers-reduced-motion` lo anula todo.

---

## 7. Anti-patrones

- ❌ `glass-card`, `backdrop-filter`, degradados o sombras de color.
- ❌ Hex suelto en componentes (salvo la paleta que elige el usuario, `PALETA`).
- ❌ Etiquetas en MAYÚSCULAS, `font-bold` para jerarquía (usa tamaño y color).
- ❌ Emojis o «✓ / ✗» como iconos o prefijos de mensaje.
- ❌ Hover con `onMouseEnter` / `onMouseLeave`: usa clases `hover:`.
- ❌ Botones de solo icono sin `aria-label` (usa `IconButton`).
- ❌ Tablas que desbordan en móvil: añade siempre la variante `.fm-list`.
- ❌ Duplicar una vista para Personal y Hogar: parametriza por `scope`.

## Checklist antes de entregar

- [ ] Sin scroll horizontal a 375 / 390 / 430px, en claro y oscuro
- [ ] Touch targets ≥44px y foco visible (`--accent-mode`)
- [ ] Etiqueta visible en cada campo; errores junto al campo
- [ ] Importes con `formatEUR` y color semántico
- [ ] Probado en Institucional y al menos en un tema oscuro alternativo

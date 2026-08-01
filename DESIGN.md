---
name: Nómina Clara
description: Verificación de nómina colombiana con transparencia legal verificable
colors:
  azul-clara: "#2563eb"
  azul-clara-hover: "#1d4ed8"
  azul-clara-ring: "#dbeafe"
  azul-clara-deep: "#1d4ed8"
  azul-clara-bright: "#60a5fa"
  azul-clara-dark-surface: "#93c5fd"
  tinta: "#1a1a2e"
  tinta-nota: "#4b5563"
  tinta-suave: "#6b7280"
  tinta-clara: "#e2e8f0"
  tinta-nota-clara: "#94a3b8"
  tinta-suave-clara: "#8494a8"
  fondo: "#f0f2f5"
  superficie: "#ffffff"
  superficie-hover: "#f8fafc"
  fondo-oscuro: "#0f172a"
  superficie-oscura: "#1e293b"
  superficie-oscura-hover: "#253349"
  borde: "#e5e7eb"
  borde-fuerte: "#949494"
  borde-oscuro: "#334155"
  borde-fuerte-oscuro: "#64748b"
  verde-pago: "#10b981"
  verde-pago-bg: "#d1fae5"
  verde-pago-texto: "#065f46"
  rojo-reclamo: "#dc2626"
  rojo-reclamo-bg: "#fee2e2"
  rojo-reclamo-texto: "#991b1b"
  rojo-reclamo-oscuro: "#f87171"
  rojo-reclamo-oscuro-bg: "#7f1d1d"
  rojo-reclamo-oscuro-texto: "#fca5a5"
  ambar-aviso: "#f59e0b"
  ambar-aviso-bg: "#fef3c7"
  ambar-aviso-texto: "#92400e"
  ambar-aviso-oscuro: "#fbbf24"
  ambar-aviso-oscuro-bg: "#78350f"
  ambar-aviso-oscuro-texto: "#fde68a"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  mono:
    fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace"
    fontSize: "0.875rem"
    fontWeight: 400
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  xxl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
  xxxl: "32px"
  xxxxl: "40px"
  xxxxxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.azul-clara}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.azul-clara-hover}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-danger:
    backgroundColor: "{colors.rojo-reclamo}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  input:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.xl}"
    padding: "24px"
  badge:
    backgroundColor: "{colors.verde-pago-bg}"
    textColor: "{colors.verde-pago-texto}"
    rounded: "9999px"
    padding: "4px 12px"
---

# Design System: Nómina Clara

## Overview

**Creative North Star: "La Ventana Transparente"**

Nómina Clara es una ventana a través de la cual el trabajador colombiano ve su pago con la ley a la vista: cada número muestra su fórmula y su referencia legal, y la interfaz existe para que esa verificación sea posible. El sistema visual es sobrio y orientado a datos — claridad profesional, como un documento legal bien redactado — donde el color se reserva para acción y estado, nunca para decoración.

La densidad es media: formularios claros, tablas legibles, tarjetas que agrupan sin competir. La jerarquía tipográfica es discreta (un sistema de pesos y tamaños, no una escala expresiva). El ritmo espacial es generoso y consistente (escala de 4px). El sistema soporta dos temas completos — claro y oscuro — que remapean roles semánticos en lugar de invertir mecánicamente, y prioriza accesibilidad AA: contraste verificado por pares calculados, foco visible, navegación por teclado y soporte de `prefers-reduced-motion`.

**Key Characteristics:**
- Claridad sobria: acción, selección, estado y lectura compiten por jerarquía; la decoración no compite.
- Transparencia estructural: los datos legales (citas, fórmulas, referencias) se presentan tan legibles como los resultados.
- Tokens de doble tema: cada rol tiene un par claro/oscuro deliberado, no una inversión.
- Predecible y confiable: botones, inputs y tarjetas se comportan de forma consistente en toda la app.

## Colors

Paleta de roles claros: un azul de acción, grises neutros de lectura y un semáforo para estados, con pares dedicados por tema.

### Primary
- **Azul Clara** (#2563eb): acción principal — botón primario, links, foco visible y estado activo de navegación. Es el único acento; su rareza es su fuerza.
- **Azul Clara Hover** (#1d4ed8): estado hover del botón primario y links.
- **Azul Clara Ring** (#dbeafe): halo de foco de inputs en tema claro.
- **Azul Clara Bright** (#60a5fa): azul de links y foco en tema oscuro (contraste AA sobre superficies oscuras).
- **Azul Clara Dark Surface** (#93c5fd): fondo del botón primario en tema oscuro, con texto oscuro para cumplir AA.

### Neutral
- **Tinta** (#1a1a2e): texto principal en tema claro (15.2:1 sobre fondo).
- **Tinta Nota** (#4b5563): texto secundario — subtítulos, encabezados de tabla, referencias legales (7.6:1).
- **Tinta Suave** (#6b7280): texto terciario — hints de formulario, placeholders, refs legales menores (4.8:1).
- **Tinta Clara** (#e2e8f0): texto principal en tema oscuro.
- **Tinta Nota Clara** (#94a3b8) / **Tinta Suave Clara** (#8494a8): secundario/terciario en tema oscuro.
- **Fondo** (#f0f2f5): fondo de página claro. **Superficie** (#ffffff): tarjetas, inputs, navbar.
- **Superficie Hover** (#f8fafc): hover de filas, items, botones secundarios.
- **Borde** (#e5e7eb) / **Borde Fuerte** (#949494): separadores decorativos vs. límites de control (3:1 en inputs).
- Tema oscuro: **Fondo Oscuro** (#0f172a), **Superficie Oscura** (#1e293b), **Superficie Oscura Hover** (#253349), bordes #334155 / #64748b.

### Tertiary (estados)
- **Verde Pago** (#10b981): éxito. Par claro: fondo #d1fae5, texto #065f46 (6.8:1). Par oscuro: #34d399 / #064e3b / #a7f3d0.
- **Rojo Reclamo** (#dc2626): peligro/error. Par claro: #fee2e2 / #991b1b (6.8:1). Oscuro: #f87171 / #7f1d1d / #fca5a5.
- **Ámbar Aviso** (#f59e0b): advertencia. Par claro: #fef3c7 / #92400e (6.4:1). Oscuro: #fbbf24 / #78350f / #fde68a.

### Named Rules
**La Regla del Rol Único.** El azul es para acción, selección y foco. Nunca para decoración, subtítulos o bordes de tarjeta. Si algo no es accionable, no es azul.
**La Regla del Par Verificable.** Todo color de estado se define como par fondo+texto con contraste AA verificado por tema; nunca se usa el color puro como texto sobre superficie (fallaría 1.4.3).

## Typography

**Display Font:** System sans stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto, 'Helvetica Neue', sans-serif)
**Body Font:** Misma stack sans.
**Label/Mono Font:** 'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace — exclusivamente para dinero y medidas.

**Character:** Una voz neutral y legible del sistema; sin personalidad decorativa. La tipografía se apoya en pesos y espaciado, no en fuentes distintivas — consistente con la claridad sobria.

### Hierarchy
- **Display** (700, 1.875rem → 2.25rem en desktop, 1.2): h1 de página — Calculadora, Comparar, Liquidación.
- **Headline** (600, 1.25rem, 1.3): h2 dentro de tarjetas, con borde inferior.
- **Title** (600, 1.125rem, 1.4): h3 — secciones dentro de página (causales, efectos, registros).
- **Body** (400, 1rem, 1.6): texto base, párrafos educativos. Medida máxima ~600px en subtítulos.
- **Label** (600, 0.875rem, 1.4): etiquetas de campo, botones, headers de tabla.
- **Mono** (400, 0.875rem): montos monetarios (clase `.monetary`), fórmulas.

### Named Rules
**La Regla del Dinero en Mono.** Todo monto se formatea con `formatCOP()` y se muestra en la pila mono; nunca en sans. El dinero se reconoce por su forma tipográfica.

## Layout

Contenedor centrado con ancho máximo de **1100px** y padding lateral de `var(--space-4)` (16px) en móvil, `space-6` (24px) desde 640px y `space-8` (32px) desde 1024px. Navbar sticky de 60px con borde inferior.

Sistema de espaciado de 4px: xs 4, sm 8, md 12, lg 16, xl 20, xxl 24, xxxl 32, xxxxl 40, xxxxxl 48. El ritmo agrupa contenido relacionado (gap 12–16px) y separa secciones (margen 24–40px).

Responsive: 1 columna por defecto; grid de 2 columnas (`.grid-2col`) desde 1024px; horas-grid de 2 columnas desde 640px. El menú de navegación colapsa a un drawer lateral de 260px bajo 640px. Tablas con overflow-x scrollable en móvil (`.table-wrapper`).

## Elevation & Depth

Sistema **ligero y estructural**: sombras suaves con offset real que marcan jerarquía, nunca brillo decorativo. Las tarjetas descansan sobre el fondo con sombra media y los elementos superpuestos (menú móvil, diálogo, tooltip) usan las sombras mayores.

### Shadow Vocabulary
- **Ambient Low** (`0 1px 2px rgba(0,0,0,0.05)`): hover sutil, superficies planas.
- **Ambient** (`0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`): tarjetas en reposo.
- **Lifted** (`0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)`): elementos elevados — menú móvil, diálogo, tooltip.
- **Lifted X** (`0 8px 24px rgba(0,0,0,0.1)`): diálogos y overlays superiores.
- En tema oscuro las sombras son más profundas (alpha 0.2–0.4) porque la elevación debe percibirse sobre superficie oscura.

### Named Rules
**La Regla Plana-en-Reposo.** Las superficies son planas en reposo; la sombra aparece como respuesta a estado o jerarquía, nunca por defecto generalizado.

## Shapes

Lenguaje de esquinas suaves y consistentes sobre escala de radio: **sm 6px, md 8px, lg 10px, xl 12px, xxl 16px**. Tarjetas en xxl (16px), botones e inputs en md (8px), items internos (causales, registros) en lg (10px), chips/badges en píldora completa (9999px).

Los bordes son de 1px: decorativos en #e5e7eb, pero los **controles** (inputs, selects, textarea, fecha) usan el borde fuerte (#949494 / #64748b) para cumplir 3:1 como límite de componente (1.4.11). El foco de inputs es borde azul + halo de 3px del color de anillo.

## Components

Componentes predecibles y confiables: la acción se ve, el estado se ve, y el comportamiento nunca sorprende.

### Buttons
- **Shape:** esquinas md (8px), sin sombra en reposo.
- **Primary:** fondo Azul Clara (#2563eb) con texto blanco; hover Azul Clara Hover (#1d4ed8); padding 12px 24px (`.btn`), peso 600, tamaño sm (14px). En tema oscuro: fondo Azul Clara Dark Surface (#93c5fd) con texto oscuro (#0f172a) — inversión deliberada para AA.
- **Secondary:** transparente, borde de color, texto Tinta; hover sube superficie-hover y oscurece el borde.
- **Danger:** Rojo Reclamo (#dc2626) con blanco (4.83:1); hover reduce opacidad.
- **Small / Icon:** `.btn-small` para filas de tabla; `.btn-icon` cuadrado de 44px (touch target AA).
- **Active state:** `transform: translateY(1px)` en `:active`.

### Cards / Containers
- **Corner Style:** xxl (16px).
- **Background:** Superficie (#ffffff / #1e293b) con borde 1px.
- **Shadow Strategy:** Ambient en reposo (ver Elevation).
- **Internal Padding:** 24px (móvil) → 32px (tablet+).

### Inputs / Fields
- **Style:** borde fuerte 1px (#949494 / #64748b), fondo superficie, radio md (8px), padding 12px 16px. Aplica a number, text, date, select y textarea.
- **Focus:** borde Azul Clara + halo `0 0 0 3px` del anillo (ring light #dbeafe / dark surface); outline removido.
- **Hints:** `.field-hint` bajo el campo, Tinta Suave (12px), con contraste AA.
- **Error:** alert de peligro con `role="alert"` cerca del campo; validación `noValidate` con mensajes específicos.

### Navigation
- **Style:** navbar sticky 60px, fondo navbar-bg, borde inferior.
- **Brand:** Tinta, peso 700, 20px, con icono 📋 decorativo (`aria-hidden`).
- **Default / Hover / Active:** links en Tinta Nota; hover superficie-hover; activo fondo Azul Clara Ring + texto Azul Clara Deep (5.5:1).
- **Mobile (<640px):** hamburguesa 44px con `aria-expanded`/`aria-controls`; drawer lateral 260px con overlay; cierre con Esc y return focus; links 44px mínimo. Theme toggle 44px.

### Chips / Badges
- **Style:** píldora (9999px), padding 4px 12px, tamaño xs (12px), peso 600. Variantes: success (fondo verde-bg + texto verde-texto), muted (fondo borde-light + texto muted).

### Alerts
- **Style:** bloque con fondo de par de estado, texto de par, borde 1px del color puro, radio md, padding 16px. Variantes: success / danger / warning, cada una con `role="alert"` (error) o `role="note"` (informativo).

### Tables
- **Style:** encabezados Tinta Nota 600 con borde inferior 2px; celdas con borde inferior 1px; hover de fila superficie-hover. `th scope="col"` explícito. Overflow-x en contenedor.

### Tooltip
- **Style:** trigger con cursor help y `data-tip`; burbuja de 240px sobre el texto (fondo Tinta, texto Fondo — inversión); visible en hover y `:focus-visible`; outline azul en foco.

### Signature Component: SuspensionSection (educational + tracking)
- Sección de tarjeta con causales legales (CST Arts. 51/53), tabla de efectos asimétricos por prestación, formulario de registro (select causal, fechas, radios obligatorios para disciplina), lista de registros con warnings (Art. 112) y footnotes con fuentes oficiales. Patrón: educa primero, registra después, con citas legales visibles en cada línea.

## Do's and Don'ts

### Do:
- **Do** usar tokens CSS de `:root` / `[data-theme="dark"]` para todo color, radio y sombra — nunca hex suelto fuera de la definición del token.
- **Do** verificar contraste AA por par calculado al tocar colores (texto ≥4.5, límites de control ≥3).
- **Do** mostrar fórmulas y citas legales junto a cada resultado — es el producto.
- **Do** mantener el focus visible (borde azul + ring) en todos los controles.
- **Do** conservar los pares de estado dedicados (fondo+texto) por tema.
- **Do** usar `role="alert"` para errores y `role="note"` para avisos informativos.

### Don't:
- **Don't** usar el color puro de éxito/peligro/aviso como texto sobre superficie (falla 1.4.3) — usa el par `*-text`.
- **Don't** inventar citas legales o cambiar la postura "educativo, no asesoría legal".
- **Don't** aplicar el azul a elementos no accionables.
- **Don't** usar `transition: all` — transiciona propiedades específicas.
- **Don't** renderizar montos fuera de la pila mono con `formatCOP()`.
- **Don't** tocar los límites de 44px de touch targets en móvil.

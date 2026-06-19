# Modernización visual — EDEA.PRO (paleta original)

Documentación del rediseño visual del frontend público y de los paneles
(administrador, empleado, cliente), manteniendo la paleta de colores
original del proyecto y sumando tipografía, glassmorphism y animaciones
modernas.

Cambio **únicamente visual**: no se modificó ninguna ruta, controlador,
modelo, middleware, API, autenticación, permisos ni la base de datos.

> Nota: este proyecto tuvo una iteración previa con una paleta "Golden
> Latte" que fue revertida a pedido del usuario (queda guardada en
> `git stash` por si se necesita recuperar). Esta es la versión vigente.

## 1. Paleta de colores

### Principales

| Token | Hex | Uso |
|---|---|---|
| `--color-bg` | `#f4f3ea` | Fondo base cálido de las páginas |
| `--color-surface` | `#f4f4f4` | Paneles, secciones alternas, inputs, filas de tabla en hover |
| `--color-metal` | `#ae9d81` | Acento metálico — bordes, subtítulos, elementos decorativos |
| `--color-metal-text` | `#8B6F4E` | Variante oscura del metálico, para texto legible (subtítulos largos) |
| `--color-text` | `#333333` | Texto secundario / cuerpo |
| `--color-heading` | `#050505` | Texto principal, encabezados, header/footer/sidebar (fondo oscuro) |

### Secundarios / acento

| Token | Hex | Uso |
|---|---|---|
| `--color-cta` | `#f0ab06` | CTA principal, estado activo, precios, estrellas |
| `--color-cta-dark` | `#d69a05` | Hover de botones CTA |
| `--color-info` | `#00a7b5` | Filtros/tabs activos (navegación), badges informativos |
| `--color-success` | `#7eb56a` | Éxito — semántico, sin cambios |
| `--color-special` | `#7671a6` | Notificaciones especiales / marcador "hoy" en el calendario |

**Regla de contraste:** ningún fondo `--color-cta` (dorado) lleva texto
blanco — el contraste es insuficiente (~1.8:1). Siempre texto
`--color-heading` (#050505) sobre fondos dorados o teal.

**Regla de "activo" en toda la app:**
- **Dorado (`--color-cta`)** = acción/selección (CTA, paso activo del
  stepper, día/hora elegidos en la agenda, precio destacado).
- **Teal (`--color-info`)** = navegación activa (filtro de categoría
  seleccionado, tab seleccionado, link de sidebar activo).
- **Púrpura (`--color-special`)** = aviso decorativo puntual (marcador
  "hoy" en el calendario de la agenda).
- **Verde/rojo/amarillo semánticos** = estados de éxito/error/pendiente,
  **sin cambios** en ningún archivo (no forman parte de la identidad).

## 2. Tipografía

- **Outfit** (encabezados, h1–h6, nombres de marca) — pesos 400–800.
- **Inter** (cuerpo de texto, inputs, botones) — pesos 400–700.
- Cargadas vía Google Fonts en el `<head>` de las 21 páginas que antes
  usaban Montserrat.

## 3. Efectos modernos

- **Glassmorphism** en el header del sitio público: fondo
  `rgba(5,5,5,.75)` + `backdrop-filter: blur(10px)`, ahora `position:
  sticky` para que el efecto se note al hacer scroll sobre el contenido.
- **Bordes animados metal→dorado** en tarjetas de servicio
  (`.service-card`, `.service`, `.card` de Nosotros) mediante un
  degradado lineal animado o una franja superior con `linear-gradient`.
- **Superficies oscuras premium**: header, footer, sidebar de admin y
  empleado, y el carrito lateral / encabezado de confirmación de la
  agenda usan el mismo fondo `#050505`/`#000000` para una identidad
  consistente de "panel oscuro".

## 4. Dónde viven las variables

Igual que antes, no hay Tailwind/Bootstrap real en el sitio — las
variables son CSS custom properties declaradas en el `:root` de la hoja
que carga primero en cada área:

- **Sitio público**: `estilos/principal.css` (compartidas por
  `nosotros.css`, `servicios.css`, `ubicacion.css`, `cliente/perfil.css`).
- **Login** (`login.html`, standalone): `login.css` define su propio
  `:root` con los mismos valores.
- **Agenda** (`agenda.html`, standalone): mantiene su sistema de
  variables propio (`--bark`, `--caramel`, etc.), reasignado a la nueva
  paleta — ver comentario al inicio de `agenda.css`.
- **Panel Administrador / Empleado**: `administrador/estilos/base.css`
  y `empleado/estilos/base.css`.

## 5. Lo que NO se tocó (a propósito)

- **Colores de estado semánticos** (verde éxito, rojo error/cancelar,
  badges de "pendiente"): se mantienen exactamente igual en todos los
  archivos.
- **`administrador/estilos/segundaria.css` y
  `empleado/estilos/segundaria.css`**: no están enlazados desde ningún
  HTML, se dejaron sin tocar (huérfanos de una versión anterior).
- **Reglas de modo oscuro para login** dentro de `darkmode.css`
  (`.welcome-panel`, `.input-group`, etc.): existen en el archivo pero
  `login.html` nunca carga `darkmode.css`, así que son inertes — se
  recolorearon por consistencia pero no tienen efecto visible hoy.
- **`.sidebar a.active`** en admin/empleado: se agregó el estilo (teal
  info) pero ningún HTML/JS marca actualmente la página activa en el
  sidebar — queda listo para usarse si se agrega esa lógica.

## 6. Archivos modificados

```
21 archivos .html — enlace de Google Fonts (Outfit + Inter en vez de Montserrat)
public/edeapro/estilos/principal.css
public/edeapro/estilos/nosotros.css
public/edeapro/estilos/servicios.css
public/edeapro/estilos/ubicacion.css
public/edeapro/estilos/login.css
public/edeapro/estilos/agenda.css
public/edeapro/estilos/base.css                  (huérfano, actualizado por consistencia)
public/edeapro/estilos/darkmode.css
public/edeapro/administrador/estilos/base.css
public/edeapro/administrador/estilos/principal.css
public/edeapro/empleado/estilos/base.css
public/edeapro/empleado/estilos/principal.css
public/edeapro/cliente/perfil.css
public/edeapro/scripts/agenda.js                 (stroke del check SVG)
public/edeapro/scripts/ubicacion.js               (color inline)
public/edeapro/cliente/perfil.js                  (color inline)
public/edeapro/administrador/scripts/estadisticas.js (color de una barra del gráfico)
public/edeapro/paginas/ubicacion.html              (dos estilos inline)
```

Ningún archivo PHP, de rutas, controladores, modelos, middleware o
migraciones fue modificado.

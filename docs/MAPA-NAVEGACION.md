# Mapa de Navegación — EDEA Grooming

## Entrada
- `/edeapro/index.html` → redirige a `paginas/inicio.html`

## Sitio público (`/edeapro/`)
| Página | Ruta |
|---|---|
| Inicio | `paginas/inicio.html` |
| Nosotros | `paginas/nosotros.html` |
| Servicios | `paginas/servicios.html` (perro corto, perro largo, corte especializado, gatos) |
| Agenda / Agendar cita | `paginas/agenda.html` |
| Ubicación | `paginas/ubicacion.html` |
| Login | `paginas/login.html` |
| Nueva contraseña | `paginas/nueva-contrasena.html` |

### Servicios (subpáginas)
- `paginas/perrocorto.html`
- `paginas/perrolargo.html`
- `paginas/corteespecializado.html`
- `paginas/gatos.html`

## Cliente (`/edeapro/cliente/`)
- `perfil.html` (perfil, mascotas, citas, pagos, reagendar/cancelar)

## Administrador (`/edeapro/administrador/`)
- `paginas/inicio.html`
- `paginas/clientes.html`
- `paginas/empleados.html`
- `paginas/servicios.html`
- `paginas/horarios.html`
- `paginas/notificaciones.html`
- `paginas/pagos.html`
- `paginas/reportes.html`
- `paginas/estadisticas.html`

## Empleado/Peluquero (`/edeapro/empleado/`)
- `paginas/inicio.html`
- `paginas/clientes.html`
- `paginas/disponibilidad.html`
- `paginas/reportes.html`

## Navegación dinámica (navbar.js)
- Sin sesión: botón "Inicio de Sesión" → login; "Agendar cita" → login
- Cliente: login → `../cliente/perfil.html` ("Mi perfil"); agendar → `agenda.html`
- Admin: login → `../administrador/paginas/inicio.html` ("Panel Admin")
- Peluquero: login → `../empleado/paginas/inicio.html` ("Mi panel")

## API (Laravel) — endpoints clave
- Auth: `POST /login`, `POST /registro`, `POST /logout`
- Recuperación: `POST /recuperar-contrasena`, `POST /restablecer-contrasena`
- Públicas: `GET /citas/{servicios,adicionales,estilistas,slots}`, `GET /resenas`, `GET /estilistas`
- Cliente: `/cliente/*`
- Admin: `/admin/*`, `/reportes/*`
- Empleado: `/empleado/*`

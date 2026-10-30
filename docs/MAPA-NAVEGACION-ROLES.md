# Mapas de navegación por rol

Este documento describe los accesos y destinos de navegación visibles en el frontend de EDEA.PRO. Los diagramas reflejan las páginas HTML y los enlaces presentes actualmente en `public/edeapro`; no representan permisos de backend que no estén expuestos como enlaces.

## Sitio público y visitante

El visitante puede consultar las páginas informativas. La agenda requiere iniciar sesión como cliente: el menú conduce a login cuando no existe sesión y permite ir a la agenda si la sesión activa corresponde a un cliente.

```mermaid
flowchart TD
    Inicio[Inicio público]
    Servicios[Servicios]
    Nosotros[Nosotros]
    Ubicacion[Ubicación]
    Login[Inicio de sesión]
    Agenda[Agendar cita]
    Registro[Registro de cliente]
    Recuperar[Recuperar contraseña]
    Perfil[Perfil del cliente]
    Admin[Panel administrador]
    Empleado[Panel empleado]

    Inicio --> Servicios
    Servicios --> PerroCorto[Perro pelo corto]
    Servicios --> PerroLargo[Perro pelo largo]
    Servicios --> Gatos[Gatos]
    Servicios --> Corte[Corte especializado]
    Inicio --> Nosotros
    Inicio --> Ubicacion
    Inicio -->|Sin sesión| Login
    Inicio -->|Cliente autenticado| Agenda
    Login --> Registro
    Login --> Recuperar
    Login -->|Autenticación correcta: cliente| Perfil
    Login -->|Autenticación correcta: administrador| Admin
    Login -->|Autenticación correcta: peluquero| Empleado
    Agenda --> Perfil
```

## Cliente

El cliente llega a su perfil desde el enlace de sesión del sitio. El perfil está organizado en información personal, mascotas y las pestañas de citas y pagos. Desde la sección de citas puede consultar filtros y acciones disponibles para cancelar o reagendar; también puede volver a la agenda desde la navegación principal.

```mermaid
flowchart TD
    Sitio[Menú público]
    Login[Inicio de sesión]
    Agenda[Agenda de citas]
    Perfil[Mi perfil]
    Datos[Datos personales]
    Mascotas[Mis mascotas]
    Citas[Pestaña: Citas]
    Filtros[Filtros: todas / día / semana / mes]
    Historial[Historial de citas por mascota]
    Cancelar[Cancelar cita con motivo]
    Reagendar[Seleccionar nueva fecha y hora]
    Pagos[Pestaña: Pagos]
    Publico[Páginas públicas]
    Salir[Cerrar sesión]

    Sitio -->|Sin sesión| Login
    Sitio -->|Cliente autenticado| Agenda
    Login -->|Acceso cliente| Perfil
    Agenda --> Perfil
    Perfil --> Datos
    Perfil --> Mascotas
    Mascotas --> Historial
    Perfil --> Citas
    Citas --> Filtros
    Citas --> Cancelar
    Citas --> Reagendar
    Perfil --> Pagos
    Perfil --> Publico
    Perfil --> Salir
    Salir --> Sitio
```

## Empleado / peluquero

El acceso público cambia a “Mi panel” cuando hay una sesión de peluquero. La página `inicio.html` funciona como destino inicial; la etiqueta del menú de esa página actualmente dice “Servicios”.

```mermaid
flowchart TD
    Login[Inicio de sesión]
    Panel[Panel de empleado]
    Inicio[Inicio: paginas/inicio.html<br/>menú: Servicios]
    Clientes[Clientes]
    Agenda[Mi agenda / disponibilidad]
    Reportes[Reportes]
    PDF[Reporte de citas PDF]
    Excel[Reporte de citas Excel]
    Sitio[Menú público]
    Salir[Cerrar sesión]

    Login -->|Rol peluquero| Panel
    Panel --> Inicio
    Inicio --> Clientes
    Inicio --> Agenda
    Inicio --> Reportes
    Reportes --> PDF
    Reportes --> Excel
    Panel --> Sitio
    Panel --> Salir
    Salir --> Sitio
```

## Administrador

El administrador entra al panel desde el sitio público después de autenticarse. El panel `index.html` redirige a `paginas/inicio.html`, que concentra la navegación a los módulos de gestión.

```mermaid
flowchart TD
    Login[Inicio de sesión]
    Panel[Panel de administración]
    Citas[Citas]
    Horarios[Horarios / disponibilidad]
    Clientes[Clientes]
    Servicios[Servicios]
    Empleados[Empleados]
    Notificaciones[Notificaciones]
    Estadisticas[Estadísticas]
    Pagos[Pagos]
    Reportes[Reportes]
    PDF[Reportes PDF]
    Excel[Reportes Excel]
    Sitio[Menú público]
    Salir[Cerrar sesión]

    Login -->|Rol administrador| Panel
    Panel --> Citas
    Panel --> Horarios
    Panel --> Clientes
    Panel --> Servicios
    Panel --> Empleados
    Panel --> Notificaciones
    Panel --> Estadisticas
    Panel --> Pagos
    Panel --> Reportes
    Reportes --> PDF
    Reportes --> Excel
    Panel --> Sitio
    Panel --> Salir
    Salir --> Sitio
```

## Rutas de entrada verificadas

| Área | Página inicial | Destinos principales |
|---|---|---|
| Sitio público | `public/edeapro/paginas/inicio.html` | Servicios, Nosotros, Ubicación, Agenda y login |
| Cliente | `public/edeapro/cliente/perfil.html` | Datos, mascotas, citas y pagos |
| Empleado | `public/edeapro/empleado/paginas/inicio.html` | Clientes, Mi agenda y Reportes |
| Administrador | `public/edeapro/administrador/paginas/inicio.html` | Citas, horarios, clientes, servicios, empleados, notificaciones, estadísticas, pagos y reportes |

## Notas de navegación

- El sitio público usa `localStorage` (`user` y `rol`) para cambiar los destinos de la navegación según la sesión.
- El enlace “Agendar cita” conduce al login si no hay sesión y a la agenda si la sesión es de cliente.
- Los diagramas documentan navegación visible. La autorización efectiva de cada endpoint se aplica por middleware en `routes/api.php`.
- La etiqueta “Servicios” del menú del empleado apunta a `paginas/inicio.html`; conviene revisar el texto si se desea que el menú describa mejor el contenido real de esa página.
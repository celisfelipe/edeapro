# EDEA.PRO

Sistema de gestión y agendamiento para una peluquería canina y felina, desarrollado con Laravel y una interfaz web pública/administrativa estática bajo la carpeta `public/edeapro`.

## Descripción general

EDEA.PRO es una plataforma que combina:

- Frontend público con páginas de información, contacto, servicios, ubicación y equipo.
- Agenda de citas para clientes, con servicios, razas, adicionales y horarios disponibles.
- Panel de administración para gestionar clientes, empleados, servicios, pagos, estadísticas y agenda.
- Panel de empleado para consultar citas y agenda.
- Perfil de cliente con mascotas, historial, cancelación y reagendamiento.
- Reportes en PDF y Excel para citas, pagos y clientes.

El proyecto usa Laravel 12 como backend API y Vite para el frontend estático. La parte visual del sistema se encuentra en la carpeta `public/edeapro`, mientras que la lógica de negocio y seguridad vive en `app/`, `routes/` y `database/`.

## Stack tecnológico

- PHP 8.2
- Laravel 12
- SQLite como base de datos por defecto en la configuración base
- Composer
- Node.js + Vite
- Blade + archivos estáticos HTML/CSS/JS
- Sanctum para tokens de autenticación
- DOMPDF para reportes PDF
- PHPExcel / Maatwebsite Excel para exportación Excel
- PHPUnit para testing

## Funcionalidades principales

### Público

- Página principal con presentación del negocio.
- Sección de servicios por raza y tipo de tratamiento.
- Equipo y estilistas.
- Ubicación e información de contacto.
- Opiniones y reseñas.

### Cliente

- Registro con email y contraseña validada.
- Inicio de sesión autenticado por token.
- Gestión de mascotas asociadas.
- Agendamiento de citas con selección de servicio, raza, estilista, fecha y horario.
- Consulta de citas pendientes, finalizadas y canceladas.
- Cancelación con motivo y reagendamiento dentro de reglas de negocio.
- Perfil con información personal y actualización de datos.
- Consulta de pagos y facturación asociada a citas.

### Administración

- Gestión de clientes.
- Gestión de empleados y roles (administrador / peluquero).
- Administración de servicios y categorías.
- Registro de pagos.
- Visualización de estadísticas y reportes.
- Administración de horarios y disponibilidad temporal.
- Notificaciones y cancelaciones.

### Empleado / peluquero

- Vista de citas asignadas.
- Agenda del estilista.
- Reportes propios en PDF y Excel.

## Arquitectura del proyecto

El sistema está dividido en dos capas principales:

1. Frontend estático en `public/edeapro`
   - HTML, CSS y JS para los paneles públicos y privados.
   - Archivos de estilos y scripts específicos por área.

2. Backend Laravel en la raíz del proyecto
   - `routes/api.php`: define todas las rutas de negocio.
   - `app/Http/Controllers`: lógicas de autenticación, clientes, citas, reportes y administración.
   - `app/Services/Disponibilidad.php`: validación de horarios y disponibilidad de estilistas.
   - `database/migrations`: estructura de tablas.
   - `app/Models`: modelos principales.

## Estructura del repositorio

```text
edeapro/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   └── Middleware/
│   ├── Models/
│   ├── Providers/
│   └── Services/
├── bootstrap/
├── config/
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── docs/
│   ├── MAPA-NAVEGACION-ROLES.md
│   └── MODERNIZACION-VISUAL.md
├── public/
│   ├── build/
│   └── edeapro/
├── resources/
│   ├── css/
│   ├── js/
│   └── views/
├── routes/
│   ├── api.php
│   ├── console.php
│   └── web.php
├── storage/
├── tests/
├── .env.example
├── artisan
├── composer.json
├── package.json
├── phpunit.xml
├── vite.config.js
└── README.md
```

## Requisitos previos

- PHP >= 8.2
- Composer
- Node.js >= 18
- NPM o PNPM
- Base de datos compatible con Laravel (SQLite por defecto)

## Instalación

1. Clona el repositorio:

```bash
git clone <url-del-repositorio>
cd edeapro
```

2. Instala dependencias PHP:

```bash
composer install
```

3. Configura el entorno:

```bash
cp .env.example .env
php artisan key:generate
```

4. Configura la base de datos en `.env`.

Para SQLite, puedes dejar la configuración por defecto o crear un archivo local:

```env
DB_CONNECTION=sqlite
DB_DATABASE=/ruta/absoluta/a/tu/proyecto/database/database.sqlite
```

5. Ejecuta migraciones:

```bash
php artisan migrate
```

6. Instala dependencias del frontend:

```bash
npm install
```

7. Compila assets:

```bash
npm run build
```

8. Inicia la aplicación:

```bash
php artisan serve
```

Y en otra terminal:

```bash
npm run dev
```

> El proyecto incluye también el script `composer run setup` para preparar entorno de desarrollo, instalar dependencias y compilar assets.

## Variables de entorno

El archivo `.env.example` ya trae una configuración base de Laravel. Las más relevantes para este proyecto son:

```env
APP_NAME=EDEA.PRO
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=sqlite
DB_DATABASE=/ruta/a/database.sqlite

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

## Rutas y módulos principales

### Autenticación y acceso

- `POST /api/login`
- `POST /api/registro`
- `POST /api/logout`
- `POST /api/recuperar-contrasena`
- `POST /api/restablecer-contrasena`

### Agenda pública

- `GET /api/citas/servicios`
- `GET /api/citas/adicionales`
- `GET /api/citas/estilistas`
- `GET /api/citas/slots`
- `POST /api/citas/crear`

### Cliente

- `GET /api/cliente/perfil`
- `POST /api/cliente/actualizar`
- `GET /api/cliente/mascotas`
- `POST /api/cliente/mascotas/agregar`
- `GET /api/cliente/mascotas/historial`
- `GET /api/cliente/citas`
- `POST /api/cliente/cancelar-cita`
- `GET /api/cliente/reagendar-horarios`
- `POST /api/cliente/reagendar-cita`
- `GET /api/cliente/pagos`

### Administración

- `GET /api/admin/citas`
- `POST /api/admin/citas/cancelar`
- `GET /api/admin/clientes`
- `POST /api/admin/clientes/editar`
- `POST /api/admin/clientes/eliminar`
- `GET /api/admin/empleados`
- `POST /api/admin/empleados/agregar`
- `POST /api/admin/empleados/editar`
- `POST /api/admin/empleados/eliminar`
- `GET /api/admin/servicios`
- `POST /api/admin/servicios/agregar`
- `POST /api/admin/servicios/editar`
- `POST /api/admin/servicios/eliminar`
- `GET /api/admin/estadisticas`
- `GET /api/admin/horarios`
- `POST /api/admin/horarios/disponibilidad`

### Reportes

- `GET /api/reportes/citas/pdf`
- `GET /api/reportes/pagos/pdf`
- `GET /api/reportes/clientes/pdf`
- `GET /api/reportes/citas/excel`
- `GET /api/reportes/pagos/excel`
- `GET /api/reportes/clientes/excel`

## Entidades principales de la base de datos

El modelo de datos incluye elementos clave como:

- `cliente`: clientes registrados.
- `estilista`: empleados o peluqueros con roles y disponibilidad.
- `mascota`: mascotas asociadas a cada cliente.
- `raza`: razas disponibles para servicios.
- `servicio`: servicios ofrecidos.
- `adicional`: servicios extras o complementarios.
- `cita`: citas agendadas con fecha, hora, estado y estilista.
- `pago`: pagos relacionados a citas.
- `notificacion`: mensajes de recordatorio o confirmación.
- `disponibilidad_estilista`: bloqueos o indisponibilidades temporales.
- `adicional_cita`: relación M:N entre citas y adicionales.

## Documentación adicional

- [docs/MAPA-NAVEGACION-ROLES.md](docs/MAPA-NAVEGACION-ROLES.md): mapas de navegación del sitio público y de los roles cliente, empleado y administrador.
- [docs/MODERNIZACION-VISUAL.md](docs/MODERNIZACION-VISUAL.md): documentación del rediseño visual del frontend y de los paneles.

## Testing

Para ejecutar la suite de pruebas:

```bash
php artisan test
```

## Licencia

Este proyecto se distribuye bajo la licencia MIT.

## Notas del proyecto

- La aplicación pública inicial redirige desde `/` hacia `/edeapro/index.html`.
- El backend está construido para autenticación por token y control de acceso por roles (`cliente`, `peluquero`, `administrador`).
- El proyecto conserva un enfoque híbrido: frontend estático para experiencia visual y Laravel como motor de negocio, API y seguridad.

## Contribución

Si deseas colaborar con el proyecto:

1. Haz un fork del repositorio.
2. Crea una rama de trabajo.
3. Realiza tus cambios y prueba la funcionalidad.
4. Abre un pull request con una descripción clara.

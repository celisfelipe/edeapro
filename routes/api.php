<?php

/**
 * EDEA Grooming - Rutas de la API
 * ================================
 * Todas las peticiones del frontend (HTML/JS) llegan aquí.
 * Cada ruta llama al método correspondiente en un Controlador.
 *
 * SEGURIDAD:
 * - Rutas públicas: login, registro, agenda (cualquiera puede verlas)
 * - Rutas protegidas: admin, empleado, cliente (requieren token)
 *
 * El token se genera al hacer login y se envía en cada fetch
 * en el header: Authorization: Bearer {token}
 */

use Illuminate\Support\Facades\Route;

// ─────────────────────────────────────────────────────────────
// RUTAS PÚBLICAS — no requieren autenticación
// ─────────────────────────────────────────────────────────────
Route::post('/login',    [App\Http\Controllers\AuthController::class, 'login']);
Route::post('/registro', [App\Http\Controllers\AuthController::class, 'registro']);

// Agenda pública — cualquier visitante puede ver servicios y estilistas
Route::get('/citas/servicios',   [App\Http\Controllers\CitaController::class, 'servicios']);
Route::get('/citas/adicionales', [App\Http\Controllers\CitaController::class, 'adicionales']);
Route::get('/citas/estilistas',  [App\Http\Controllers\CitaController::class, 'estilistas']);
Route::get('/citas/slots',       [App\Http\Controllers\CitaController::class, 'slots']);

// Reseñas públicas — cualquiera puede verlas
Route::get('/resenas', [App\Http\Controllers\ResenaController::class, 'index']);

// ─────────────────────────────────────────────────────────────
// RUTAS PROTEGIDAS — requieren token de autenticación
// Solo accesibles si el usuario inició sesión
// ─────────────────────────────────────────────────────────────
Route::middleware('verificar.token')->group(function () {

    // Crear cita — solo clientes autenticados
    Route::post('/citas/crear', [App\Http\Controllers\CitaController::class, 'crear']);

    // Reseñas — solo clientes autenticados pueden crear
    Route::post('/resenas/crear', [App\Http\Controllers\ResenaController::class, 'crear']);

    // ── Panel Administrador ───────────────────────────────────
    Route::get('/admin/citas',           [App\Http\Controllers\Admin\CitaAdminController::class, 'index']);
    Route::post('/admin/citas/cancelar', [App\Http\Controllers\Admin\CitaAdminController::class, 'cancelar']);

    Route::get('/admin/clientes',           [App\Http\Controllers\Admin\ClienteAdminController::class, 'index']);
    Route::post('/admin/clientes/editar',   [App\Http\Controllers\Admin\ClienteAdminController::class, 'editar']);
    Route::post('/admin/clientes/eliminar', [App\Http\Controllers\Admin\ClienteAdminController::class, 'eliminar']);

    Route::get('/admin/empleados',           [App\Http\Controllers\Admin\EmpleadoAdminController::class, 'index']);
    Route::post('/admin/empleados/agregar',  [App\Http\Controllers\Admin\EmpleadoAdminController::class, 'agregar']);
    Route::post('/admin/empleados/editar',   [App\Http\Controllers\Admin\EmpleadoAdminController::class, 'editar']);
    Route::post('/admin/empleados/eliminar', [App\Http\Controllers\Admin\EmpleadoAdminController::class, 'eliminar']);

    Route::get('/admin/servicios',         [App\Http\Controllers\Admin\ServicioAdminController::class, 'index']);
    Route::post('/admin/servicios/editar', [App\Http\Controllers\Admin\ServicioAdminController::class, 'editar']);

    Route::get('/admin/notificaciones',       [App\Http\Controllers\Admin\NotificacionAdminController::class, 'index']);
    Route::post('/admin/notificaciones/leer', [App\Http\Controllers\Admin\NotificacionAdminController::class, 'leer']);

    Route::get('/admin/pagos',            [App\Http\Controllers\Admin\PagoAdminController::class, 'index']);
    Route::post('/admin/pagos/registrar', [App\Http\Controllers\Admin\PagoAdminController::class, 'registrar']);

    Route::get('/admin/horarios',                 [App\Http\Controllers\Admin\HorarioAdminController::class, 'index']);
    Route::post('/admin/horarios/disponibilidad', [App\Http\Controllers\Admin\HorarioAdminController::class, 'disponibilidad']);

    Route::get('/admin/estadisticas', [App\Http\Controllers\Admin\EstadisticaAdminController::class, 'index']);

    // ── Panel Empleado ────────────────────────────────────────
    Route::get('/empleado/citas', [App\Http\Controllers\Empleado\EmpleadoController::class, 'citas']);

    // ── Panel Cliente ─────────────────────────────────────────
    Route::get('/cliente/perfil',         [App\Http\Controllers\Cliente\ClienteController::class, 'perfil']);
    Route::post('/cliente/actualizar',    [App\Http\Controllers\Cliente\ClienteController::class, 'actualizar']);
    Route::get('/cliente/mascotas',       [App\Http\Controllers\Cliente\ClienteController::class, 'mascotas']);
    Route::get('/cliente/citas',          [App\Http\Controllers\Cliente\ClienteController::class, 'citas']);
    Route::post('/cliente/cancelar-cita', [App\Http\Controllers\Cliente\ClienteController::class, 'cancelarCita']);
    Route::get('/cliente/pagos',          [App\Http\Controllers\Cliente\ClienteController::class, 'pagos']);
});
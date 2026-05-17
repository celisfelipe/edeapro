<?php

/**
 * EDEA Grooming - Rutas de la API
 * ================================
 * Todas las peticiones del frontend (HTML/JS) llegan aquí.
 * Cada ruta llama al método correspondiente en un Controlador.
 *
 * Formato: Route::MÉTODO('/ruta', [Controlador::class, 'método'])
 * El frontend llama estas rutas con fetch() desde los archivos JS.
 */

use Illuminate\Support\Facades\Route;

// ─────────────────────────────────────────────────────────────
// AUTENTICACIÓN — login.js
// ─────────────────────────────────────────────────────────────
Route::post('/login',    [App\Http\Controllers\AuthController::class, 'login']);
Route::post('/registro', [App\Http\Controllers\AuthController::class, 'registro']);

// ─────────────────────────────────────────────────────────────
// AGENDA PÚBLICA — agenda.js
// ─────────────────────────────────────────────────────────────
Route::get('/citas/servicios',   [App\Http\Controllers\CitaController::class, 'servicios']);
Route::get('/citas/adicionales', [App\Http\Controllers\CitaController::class, 'adicionales']);
Route::get('/citas/estilistas',  [App\Http\Controllers\CitaController::class, 'estilistas']);
Route::get('/citas/slots',       [App\Http\Controllers\CitaController::class, 'slots']);
Route::post('/citas/crear',      [App\Http\Controllers\CitaController::class, 'crear']);

// ─────────────────────────────────────────────────────────────
// PANEL ADMINISTRADOR
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// PANEL EMPLEADO
// ─────────────────────────────────────────────────────────────
Route::get('/empleado/citas', [App\Http\Controllers\Empleado\EmpleadoController::class, 'citas']);

// ─────────────────────────────────────────────────────────────
// PANEL CLIENTE
// ─────────────────────────────────────────────────────────────
Route::get('/cliente/perfil',         [App\Http\Controllers\Cliente\ClienteController::class, 'perfil']);
Route::post('/cliente/actualizar',    [App\Http\Controllers\Cliente\ClienteController::class, 'actualizar']);
Route::get('/cliente/mascotas',       [App\Http\Controllers\Cliente\ClienteController::class, 'mascotas']);
Route::get('/cliente/citas',          [App\Http\Controllers\Cliente\ClienteController::class, 'citas']);
Route::post('/cliente/cancelar-cita', [App\Http\Controllers\Cliente\ClienteController::class, 'cancelarCita']);
Route::get('/cliente/pagos',          [App\Http\Controllers\Cliente\ClienteController::class, 'pagos']);

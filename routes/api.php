<?php

/**
 * EDEA Grooming - Rutas de la API
 * ================================
 * SEGURIDAD — Tres niveles de acceso:
 * - Públicas: sin token
 * - Protegidas por rol: solo el rol indicado puede acceder
 */

use Illuminate\Support\Facades\Route;

// ── Rutas públicas ────────────────────────────────────────────
// Máximo 5 intentos de login por minuto por IP
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/login',    [App\Http\Controllers\AuthController::class, 'login']);
    Route::post('/registro', [App\Http\Controllers\AuthController::class, 'registro']);
});

Route::get('/citas/servicios',   [App\Http\Controllers\CitaController::class, 'servicios']);
Route::get('/citas/adicionales', [App\Http\Controllers\CitaController::class, 'adicionales']);
Route::get('/citas/estilistas',  [App\Http\Controllers\CitaController::class, 'estilistas']);
Route::get('/citas/slots',       [App\Http\Controllers\CitaController::class, 'slots']);
Route::get('/resenas',           [App\Http\Controllers\ResenaController::class, 'index']);

// ── Rutas que requieren cualquier sesión activa ───────────────
Route::middleware('verificar.token')->group(function () {
    Route::post('/citas/crear',      [App\Http\Controllers\CitaController::class, 'crear']);
    Route::post('/resenas/crear',    [App\Http\Controllers\ResenaController::class, 'crear']);
});

// ── Rutas solo para administrador ────────────────────────────
Route::middleware('verificar.token:administrador')->group(function () {
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

    Route::get('/admin/estadisticas', [App\Http\Controllers\Admin\EstadisticaAdminController::class, 'index']);

    // ── Reportes PDF — solo administrador ────────────────────────
    Route::get('/reportes/citas/pdf',    [App\Http\Controllers\ReporteController::class, 'citasPdf']);
    Route::get('/reportes/pagos/pdf',    [App\Http\Controllers\ReporteController::class, 'pagosPdf']);
    Route::get('/reportes/clientes/pdf', [App\Http\Controllers\ReporteController::class, 'clientesPdf']);

    // ── Reportes Excel — solo administrador ──────────────────────
    Route::get('/reportes/citas/excel',    [App\Http\Controllers\ReporteController::class, 'citasExcel']);
    Route::get('/reportes/pagos/excel',    [App\Http\Controllers\ReporteController::class, 'pagosExcel']);
    Route::get('/reportes/clientes/excel', [App\Http\Controllers\ReporteController::class, 'clientesExcel']);
});

// ── Rutas para administrador y peluquero ─────────────────────
Route::middleware('verificar.token:administrador,peluquero')->group(function () {
    Route::get('/admin/horarios',                 [App\Http\Controllers\Admin\HorarioAdminController::class, 'index']);
    Route::post('/admin/horarios/disponibilidad', [App\Http\Controllers\Admin\HorarioAdminController::class, 'disponibilidad']);

    Route::get('/admin/disponibilidad-temporal',           [App\Http\Controllers\Admin\HorarioAdminController::class, 'disponibilidadTemporal']);
    Route::post('/admin/disponibilidad-temporal/agregar',  [App\Http\Controllers\Admin\HorarioAdminController::class, 'agregarDisponibilidadTemporal']);
    Route::post('/admin/disponibilidad-temporal/eliminar', [App\Http\Controllers\Admin\HorarioAdminController::class, 'eliminarDisponibilidadTemporal']);

    Route::get('/admin/clientes-empleado',        [App\Http\Controllers\Admin\ClienteAdminController::class, 'index']);
    Route::get('/empleado/citas',                 [App\Http\Controllers\Empleado\EmpleadoController::class, 'citas']);
});

// ── Rutas solo para cliente ───────────────────────────────────
Route::middleware('verificar.token:cliente')->group(function () {
    Route::get('/cliente/perfil',         [App\Http\Controllers\Cliente\ClienteController::class, 'perfil']);
    Route::post('/cliente/actualizar',    [App\Http\Controllers\Cliente\ClienteController::class, 'actualizar']);
    Route::get('/cliente/mascotas',       [App\Http\Controllers\Cliente\ClienteController::class, 'mascotas']);
    Route::post('/cliente/mascotas/agregar', [App\Http\Controllers\Cliente\ClienteController::class, 'agregarMascota']);
    Route::get('/cliente/mascotas/historial', [App\Http\Controllers\Cliente\ClienteController::class, 'historialMascota']);
    Route::get('/cliente/citas',          [App\Http\Controllers\Cliente\ClienteController::class, 'citas']);
    Route::post('/cliente/cancelar-cita', [App\Http\Controllers\Cliente\ClienteController::class, 'cancelarCita']);
    Route::get('/cliente/pagos',          [App\Http\Controllers\Cliente\ClienteController::class, 'pagos']);
});
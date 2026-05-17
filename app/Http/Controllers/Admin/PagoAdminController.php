<?php

/**
 * PagoAdminController
 * ===================
 * Gestiona el historial de pagos y registro de nuevos pagos (pagos.js).
 * Al registrar un pago, también marca la cita como 'Completada'.
 *
 * Rutas: GET  /api/admin/pagos
 *        POST /api/admin/pagos/registrar
 */

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PagoAdminController extends Controller
{
    /**
     * Devuelve el historial completo de pagos registrados.
     * Incluye datos del cliente y el servicio asociado.
     */
    public function index()
    {
        $pagos = DB::select("
            SELECT p.id_pago, p.fecha_pago, p.metodo_pago, p.estado_pago,
                   c.nombre AS nombre_cliente, c.apellido AS apellido_cliente,
                   s.nombre_servicio, ci.id_cita
            FROM pago p
            JOIN cita ci ON p.id_cita = ci.id_cita
            JOIN cliente c ON ci.id_cliente = c.id_cliente
            JOIN servicio s ON ci.id_servicio = s.id_servicio
            ORDER BY p.id_pago DESC
        ");

        return response()->json(['ok' => true, 'pagos' => $pagos]);
    }

    /**
     * Registra un nuevo pago para una cita y la marca como 'Completada'.
     * La fecha del pago se toma automáticamente del servidor (hoy).
     */
    public function registrar(Request $request)
    {
        $id_cita = intval($request->input('id_cita'));
        $metodo  = $request->input('metodo');

        DB::table('pago')->insert([
            'id_cita'     => $id_cita,
            'fecha_pago'  => date('Y-m-d'),
            'metodo_pago' => $metodo,
            'estado_pago' => 'Completado'
        ]);

        DB::update("UPDATE cita SET estado = 'Completada' WHERE id_cita = ?", [$id_cita]);

        return response()->json(['ok' => true]);
    }
}

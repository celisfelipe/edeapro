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
     * Devuelve el historial completo de pagos registrados y el total
     * recaudado (suma real de pago.monto, no un estimado de catálogo).
     * Incluye datos del cliente y el servicio asociado.
     */
    public function index()
    {
        $pagos = DB::select("
            SELECT p.id_pago, p.fecha_pago, p.metodo_pago, p.estado_pago, p.monto,
                   c.nombre AS nombre_cliente, c.apellido AS apellido_cliente,
                   s.nombre_servicio, ci.id_cita
            FROM pago p
            JOIN cita ci ON p.id_cita = ci.id_cita
            JOIN cliente c ON ci.id_cliente = c.id_cliente
            JOIN servicio s ON ci.id_servicio = s.id_servicio
            ORDER BY p.id_pago DESC
        ");

        // SUM() ignora los monto NULL automáticamente (pagos antiguos sin monto
        // capturado); IFNULL cubre el caso de que no haya ningún pago todavía.
        $total_recaudado = DB::select("SELECT IFNULL(SUM(monto), 0) AS total FROM pago")[0]->total;

        return response()->json(['ok' => true, 'pagos' => $pagos, 'total_recaudado' => $total_recaudado]);
    }

    /**
     * Registra un nuevo pago para una cita y la marca como 'Completada'.
     * El monto se calcula automáticamente desde la raza+servicio que se
     * agendó en esa cita (no se le pide al admin escribirlo a mano, para
     * evitar errores de digitación). Si la cita es de antes de que
     * existiera cita.id_raza, o no hay un precio de catálogo para esa
     * combinación, el monto queda en NULL (igual que antes) en vez de
     * inventar un valor.
     * La fecha del pago se toma automáticamente del servidor (hoy).
     */
    public function registrar(Request $request)
    {
        $id_cita = intval($request->input('id_cita'));
        $metodo  = $request->input('metodo');

        $cita = DB::select("SELECT id_raza, id_servicio FROM cita WHERE id_cita = ?", [$id_cita]);
        if (empty($cita)) {
            return response()->json(['ok' => false, 'error' => 'Cita no encontrada']);
        }

        $precio = DB::select(
            "SELECT precio FROM raza_servicio WHERE id_raza = ? AND id_servicio = ?",
            [$cita[0]->id_raza, $cita[0]->id_servicio]
        );
        $monto = !empty($precio) ? $precio[0]->precio : null;

        DB::table('pago')->insert([
            'id_cita'     => $id_cita,
            'monto'       => $monto,
            'fecha_pago'  => date('Y-m-d'),
            'metodo_pago' => $metodo,
            'estado_pago' => 'Completado'
        ]);

        DB::update("UPDATE cita SET estado = 'Completada' WHERE id_cita = ?", [$id_cita]);

        return response()->json(['ok' => true, 'monto' => $monto]);
    }
}

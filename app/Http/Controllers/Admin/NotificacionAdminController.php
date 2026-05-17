<?php

/**
 * NotificacionAdminController
 * ===========================
 * Gestiona las notificaciones del sistema (notificaciones.js).
 * Muestra alertas generadas por acciones de los clientes.
 *
 * Rutas: GET  /api/admin/notificaciones
 *        POST /api/admin/notificaciones/leer
 */

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificacionAdminController extends Controller
{
    /**
     * Devuelve todas las notificaciones con el nombre del cliente asociado.
     * Ordenadas de más reciente a más antigua.
     */
    public function index()
    {
        $notificaciones = DB::select("
            SELECT n.id_notificacion, n.titulo, n.mensaje, n.tipo, n.estado,
                   c.nombre AS nombre_cliente, c.apellido AS apellido_cliente
            FROM notificacion n
            JOIN cliente c ON n.id_cliente = c.id_cliente
            ORDER BY n.id_notificacion DESC
        ");

        return response()->json(['ok' => true, 'notificaciones' => $notificaciones]);
    }

    /**
     * Cambia el estado de una notificación a 'Leída'.
     */
    public function leer(Request $request)
    {
        $id = intval($request->input('id_notificacion'));
        DB::update("UPDATE notificacion SET estado = 'Leída' WHERE id_notificacion = ?", [$id]);
        return response()->json(['ok' => true]);
    }
}

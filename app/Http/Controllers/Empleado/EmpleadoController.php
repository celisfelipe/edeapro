<?php

/**
 * EmpleadoController
 * ==================
 * Provee datos al panel del empleado (inicio.js en empleado/scripts/).
 * Filtra las citas únicamente por el estilista que inició sesión.
 *
 * Ruta: GET /api/empleado/citas?id_estilista=X
 */

namespace App\Http\Controllers\Empleado;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmpleadoController extends Controller
{
    /**
     * Devuelve las citas asignadas a un estilista.
     * - Si el token tiene rol 'peluquero', fuerza el id del token (no puede ver citas ajenas).
     * - Si el token tiene rol 'administrador', acepta el id_estilista del request.
     */
    public function citas(Request $request)
    {
        $abilities = $request->attributes->get('auth_abilities', []);

        if (in_array('peluquero', $abilities)) {
            $id_estilista = intval($request->attributes->get('auth_tokenable_id'));
        } else {
            $id_estilista = intval($request->input('id_estilista'));
        }

        $citas = DB::select("
            SELECT c.id_cita, c.fecha, c.hora, c.estado,
                   cl.nombre AS nombre_cliente, cl.apellido AS apellido_cliente,
                   s.nombre_servicio
            FROM cita c
            JOIN cliente cl ON c.id_cliente = cl.id_cliente
            JOIN servicio s ON c.id_servicio = s.id_servicio
            WHERE c.id_estilista = ?
            ORDER BY c.fecha DESC, c.hora ASC
        ", [$id_estilista]);

        return response()->json(['ok' => true, 'citas' => $citas]);
    }
}

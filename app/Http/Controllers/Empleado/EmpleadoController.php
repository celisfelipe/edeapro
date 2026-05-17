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
     * Devuelve todas las citas asignadas a un estilista específico.
     * Recibe el id_estilista desde el localStorage del navegador (enviado por inicio.js).
     * Ordena por fecha descendente y hora ascendente.
     */
    public function citas(Request $request)
    {
        $id_estilista = intval($request->input('id_estilista'));

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

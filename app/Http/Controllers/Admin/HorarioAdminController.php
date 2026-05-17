<?php

/**
 * HorarioAdminController
 * ======================
 * Gestiona la vista de horarios y disponibilidad de estilistas (horarios.js).
 * Muestra las citas del día en una grilla y permite cambiar la disponibilidad.
 *
 * Rutas: GET  /api/admin/horarios?fecha=YYYY-MM-DD
 *        POST /api/admin/horarios/disponibilidad
 */

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HorarioAdminController extends Controller
{
    /**
     * Devuelve las citas de un día específico y la lista de estilistas activos.
     * Si no se pasa ?fecha, usa la fecha de hoy.
     * El JS usa estos datos para construir la grilla de horarios.
     */
    public function index(Request $request)
    {
        $fecha = $request->input('fecha', date('Y-m-d'));

        $citas = DB::select("
            SELECT c.id_cita, c.hora, c.estado,
                   cl.nombre AS nombre_cliente, cl.apellido AS apellido_cliente,
                   r.nombre_raza, rs.duracion,
                   e.id_estilista, e.nombre_estilista
            FROM cita c
            JOIN cliente cl ON c.id_cliente = cl.id_cliente
            JOIN raza_servicio rs ON c.id_servicio = rs.id_servicio
            JOIN raza r ON rs.id_raza = r.id_raza
            JOIN estilista e ON c.id_estilista = e.id_estilista
            WHERE c.fecha = ? AND c.estado != 'Cancelada'
        ", [$fecha]);

        $estilistas = DB::select("
            SELECT id_estilista, nombre_estilista, apellido_estilista, disponibilidad
            FROM estilista
            WHERE estado = 'Activo'
        ");

        return response()->json(['ok' => true, 'citas' => $citas, 'estilistas' => $estilistas]);
    }

    /**
     * Cambia la disponibilidad de un estilista entre 'Disponible' y 'No Disponible'.
     * Afecta si aparece en la agenda pública para nuevas citas.
     */
    public function disponibilidad(Request $request)
    {
        $id             = intval($request->input('id_estilista'));
        $disponibilidad = $request->input('disponibilidad');

        DB::update("UPDATE estilista SET disponibilidad = ? WHERE id_estilista = ?", [$disponibilidad, $id]);

        return response()->json(['ok' => true]);
    }
}

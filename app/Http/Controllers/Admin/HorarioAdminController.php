<?php

/**
 * HorarioAdminController
 * ======================
 * Gestiona la vista de horarios y disponibilidad de estilistas (horarios.js).
 * Muestra las citas del día en una grilla y permite cambiar la disponibilidad.
 *
 * Rutas: GET  /api/admin/horarios?fecha=YYYY-MM-DD
 *        POST /api/admin/horarios/disponibilidad
 *        GET  /api/admin/disponibilidad-temporal
 *        POST /api/admin/disponibilidad-temporal/agregar
 *        POST /api/admin/disponibilidad-temporal/eliminar
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

    /**
     * Devuelve los bloqueos temporales vigentes o futuros (fecha_fin >= hoy),
     * con el nombre del estilista, ordenados por fecha de inicio.
     * Los bloqueos ya vencidos no se muestran (quedan en la BD como historial).
     */
    public function disponibilidadTemporal()
    {
        $bloqueos = DB::select("
            SELECT d.id_disponibilidad, d.id_estilista, d.fecha_inicio, d.fecha_fin, d.motivo,
                   e.nombre_estilista, e.apellido_estilista
            FROM disponibilidad_estilista d
            JOIN estilista e ON d.id_estilista = e.id_estilista
            WHERE d.fecha_fin >= CURDATE()
            ORDER BY d.fecha_inicio
        ");

        return response()->json(['ok' => true, 'bloqueos' => $bloqueos]);
    }

    /**
     * Registra un bloqueo temporal de disponibilidad para un estilista
     * (ej. vacaciones), sin afectar el campo `disponibilidad` permanente.
     */
    public function agregarDisponibilidadTemporal(Request $request)
    {
        $id_estilista = intval($request->input('id_estilista'));
        $fecha_inicio = $request->input('fecha_inicio');
        $fecha_fin    = $request->input('fecha_fin');
        $motivo       = strip_tags(trim($request->input('motivo', '')));

        if (!$id_estilista || !$fecha_inicio || !$fecha_fin) {
            return response()->json(['ok' => false, 'error' => 'Completa estilista, fecha de inicio y fecha de fin.']);
        }
        if ($fecha_fin < $fecha_inicio) {
            return response()->json(['ok' => false, 'error' => 'La fecha de fin no puede ser anterior a la fecha de inicio.']);
        }

        DB::table('disponibilidad_estilista')->insert([
            'id_estilista' => $id_estilista,
            'fecha_inicio' => $fecha_inicio,
            'fecha_fin'    => $fecha_fin,
            'motivo'       => $motivo ?: null
        ]);

        return response()->json(['ok' => true]);
    }

    /** Elimina un bloqueo temporal de disponibilidad por su id */
    public function eliminarDisponibilidadTemporal(Request $request)
    {
        $id = intval($request->input('id_disponibilidad'));
        DB::delete("DELETE FROM disponibilidad_estilista WHERE id_disponibilidad = ?", [$id]);
        return response()->json(['ok' => true]);
    }
}

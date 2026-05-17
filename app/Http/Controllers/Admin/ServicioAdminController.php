<?php

/**
 * ServicioAdminController
 * =======================
 * Gestiona los servicios desde el panel administrador (servicios.js).
 * Permite ver y editar el precio y la duración de cada servicio por raza.
 *
 * Rutas: GET  /api/admin/servicios
 *        POST /api/admin/servicios/editar
 */

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServicioAdminController extends Controller
{
    /**
     * Devuelve todos los servicios con su raza, duración y precio.
     * Ordena por tipo de servicio y luego por nombre de raza.
     */
    public function index()
    {
        $servicios = DB::select("
            SELECT r.id_raza, r.nombre_raza, s.id_servicio, s.nombre_servicio, rs.duracion, rs.precio
            FROM raza_servicio rs
            JOIN raza r ON rs.id_raza = r.id_raza
            JOIN servicio s ON rs.id_servicio = s.id_servicio
            ORDER BY s.id_servicio, r.nombre_raza
        ");

        return response()->json(['ok' => true, 'servicios' => $servicios]);
    }

    /**
     * Actualiza el precio y la duración de un servicio para una raza específica.
     * Identifica el registro por la combinación id_raza + id_servicio.
     */
    public function editar(Request $request)
    {
        $id_raza     = intval($request->input('id_raza'));
        $id_servicio = intval($request->input('id_servicio'));
        $precio      = $request->input('precio');
        $duracion    = $request->input('duracion');

        DB::update(
            "UPDATE raza_servicio SET precio=?, duracion=? WHERE id_raza=? AND id_servicio=?",
            [$precio, $duracion, $id_raza, $id_servicio]
        );

        return response()->json(['ok' => true]);
    }
}

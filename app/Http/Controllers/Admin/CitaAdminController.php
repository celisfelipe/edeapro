<?php

/**
 * CitaAdminController
 * ===================
 * Gestión de citas desde el panel administrador (inicio.js).
 * Usa la vista 'citas_completas' de la BD que ya hace los JOINs necesarios.
 *
 * Rutas: GET  /api/admin/citas
 *        POST /api/admin/citas/cancelar
 */

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CitaAdminController extends Controller
{
    /**
     * Devuelve todas las citas del sistema usando la vista citas_completas.
     * Esta vista ya incluye nombre del cliente, mascota, servicio y estilista.
     */
    public function index()
    {
        $citas = DB::select("SELECT * FROM citas_completas");
        return response()->json(['ok' => true, 'citas' => $citas]);
    }

    /**
     * Cambia el estado de una cita a 'Cancelada' por su id_cita.
     */
    public function cancelar(Request $request)
    {
        $id = intval($request->input('id_cita'));
        DB::update("UPDATE cita SET estado = 'Cancelada' WHERE id_cita = ?", [$id]);
        return response()->json(['ok' => true]);
    }
}

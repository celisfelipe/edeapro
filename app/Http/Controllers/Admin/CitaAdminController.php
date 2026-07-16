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
     * Cambia el estado de una cita a 'Cancelada'.
     * Rechaza la operación si la cita ya está Cancelada o Completada.
     */
    public function cancelar(Request $request)
    {
        $id = intval($request->input('id_cita'));

        $cita = DB::selectOne(
            "SELECT estado FROM cita WHERE id_cita = ?", [$id]
        );

        if (!$cita) {
            return response()->json(['ok' => false, 'error' => 'Cita no encontrada.'], 404);
        }
        if (in_array($cita->estado, ['Cancelada', 'Completada'])) {
            return response()->json(['ok' => false, 'error' => "La cita ya está {$cita->estado}."], 422);
        }

        DB::update("UPDATE cita SET estado = 'Cancelada' WHERE id_cita = ?", [$id]);
        return response()->json(['ok' => true]);
    }
}

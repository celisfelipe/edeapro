<?php

/**
 * EstadisticaAdminController
 * ==========================
 * Genera los datos para los gráficos del panel administrador (estadisticas.js).
 * Usa Chart.js en el frontend para mostrar los resultados visualmente.
 *
 * Ruta: GET /api/admin/estadisticas
 */

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class EstadisticaAdminController extends Controller
{
    /**
     * Devuelve:
     * - citas_estado: cantidad de citas agrupadas por estado (Pendiente, Completada, Cancelada)
     * - servicios: los servicios más solicitados ordenados por cantidad
     * - total_clientes: número total de clientes registrados
     * - total_citas: número total de citas en el sistema
     * - total_ingresos: suma de precios de citas completadas
     */
    public function index()
    {
        $citas_estado = DB::select("SELECT estado, COUNT(*) AS total FROM cita GROUP BY estado");

        $servicios = DB::select("
            SELECT s.nombre_servicio, COUNT(*) AS total
            FROM cita c
            JOIN servicio s ON c.id_servicio = s.id_servicio
            GROUP BY s.nombre_servicio
            ORDER BY total DESC
        ");

        $total_clientes = DB::select("SELECT COUNT(*) AS total FROM cliente")[0]->total;
        $total_citas    = DB::select("SELECT COUNT(*) AS total FROM cita")[0]->total;

        $total_ingresos = DB::select("
            SELECT IFNULL(SUM(rs.precio), 0) AS total
            FROM cita c
            JOIN raza_servicio rs ON c.id_servicio = rs.id_servicio
            WHERE c.estado = 'Completada'
        ")[0]->total;

        return response()->json([
            'ok'             => true,
            'citas_estado'   => $citas_estado,
            'servicios'      => $servicios,
            'total_clientes' => $total_clientes,
            'total_citas'    => $total_citas,
            'total_ingresos' => $total_ingresos
        ]);
    }
}

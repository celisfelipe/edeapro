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
     *
     * total_ingresos usa el precio de catálogo (raza_servicio) de cada cita
     * completada — no es lo mismo que "lo realmente recaudado" (eso sale de
     * pago.monto, ver PagoAdminController). El JOIN va por id_raza Y
     * id_servicio a propósito: raza_servicio tiene varias filas por
     * id_servicio (una por raza, con precios distintos), así que unir solo
     * por id_servicio multiplicaba el precio de una cita por cada raza de
     * ese servicio en vez de tomar el precio real de la raza agendada.
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
            JOIN raza_servicio rs ON rs.id_raza = c.id_raza AND rs.id_servicio = c.id_servicio
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

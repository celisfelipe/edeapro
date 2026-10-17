<?php

/**
 * Agenda
 * ======
 * Datos de la grilla de agenda diaria (scripts/agendaGrilla.js), compartidos
 * por el panel del administrador (todos los estilistas) y el del empleado
 * (solo el estilista que inició sesión). Las dos vistas reciben la misma
 * forma de respuesta: { citas: [...], estilistas: [...] }.
 */

namespace App\Services;

use Illuminate\Support\Facades\DB;

class Agenda
{
    /**
     * Citas no canceladas de un día, una fila por cita.
     *
     * raza_servicio se une por su PK completa (id_servicio, id_raza); unir
     * solo por id_servicio duplicaría cada cita una vez por raza del servicio.
     * Las horas salen en 24h (HH:MM:SS); el frontend las muestra en 12h.
     *
     * @param string   $fecha        YYYY-MM-DD
     * @param int|null $id_estilista si se indica, solo las citas de ese estilista
     */
    public function citasDelDia(string $fecha, ?int $id_estilista = null): array
    {
        $sql = "
            SELECT c.id_cita, c.fecha, c.hora, c.estado,
                   cl.nombre AS nombre_cliente, cl.apellido AS apellido_cliente,
                   m.nombre AS mascota,
                   r.nombre_raza, s.nombre_servicio, rs.duracion,
                   e.id_estilista, e.nombre_estilista
            FROM cita c
            JOIN cliente cl  ON c.id_cliente = cl.id_cliente
            JOIN estilista e ON c.id_estilista = e.id_estilista
            LEFT JOIN mascota m  ON c.id_mascota = m.id_mascota
            LEFT JOIN servicio s ON c.id_servicio = s.id_servicio
            LEFT JOIN raza r     ON r.id_raza = COALESCE(c.id_raza, m.id_raza)
            LEFT JOIN raza_servicio rs ON rs.id_servicio = c.id_servicio
                                      AND rs.id_raza = r.id_raza
            WHERE c.fecha = ? AND c.estado != 'Cancelada'";
        $params = [$fecha];

        if ($id_estilista !== null) {
            $sql     .= " AND c.id_estilista = ?";
            $params[] = $id_estilista;
        }

        return DB::select($sql . " ORDER BY c.hora", $params);
    }

    /**
     * Estilistas para las columnas de la grilla.
     * Sin id: todos los activos. Con id: solo ese estilista.
     */
    public function estilistas(?int $id_estilista = null): array
    {
        $sql = "SELECT id_estilista, nombre_estilista, apellido_estilista, disponibilidad FROM estilista";

        return $id_estilista === null
            ? DB::select($sql . " WHERE estado = 'Activo'")
            : DB::select($sql . " WHERE id_estilista = ?", [$id_estilista]);
    }
}

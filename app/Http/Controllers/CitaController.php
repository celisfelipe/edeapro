<?php

/**
 * CitaController
 * ==============
 * Controla toda la lógica de la agenda pública (agenda.js).
 * Permite a cualquier usuario ver servicios, estilistas y agendar citas.
 *
 * Rutas: GET  /api/citas/servicios
 *        GET  /api/citas/adicionales
 *        GET  /api/citas/estilistas
 *        GET  /api/citas/slots
 *        POST /api/citas/crear
 */

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CitaController extends Controller
{
    /**
     * Devuelve todos los servicios disponibles con su raza, duración y precio.
     * Usa un JOIN entre raza_servicio, raza y servicio.
     */
    public function servicios()
    {
        $datos = DB::select("
            SELECT r.id_raza, r.nombre_raza, s.id_servicio, s.nombre_servicio,
                   rs.duracion, rs.precio
            FROM raza_servicio rs
            JOIN raza r ON rs.id_raza = r.id_raza
            JOIN servicio s ON rs.id_servicio = s.id_servicio
            ORDER BY s.id_servicio, r.nombre_raza
        ");
        return response()->json(['ok' => true, 'servicios' => $datos]);
    }

    /**
     * Devuelve los servicios adicionales (ej: secado, desparasitación).
     * El cliente puede elegirlos como extras en la agenda.
     */
    public function adicionales()
    {
        $datos = DB::select("SELECT * FROM adicional");
        return response()->json(['ok' => true, 'adicionales' => $datos]);
    }

    /**
     * Devuelve los estilistas disponibles para agendar.
     * Solo los que tienen estado='Activo' y disponibilidad='Disponible'.
     */
    public function estilistas()
    {
        $datos = DB::select("
            SELECT id_estilista, nombre_estilista, apellido_estilista
            FROM estilista
            WHERE estado = 'Activo' AND disponibilidad = 'Disponible'
        ");
        return response()->json(['ok' => true, 'estilistas' => $datos]);
    }

    /**
     * Devuelve los horarios ocupados para una fecha y estilista.
     * Si id_estilista = 0 (sin preferencia), revisa todos los estilistas
     * y marca un slot como ocupado solo si TODOS están ocupados a esa hora.
     * Convierte la fecha de dd/mm/yyyy a yyyy-mm-dd para consultar la BD.
     * Calcula los slots de 30 min que cubre cada cita según su duración.
     */
    public function slots(Request $request)
    {
        $id_estilista = intval($request->input('id_estilista'));
        $fecha        = $request->input('fecha');

        // Convertir fecha de dd/mm/yyyy a yyyy-mm-dd
        $partes   = explode('/', $fecha);
        $fecha_bd = $partes[2] . '-' . str_pad($partes[1], 2, '0', STR_PAD_LEFT) . '-' . str_pad($partes[0], 2, '0', STR_PAD_LEFT);

        if ($id_estilista === 0) {
            // Sin preferencia: contar todos los estilistas activos
            $total = DB::select("SELECT COUNT(*) AS total FROM estilista WHERE estado = 'Activo' AND disponibilidad = 'Disponible'");
            $total_estilistas = $total[0]->total;
            $citas = DB::select("
                SELECT c.hora, rs.duracion
                FROM cita c
                JOIN raza_servicio rs ON c.id_servicio = rs.id_servicio
                WHERE c.fecha = ? AND c.estado != 'Cancelada'
            ", [$fecha_bd]);
        } else {
            // Con preferencia: revisar solo ese estilista
            $total_estilistas = 1;
            $citas = DB::select("
                SELECT c.hora, rs.duracion
                FROM cita c
                JOIN raza_servicio rs ON c.id_servicio = rs.id_servicio
                WHERE c.id_estilista = ? AND c.fecha = ? AND c.estado != 'Cancelada'
            ", [$id_estilista, $fecha_bd]);
        }

        // Calcular qué slots de 30 min están ocupados por cada cita
        $slots_ocupados = [];
        foreach ($citas as $row) {
            $hora_inicio = strtotime($row->hora);
            $duracion    = intval($row->duracion);
            $hora_fin    = $hora_inicio + ($duracion * 60);
            $slot        = $hora_inicio;
            while ($slot < $hora_fin) {
                $label = date('H:i', $slot);
                if (!isset($slots_ocupados[$label])) $slots_ocupados[$label] = 0;
                $slots_ocupados[$label]++;
                $slot += 1800; // Avanzar 30 minutos
            }
        }

        // Un slot se bloquea solo si todos los estilistas están ocupados
        $ocupados = [];
        foreach ($slots_ocupados as $slot => $cantidad) {
            if ($cantidad >= $total_estilistas) $ocupados[] = $slot;
        }

        return response()->json(['ok' => true, 'ocupados' => $ocupados]);
    }

    /**
     * Crea una nueva cita en la base de datos.
     * Si el cliente no eligió estilista (id_estilista=0), asigna uno disponible automáticamente.
     * Busca la mascota del cliente, determina el servicio según la raza,
     * inserta la cita y los adicionales elegidos.
     */
    public function crear(Request $request)
    {
        $id_cliente   = intval($request->input('id_cliente'));
        $id_estilista = intval($request->input('id_estilista'));
        $fecha        = $request->input('fecha');
        $hora         = $request->input('hora');
        $servicios    = json_decode($request->input('servicios'), true);
        $adicionales  = json_decode($request->input('adicionales'), true);

        // Convertir fecha de dd/mm/yyyy a yyyy-mm-dd
        $partes   = explode('/', $fecha);
        $fecha_bd = $partes[2] . '-' . str_pad($partes[1], 2, '0', STR_PAD_LEFT) . '-' . str_pad($partes[0], 2, '0', STR_PAD_LEFT);

        // Obtener la mascota del cliente
        $mascota = DB::select("SELECT id_mascota FROM mascota WHERE id_cliente = ? LIMIT 1", [$id_cliente]);
        if (empty($mascota)) {
            return response()->json(['ok' => false, 'error' => 'El cliente no tiene mascotas registradas']);
        }
        $id_mascota = $mascota[0]->id_mascota;

        // Obtener el servicio según la raza seleccionada
        $id_raza = intval($servicios[0]);
        $serv    = DB::select("SELECT id_servicio FROM raza_servicio WHERE id_raza = ? LIMIT 1", [$id_raza]);
        if (empty($serv)) {
            return response()->json(['ok' => false, 'error' => 'Servicio no encontrado']);
        }
        $id_servicio = $serv[0]->id_servicio;

        // Si no eligió estilista, asignar uno disponible en esa hora
        if ($id_estilista === 0) {
            $disponible = DB::select("
                SELECT id_estilista FROM estilista
                WHERE estado = 'Activo' AND disponibilidad = 'Disponible'
                AND id_estilista NOT IN (
                    SELECT id_estilista FROM cita
                    WHERE fecha = ? AND hora = ? AND estado != 'Cancelada'
                )
                LIMIT 1
            ", [$fecha_bd, $hora]);

            if (empty($disponible)) {
                return response()->json(['ok' => false, 'error' => 'No hay estilistas disponibles en ese horario']);
            }
            $id_estilista = $disponible[0]->id_estilista;
        }

        // Insertar la cita
        $id_cita = DB::table('cita')->insertGetId([
            'id_cliente'   => $id_cliente,
            'id_mascota'   => $id_mascota,
            'id_servicio'  => $id_servicio,
            'id_estilista' => $id_estilista,
            'fecha'        => $fecha_bd,
            'hora'         => $hora,
            'estado'       => 'Pendiente'
        ]);

        // Insertar servicios adicionales
        foreach ($adicionales as $id_ad) {
            DB::table('adicional_cita')->insert([
                'id_adicional' => intval($id_ad),
                'id_cita'      => $id_cita
            ]);
        }

        return response()->json(['ok' => true]);
    }
}

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
     * Convierte una fecha dd/mm/yyyy (formato del frontend) a yyyy-mm-dd (formato BD).
     */
    private function fechaABd($fecha)
    {
        $partes = explode('/', $fecha);
        return $partes[2] . '-' . str_pad($partes[1], 2, '0', STR_PAD_LEFT) . '-' . str_pad($partes[0], 2, '0', STR_PAD_LEFT);
    }

    /**
     * Duración (en minutos) más larga registrada para cada id_servicio.
     * Se usa como respaldo conservador para citas antiguas que quedaron con
     * id_raza = NULL (creadas antes de que esa columna existiera), para no
     * arriesgarnos a subestimar cuánto tiempo realmente ocupan.
     */
    private function duracionMaximaPorServicio()
    {
        $maximos = [];
        foreach (DB::select("SELECT id_servicio, duracion FROM raza_servicio") as $row) {
            $min = intval($row->duracion);
            if (!isset($maximos[$row->id_servicio]) || $min > $maximos[$row->id_servicio]) {
                $maximos[$row->id_servicio] = $min;
            }
        }
        return $maximos;
    }

    /**
     * Devuelve los rangos [inicio, fin) — en timestamp de minutos del día —
     * de las citas activas (no canceladas) de un estilista en una fecha.
     * La duración real se obtiene de raza_servicio vía id_raza + id_servicio
     * (la combinación exacta que se seleccionó al agendar). Si una cita no
     * tiene id_raza (citas antiguas previas a esta columna), se usa la
     * duración máxima conocida de ese servicio como margen de seguridad.
     */
    private function rangosOcupados($id_estilista, $fecha_bd)
    {
        $citas = DB::select("
            SELECT c.hora, c.id_servicio, rs.duracion
            FROM cita c
            LEFT JOIN raza_servicio rs ON rs.id_raza = c.id_raza AND rs.id_servicio = c.id_servicio
            WHERE c.id_estilista = ? AND c.fecha = ? AND c.estado != 'Cancelada'
        ", [$id_estilista, $fecha_bd]);

        $maximos = $this->duracionMaximaPorServicio();

        $rangos = [];
        foreach ($citas as $c) {
            $duracion = $c->duracion !== null ? intval($c->duracion) : ($maximos[$c->id_servicio] ?? 60);
            $inicio   = strtotime($c->hora);
            $rangos[] = [$inicio, $inicio + ($duracion * 60)];
        }
        return $rangos;
    }

    /** Indica si el rango [$inicio, $fin) se solapa con alguno de los $rangos dados */
    private function seSolapa($rangos, $inicio, $fin)
    {
        foreach ($rangos as [$ini, $fn]) {
            if ($ini < $fin && $fn > $inicio) return true;
        }
        return false;
    }

    /**
     * Indica si un estilista tiene un bloqueo temporal de disponibilidad
     * (ej. vacaciones) que cubra esa fecha. Esto es independiente del
     * campo `estilista`.`disponibilidad`, que es para baja permanente.
     */
    private function estaBloqueado($id_estilista, $fecha_bd)
    {
        $bloqueo = DB::select(
            "SELECT id_disponibilidad FROM disponibilidad_estilista
             WHERE id_estilista = ? AND ? BETWEEN fecha_inicio AND fecha_fin LIMIT 1",
            [$id_estilista, $fecha_bd]
        );
        return !empty($bloqueo);
    }

    /**
     * Devuelve los horarios ocupados para una fecha y estilista.
     * Si id_estilista = 0 (sin preferencia), revisa todos los estilistas
     * activos y marca un slot como ocupado solo si TODOS están ocupados a esa hora.
     *
     * PRECISIÓN: usa slots de 15 min y la duración real de cada cita
     * (id_raza + id_servicio), no un valor fijo ni el de otra raza.
     */
    public function slots(Request $request)
    {
        $id_estilista = intval($request->input('id_estilista'));
        $fecha_bd     = $this->fechaABd($request->input('fecha'));

        if ($id_estilista === 0) {
            // Sin preferencia: de entrada, ni siquiera considerar a quien tenga
            // un bloqueo temporal (ej. vacaciones) vigente en esa fecha
            $estilistas = DB::select("SELECT id_estilista FROM estilista WHERE estado = 'Activo' AND disponibilidad = 'Disponible'");
            $ids        = array_values(array_filter(
                array_map(fn($e) => $e->id_estilista, $estilistas),
                fn($id) => !$this->estaBloqueado($id, $fecha_bd)
            ));
        } else {
            $ids = [$id_estilista];
        }

        // Rangos ocupados de cada estilista relevante, calculados con su duración real.
        // Si se pidió un estilista específico y tiene un bloqueo temporal, el día
        // completo cuenta como ocupado para él (aunque no tenga citas ese día).
        $rangosPorEstilista  = [];
        $bloqueadoTodoElDia  = [];
        foreach ($ids as $id) {
            $rangosPorEstilista[$id] = $this->rangosOcupados($id, $fecha_bd);
            $bloqueadoTodoElDia[$id] = $this->estaBloqueado($id, $fecha_bd);
        }

        // Revisar cada slot de 15 min entre 9:00 y 17:00
        $ocupados = [];
        for ($s = strtotime('09:00'); $s < strtotime('17:00'); $s += 900) {
            $slot_fin = $s + 900;

            $ocupadosEnSlot = 0;
            foreach ($ids as $id) {
                if ($bloqueadoTodoElDia[$id] || $this->seSolapa($rangosPorEstilista[$id], $s, $slot_fin)) $ocupadosEnSlot++;
            }

            // Bloqueado si todos los estilistas relevantes están ocupados (o no hay ninguno disponible)
            if ($ocupadosEnSlot >= count($ids)) {
                $ocupados[] = date('H:i', $s);
            }
        }

        return response()->json(['ok' => true, 'ocupados' => $ocupados]);
    }

    /**
     * Crea una nueva cita en la base de datos.
     * Usa el id_mascota enviado por el cliente (verificando que sea suya),
     * guarda el id_raza seleccionado junto con el id_servicio, y valida que
     * el estilista (específico o "Cualquiera") esté realmente libre en todo
     * el rango de duración de la cita, no solo en la hora exacta de inicio.
     */
    public function crear(Request $request)
    {
        $id_cliente   = intval($request->input('id_cliente'));
        $id_mascota   = intval($request->input('id_mascota'));
        $id_estilista = intval($request->input('id_estilista'));
        $fecha        = $request->input('fecha');
        $hora         = $request->input('hora');
        $servicios    = json_decode($request->input('servicios'), true);
        $adicionales  = json_decode($request->input('adicionales'), true);

        $fecha_bd = $this->fechaABd($fecha);

        // Verificar que la mascota exista y sea realmente del cliente que agenda
        $mascotaValida = DB::select(
            "SELECT id_mascota FROM mascota WHERE id_mascota = ? AND id_cliente = ?",
            [$id_mascota, $id_cliente]
        );
        if (empty($mascotaValida)) {
            return response()->json(['ok' => false, 'error' => 'Mascota no encontrada para este cliente']);
        }

        // Obtener el servicio y la duración real según la raza seleccionada
        $id_raza = intval($servicios[0]);
        $serv    = DB::select("SELECT id_servicio, duracion FROM raza_servicio WHERE id_raza = ? LIMIT 1", [$id_raza]);
        if (empty($serv)) {
            return response()->json(['ok' => false, 'error' => 'Servicio no encontrado']);
        }
        $id_servicio = $serv[0]->id_servicio;
        $duracionMin = intval($serv[0]->duracion);

        $nuevoInicio = strtotime($hora);
        $nuevoFin    = $nuevoInicio + ($duracionMin * 60);

        if ($id_estilista === 0) {
            // Sin preferencia: asignar el primer estilista activo que esté
            // realmente libre en todo el rango de la cita (no solo a esa hora exacta)
            // y que no tenga un bloqueo temporal (ej. vacaciones) vigente ese día
            $estilistas   = DB::select("SELECT id_estilista FROM estilista WHERE estado = 'Activo' AND disponibilidad = 'Disponible'");
            $id_estilista = null;
            foreach ($estilistas as $e) {
                if ($this->estaBloqueado($e->id_estilista, $fecha_bd)) continue;
                $rangos = $this->rangosOcupados($e->id_estilista, $fecha_bd);
                if (!$this->seSolapa($rangos, $nuevoInicio, $nuevoFin)) {
                    $id_estilista = $e->id_estilista;
                    break;
                }
            }
            if ($id_estilista === null) {
                return response()->json(['ok' => false, 'error' => 'No hay estilistas disponibles en ese horario']);
            }
        } else {
            // Estilista específico: validar en el servidor que no tenga un bloqueo
            // temporal vigente y que esté libre en todo el rango de la cita
            if ($this->estaBloqueado($id_estilista, $fecha_bd)) {
                return response()->json(['ok' => false, 'error' => 'Ese estilista no está disponible en esa fecha']);
            }
            $rangos = $this->rangosOcupados($id_estilista, $fecha_bd);
            if ($this->seSolapa($rangos, $nuevoInicio, $nuevoFin)) {
                return response()->json(['ok' => false, 'error' => 'Ese estilista ya tiene una cita que se solapa con este horario']);
            }
        }

        // Insertar la cita
        $id_cita = DB::table('cita')->insertGetId([
            'id_cliente'   => $id_cliente,
            'id_mascota'   => $id_mascota,
            'id_servicio'  => $id_servicio,
            'id_raza'      => $id_raza,
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

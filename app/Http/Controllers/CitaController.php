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

use App\Services\Disponibilidad;
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
     * Si ya viene en yyyy-mm-dd la devuelve tal cual.
     */
    private function fechaABd($fecha)
    {
        if (str_contains($fecha, '/')) {
            $partes = explode('/', $fecha);
            return $partes[2] . '-' . str_pad($partes[1], 2, '0', STR_PAD_LEFT) . '-' . str_pad($partes[0], 2, '0', STR_PAD_LEFT);
        }
        return $fecha;
    }

    /**
     * Estilistas que pueden recibir citas "sin preferencia" en una fecha:
     * activos, disponibles y sin bloqueo temporal ese día.
     *
     * @return int[] ids de estilista
     */
    private function estilistasElegibles(Disponibilidad $disp, string $fecha_bd): array
    {
        $estilistas = DB::select("SELECT id_estilista FROM estilista WHERE estado = 'Activo' AND disponibilidad = 'Disponible'");
        return array_values(array_filter(
            array_map(fn($e) => intval($e->id_estilista), $estilistas),
            fn($id) => !$disp->estaBloqueado($id, $fecha_bd)
        ));
    }

    /**
     * Devuelve los horarios de inicio disponibles ("HH:MM") para una cita de
     * `duracion` minutos con un estilista en una fecha. Solo incluye horas en
     * las que la cita completa cabe antes del cierre (17:00) y no se solapa
     * con otra cita del estilista (ver App\Services\Disponibilidad).
     *
     * Si id_estilista = 0 (sin preferencia), un horario está disponible si
     * al menos un estilista elegible está libre en todo ese rango.
     *
     * Parámetros: id_estilista, fecha (dd/mm/yyyy o yyyy-mm-dd), duracion (min).
     */
    public function slots(Request $request, Disponibilidad $disp)
    {
        $id_estilista = intval($request->input('id_estilista'));
        $fecha_bd     = $this->fechaABd($request->input('fecha', ''));
        $duracion     = min(8 * 60, max(Disponibilidad::MINUTOS_SLOT, intval($request->input('duracion'))));

        $ids = $id_estilista === 0 ? $this->estilistasElegibles($disp, $fecha_bd) : [$id_estilista];

        $disponibles = [];
        foreach ($ids as $id) {
            $disponibles = array_merge($disponibles, $disp->horariosDisponibles($id, $fecha_bd, $duracion));
        }
        $disponibles = array_values(array_unique($disponibles));
        sort($disponibles);

        return response()->json(['ok' => true, 'disponibles' => $disponibles]);
    }

    /**
     * Crea una nueva cita en la base de datos.
     * Usa el id_mascota enviado por el cliente (verificando que sea suya),
     * guarda el id_raza seleccionado junto con el id_servicio, y valida con
     * las mismas reglas de slots() que el estilista (específico o "Cualquiera")
     * esté libre en todo el rango de la cita y que termine antes del cierre.
     */
    public function crear(Request $request, Disponibilidad $disp)
    {
        $id_cliente   = intval($request->attributes->get('id_cliente'));
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
        $serv    = DB::select("SELECT id_servicio FROM raza_servicio WHERE id_raza = ? LIMIT 1", [$id_raza]);
        if (empty($serv)) {
            return response()->json(['ok' => false, 'error' => 'Servicio no encontrado']);
        }
        $id_servicio = $serv[0]->id_servicio;
        $duracionMin = $disp->duracion($id_raza, $id_servicio);

        if ($id_estilista === 0) {
            // Sin preferencia: asignar el primer estilista elegible que esté
            // libre en todo el rango de la cita
            $asignado = null;
            foreach ($this->estilistasElegibles($disp, $fecha_bd) as $id) {
                if ($disp->validarHorario($id, $fecha_bd, $hora, $duracionMin) === null) {
                    $asignado = $id;
                    break;
                }
            }
            if ($asignado === null) {
                return response()->json(['ok' => false, 'error' => 'No hay estilistas disponibles en ese horario']);
            }
            $id_estilista = $asignado;
        } else {
            $error = $disp->validarHorario($id_estilista, $fecha_bd, $hora, $duracionMin);
            if ($error !== null) {
                return response()->json(['ok' => false, 'error' => $error]);
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

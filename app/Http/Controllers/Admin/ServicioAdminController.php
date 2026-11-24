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
    /**
     * Revisa la duración escrita por el administrador y la deja como "90 min".
     * Solo acepta minutos (ej. "90" o "90 min"), entre 5 y 480. Devuelve null
     * si no sirve: la agenda lee el número del inicio, así que "1 hora" se
     * leería como 1 minuto y se podrían cruzar citas.
     */
    private function normalizarDuracion($texto): ?string
    {
        if (!preg_match('/^\s*(\d{1,3})\s*(min)?\s*$/i', (string) $texto, $m)) {
            return null;
        }
        $minutos = intval($m[1]);
        return ($minutos >= 5 && $minutos <= 480) ? "{$minutos} min" : null;
    }

    public function editar(Request $request)
    {
        $id_raza     = intval($request->input('id_raza'));
        $id_servicio = intval($request->input('id_servicio'));
        $precio      = $request->input('precio');
        $duracion    = $this->normalizarDuracion($request->input('duracion'));

        if ($duracion === null) {
            return response()->json(['ok' => false, 'error' => 'Escribe la duración en minutos, por ejemplo 90.']);
        }

        DB::update(
            "UPDATE raza_servicio SET precio=?, duracion=? WHERE id_raza=? AND id_servicio=?",
            [$precio, $duracion, $id_raza, $id_servicio]
        );

        return response()->json(['ok' => true]);
    }
        /**
     * Crea una raza nueva y genera una fila en raza_servicio
     * para cada tipo de servicio existente con el precio y duración dados.
     */
        public function agregar(Request $request)
    {
        $request->validate([
            'nombre_raza' => ['required', 'string', 'max:30'],
            'servicios'   => ['required', 'array', 'min:1'],
        ]);

        $nombre    = strip_tags(trim($request->input('nombre_raza')));
        $servicios = $request->input('servicios');

        // Revisar todas las duraciones antes de guardar nada
        foreach ($servicios as $i => $item) {
            $duracion = $this->normalizarDuracion($item['duracion'] ?? '');
            if ($duracion === null) {
                return response()->json(['ok' => false, 'error' => 'Escribe cada duración en minutos, por ejemplo 90.']);
            }
            $servicios[$i]['duracion'] = $duracion;
        }

        // Insertar la raza nueva y obtener su ID
        $id_raza = DB::table('raza')->insertGetId([
            'nombre_raza' => $nombre
        ]);

        // Insertar solo en los servicios que el admin marcó
        foreach ($servicios as $item) {
            DB::table('raza_servicio')->insert([
                'id_raza'     => $id_raza,
                'id_servicio' => intval($item['id_servicio']),
                'precio'      => floatval($item['precio']),
                'duracion'    => $item['duracion'],   // ya revisada: "90 min"
            ]);
        }

        return response()->json(['ok' => true]);
    }

    public function listaCategorias()
    {
        // "Servicio individual" (citas de solo adicionales) no lleva razas ni
        // precios propios, por eso no se ofrece al crear una raza
        $servicios = DB::table('servicio')
            ->select('id_servicio', 'nombre_servicio')
            ->where('nombre_servicio', '!=', \App\Services\Disponibilidad::SERVICIO_INDIVIDUAL)
            ->get();

        return response()->json(['ok' => true, 'servicios' => $servicios]);
    }

    /**
     * Elimina una raza y sus precios en raza_servicio.
     * Solo se puede eliminar si no tiene citas asociadas.
     */
    public function eliminar(Request $request)
    {
        $id_raza = intval($request->input('id_raza'));

        $citasAsociadas = DB::table('cita')->where('id_raza', $id_raza)->count();
        if ($citasAsociadas > 0) {
            return response()->json(['ok' => false, 'error' => 'No se puede eliminar: hay citas asociadas a esta raza.']);
        }

        DB::table('raza_servicio')->where('id_raza', $id_raza)->delete();
        DB::table('raza')->where('id_raza', $id_raza)->delete();

        return response()->json(['ok' => true]);
    }
}

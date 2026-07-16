<?php

/**
 * EmpleadoAdminController
 * =======================
 * Gestión de estilistas desde el panel administrador (empleados.js).
 * Permite ver, agregar, editar y eliminar estilistas.
 *
 * Rutas: GET  /api/admin/empleados
 *        POST /api/admin/empleados/agregar
 *        POST /api/admin/empleados/editar
 *        POST /api/admin/empleados/eliminar
 */

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EmpleadoAdminController extends Controller
{
    /**
     * Devuelve la lista de todos los estilistas registrados.
     */
    public function index()
    {
        $empleados = DB::select(
            "SELECT id_estilista, nombre_estilista, apellido_estilista, telefono_estilista, rol, estado, correo FROM estilista"
        );
        return response()->json(['ok' => true, 'empleados' => $empleados]);
    }

    /**
     * Registra un nuevo estilista. Por defecto queda Activo y Disponible.
     */
    public function agregar(Request $request)
    {
        DB::table('estilista')->insert([
            'nombre_estilista'   => $request->input('nombre'),
            'apellido_estilista' => $request->input('apellido'),
            'telefono_estilista' => $request->input('telefono'),
            'correo'             => $request->input('correo'),
            'contrasena'         => Hash::make($request->input('contrasena')),
            'rol'                => $request->input('rol'),
            'estado'             => 'Activo',
            'disponibilidad'     => 'Disponible'
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Actualiza los datos de un estilista por su id_estilista.
     */
    public function editar(Request $request)
    {
        $id       = intval($request->input('id_estilista'));
        $nombre   = trim($request->input('nombre', ''));
        $apellido = trim($request->input('apellido', ''));
        $telefono = trim($request->input('telefono', ''));
        $correo   = trim($request->input('correo', ''));
        $rol      = trim($request->input('rol', ''));

        if (!$id || !$nombre || !$apellido || !$telefono || !$correo || !$rol) {
            return response()->json(['ok' => false, 'error' => 'Todos los campos son obligatorios.'], 422);
        }

        DB::update(
            "UPDATE estilista SET nombre_estilista=?, apellido_estilista=?, telefono_estilista=?, correo=?, rol=? WHERE id_estilista=?",
            [$nombre, $apellido, $telefono, $correo, $rol, $id]
        );

        return response()->json(['ok' => true]);
    }

    /**
     * Elimina un estilista. Rechaza la operación si tiene citas activas
     * (Pendiente o Reagendada) para evitar dejar datos huérfanos.
     */
    public function eliminar(Request $request)
    {
        $id = intval($request->input('id_estilista'));

        $citasActivas = DB::selectOne(
            "SELECT COUNT(*) AS total FROM cita WHERE id_estilista = ? AND estado IN ('Pendiente', 'Reagendada')",
            [$id]
        );

        if ($citasActivas && $citasActivas->total > 0) {
            return response()->json([
                'ok'    => false,
                'error' => 'No se puede eliminar el estilista porque tiene citas pendientes o reagendadas.'
            ], 422);
        }

        DB::delete("DELETE FROM estilista WHERE id_estilista = ?", [$id]);
        return response()->json(['ok' => true]);
    }
}

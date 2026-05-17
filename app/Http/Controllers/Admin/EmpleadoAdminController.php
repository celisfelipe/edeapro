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
            'contrasena'         => $request->input('contrasena'),
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
        $id = intval($request->input('id_estilista'));

        DB::update(
            "UPDATE estilista SET nombre_estilista=?, apellido_estilista=?, telefono_estilista=?, correo=?, rol=? WHERE id_estilista=?",
            [
                $request->input('nombre'),
                $request->input('apellido'),
                $request->input('telefono'),
                $request->input('correo'),
                $request->input('rol'),
                $id
            ]
        );

        return response()->json(['ok' => true]);
    }

    /**
     * Elimina un estilista por su id_estilista.
     */
    public function eliminar(Request $request)
    {
        $id = intval($request->input('id_estilista'));
        DB::delete("DELETE FROM estilista WHERE id_estilista = ?", [$id]);
        return response()->json(['ok' => true]);
    }
}

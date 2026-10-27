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
use App\Models\Estilista;
use Illuminate\Support\Facades\Storage;

class EmpleadoAdminController extends Controller
{
    /**
     * Devuelve la lista de todos los estilistas registrados.
     */
    public function index()
    {
        $empleados = DB::select(
            "SELECT id_estilista, nombre_estilista, apellido_estilista, telefono_estilista, rol, estado, correo, foto FROM estilista"
        );

        // URL lista para usar en el <img> (null si el archivo no está en este PC)
        foreach ($empleados as $e) {
            $e->foto_url = Estilista::urlFoto($e->foto);
            unset($e->foto);
        }
        return response()->json(['ok' => true, 'empleados' => $empleados]);
    }

    /**
     * Registra un nuevo estilista. Por defecto queda Activo y Disponible.
     */
    public function agregar(Request $request)
    {
        $request->validate([
            'nombre'     => ['required', 'string', 'max:100', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/'],
            'apellido'   => ['required', 'string', 'max:100', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/'],
            'telefono'   => ['required', 'regex:/^\d{10}$/'],
            'correo'     => ['required', 'email', 'max:150'],
            'contrasena' => ['required', 'min:8', 'regex:/^(?=.*[A-Z])(?=.*\d).{8,}$/'],
            'rol'        => ['required', 'in:Administrador,Peluquero'],
        ]);

        $nombre     = strip_tags(trim($request->input('nombre')));
        $apellido   = strip_tags(trim($request->input('apellido')));
        $telefono   = strip_tags(trim($request->input('telefono')));
        $correo     = filter_var(trim($request->input('correo')), FILTER_SANITIZE_EMAIL);
        $contrasena = $request->input('contrasena');
        $rol        = $request->input('rol');

        $rutaFoto = null;
        if ($request->hasFile('foto')) {
            $rutaFoto = $request->file('foto')->store('fotos', 'uploads');
        }

        DB::table('estilista')->insert([
            'nombre_estilista'   => $nombre,
            'apellido_estilista' => $apellido,
            'telefono_estilista' => $telefono,
            'correo'             => $correo,
            'contrasena'         => Hash::make($contrasena),
            'rol'                => $rol,
            'estado'             => 'Activo',
            'disponibilidad'     => 'Disponible',
            'foto'               => $rutaFoto
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

        // Nuevo: recibimos el estado y validamos que sea uno de los dos valores permitidos
        $estadoRaw = trim($request->input('estado', 'Activo'));
        $estado    = in_array($estadoRaw, ['Activo', 'Inactivo']) ? $estadoRaw : 'Activo';

        if (!$id || !$nombre || !$apellido || !$telefono || !$correo || !$rol) {
            return response()->json(['ok' => false, 'error' => 'Todos los campos son obligatorios.'], 422);
        }

        if ($request->hasFile('foto')) {
            // Borrar la foto anterior para no dejar archivos huérfanos
            $fotoAnterior = DB::table('estilista')->where('id_estilista', $id)->value('foto');
            if ($fotoAnterior) {
                Storage::disk('uploads')->delete($fotoAnterior);
            }

            $rutaFoto = $request->file('foto')->store('fotos', 'uploads');
            DB::update(
                "UPDATE estilista SET nombre_estilista=?, apellido_estilista=?, telefono_estilista=?, correo=?, rol=?, estado=?, foto=? WHERE id_estilista=?",
                [$nombre, $apellido, $telefono, $correo, $rol, $estado, $rutaFoto, $id]
            );
        } elseif ($request->input('eliminar_foto') === '1') {
            // El admin pulsó "Eliminar foto" en el modal: se borra el archivo
            // y la columna vuelve a NULL (la tarjeta mostrará las iniciales)
            $fotoAnterior = DB::table('estilista')->where('id_estilista', $id)->value('foto');
            if ($fotoAnterior) {
                Storage::disk('uploads')->delete($fotoAnterior);
            }

            DB::update(
                "UPDATE estilista SET nombre_estilista=?, apellido_estilista=?, telefono_estilista=?, correo=?, rol=?, estado=?, foto=NULL WHERE id_estilista=?",
                [$nombre, $apellido, $telefono, $correo, $rol, $estado, $id]
            );
        } else {
            DB::update(
                "UPDATE estilista SET nombre_estilista=?, apellido_estilista=?, telefono_estilista=?, correo=?, rol=?, estado=? WHERE id_estilista=?",
                [$nombre, $apellido, $telefono, $correo, $rol, $estado, $id]
            );
        }

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

        // Borrar también su foto, para no dejar archivos huérfanos en uploads/
        $foto = DB::table('estilista')->where('id_estilista', $id)->value('foto');
        if ($foto) {
            Storage::disk('uploads')->delete($foto);
        }

        DB::delete("DELETE FROM estilista WHERE id_estilista = ?", [$id]);
        return response()->json(['ok' => true]);
    }
}

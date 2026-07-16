<?php

/**
 * ClienteAdminController
 * ======================
 * Gestión de clientes desde el panel administrador (clientes.js).
 * Permite ver, editar y eliminar clientes con todos sus datos relacionados.
 *
 * Rutas: GET  /api/admin/clientes
 *        POST /api/admin/clientes/editar
 *        POST /api/admin/clientes/eliminar
 */

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClienteAdminController extends Controller
{
    /**
     * Devuelve la lista completa de clientes registrados.
     */
    public function index()
    {
        $clientes = DB::select("SELECT id_cliente, nombre, apellido, telefono, correo FROM cliente");
        return response()->json(['ok' => true, 'clientes' => $clientes]);
    }

    /**
     * Actualiza los datos de un cliente por su id_cliente.
     */
    public function editar(Request $request)
    {
        $id       = intval($request->input('id_cliente'));
        $nombre   = trim($request->input('nombre', ''));
        $apellido = trim($request->input('apellido', ''));
        $telefono = trim($request->input('telefono', ''));
        $correo   = trim($request->input('correo', ''));

        if (!$id || !$nombre || !$apellido || !$telefono || !$correo) {
            return response()->json(['ok' => false, 'error' => 'Todos los campos son obligatorios.'], 422);
        }

        DB::update(
            "UPDATE cliente SET nombre=?, apellido=?, telefono=?, correo=? WHERE id_cliente=?",
            [$nombre, $apellido, $telefono, $correo, $id]
        );

        return response()->json(['ok' => true]);
    }

    /**
     * Elimina un cliente y todos sus datos relacionados.
     * El orden de eliminación respeta las restricciones de claves foráneas:
     * adicional_cita → notificacion → pago → cita → mascota → cliente_promocion → cliente
     */
    public function eliminar(Request $request)
    {
        $id = intval($request->input('id_cliente'));

        DB::delete("DELETE FROM adicional_cita WHERE id_cita IN (SELECT id_cita FROM cita WHERE id_cliente = ?)", [$id]);
        DB::delete("DELETE FROM notificacion WHERE id_cliente = ?", [$id]);
        DB::delete("DELETE FROM pago WHERE id_cita IN (SELECT id_cita FROM cita WHERE id_cliente = ?)", [$id]);
        DB::delete("DELETE FROM cita WHERE id_cliente = ?", [$id]);
        DB::delete("DELETE FROM mascota WHERE id_cliente = ?", [$id]);
        DB::delete("DELETE FROM cliente_promocion WHERE id_cliente = ?", [$id]);
        DB::delete("DELETE FROM cliente WHERE id_cliente = ?", [$id]);

        return response()->json(['ok' => true]);
    }
}

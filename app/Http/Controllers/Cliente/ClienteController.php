<?php

/**
 * ClienteController
 * =================
 * Provee datos al perfil del cliente (perfil.js en cliente/).
 * Permite al cliente ver y editar su información, mascotas, citas y pagos.
 *
 * Rutas: GET  /api/cliente/perfil
 *        POST /api/cliente/actualizar
 *        GET  /api/cliente/mascotas
 *        GET  /api/cliente/citas
 *        POST /api/cliente/cancelar-cita
 *        GET  /api/cliente/pagos
 */

namespace App\Http\Controllers\Cliente;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClienteController extends Controller
{
    /**
     * Devuelve los datos del perfil de un cliente por su id_cliente.
     */
    public function perfil(Request $request)
    {
        $id      = intval($request->input('id_cliente'));
        $cliente = DB::select(
            "SELECT id_cliente, nombre, apellido, telefono, correo FROM cliente WHERE id_cliente = ?",
            [$id]
        );

        if (empty($cliente)) {
            return response()->json(['ok' => false, 'error' => 'Cliente no encontrado']);
        }

        return response()->json(['ok' => true, 'cliente' => $cliente[0]]);
    }

    /**
     * Actualiza los datos del perfil del cliente.
     * El cliente puede cambiar nombre, apellido, teléfono y correo.
     */
    public function actualizar(Request $request)
    {
        $id = intval($request->input('id_cliente'));

        DB::update(
            "UPDATE cliente SET nombre=?, apellido=?, telefono=?, correo=? WHERE id_cliente=?",
            [
                $request->input('nombre'),
                $request->input('apellido'),
                $request->input('telefono'),
                $request->input('correo'),
                $id
            ]
        );

        return response()->json(['ok' => true]);
    }

    /**
     * Devuelve las mascotas registradas para un cliente.
     */
    public function mascotas(Request $request)
    {
        $id       = intval($request->input('id_cliente'));
        $mascotas = DB::select(
            "SELECT id_mascota, nombre, especie, edad, genero FROM mascota WHERE id_cliente = ?",
            [$id]
        );

        return response()->json(['ok' => true, 'mascotas' => $mascotas]);
    }

    /**
     * Devuelve el historial de citas del cliente con detalle de mascota, servicio y estilista.
     * Ordenadas de más reciente a más antigua.
     */
    public function citas(Request $request)
    {
        $id    = intval($request->input('id_cliente'));
        $citas = DB::select("
            SELECT c.id_cita, c.fecha, c.hora, c.estado,
                   m.nombre AS mascota,
                   s.nombre_servicio,
                   e.nombre_estilista
            FROM cita c
            JOIN mascota m  ON c.id_mascota   = m.id_mascota
            JOIN servicio s ON c.id_servicio  = s.id_servicio
            JOIN estilista e ON c.id_estilista = e.id_estilista
            WHERE c.id_cliente = ?
            ORDER BY c.fecha DESC, c.hora ASC
        ", [$id]);

        return response()->json(['ok' => true, 'citas' => $citas]);
    }

    /**
     * Cancela una cita del cliente cambiando su estado a 'Cancelada'.
     * Solo citas en estado 'Pendiente' deberían poder cancelarse (validación en el JS).
     */
    public function cancelarCita(Request $request)
    {
        $id = intval($request->input('id_cita'));
        DB::update("UPDATE cita SET estado = 'Cancelada' WHERE id_cita = ?", [$id]);
        return response()->json(['ok' => true]);
    }

    /**
     * Devuelve el historial de pagos del cliente con el nombre del servicio.
     * Ordenado de más reciente a más antiguo.
     */
    public function pagos(Request $request)
    {
        $id    = intval($request->input('id_cliente'));
        $pagos = DB::select("
            SELECT p.fecha_pago, p.metodo_pago, p.estado_pago, s.nombre_servicio
            FROM pago p
            JOIN cita c     ON p.id_cita      = c.id_cita
            JOIN servicio s ON c.id_servicio  = s.id_servicio
            WHERE c.id_cliente = ?
            ORDER BY p.fecha_pago DESC
        ", [$id]);

        return response()->json(['ok' => true, 'pagos' => $pagos]);
    }
}

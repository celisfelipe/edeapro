<?php

/**
 * ResenaController
 * ================
 * Gestiona las reseñas de clientes en la página de ubicación.
 * Solo clientes autenticados pueden crear reseñas.
 *
 * Rutas:
 *   GET  /api/resenas        → traer todas las reseñas con nombre del cliente
 *   POST /api/resenas/crear  → guardar nueva reseña
 */

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResenaController extends Controller
{
    /**
     * Devuelve todas las reseñas con el nombre del cliente.
     * Ordenadas de más reciente a más antigua.
     */
    public function index()
    {
        $resenas = DB::select("
            SELECT r.id_resena, r.puntuacion, r.comentario, r.fecha,
                   c.nombre AS nombre_cliente, c.apellido AS apellido_cliente
            FROM resena r
            JOIN cliente c ON r.id_cliente = c.id_cliente
            ORDER BY r.fecha DESC
        ");

        return response()->json(['ok' => true, 'resenas' => $resenas]);
    }

    /**
     * Guarda una nueva reseña del cliente logueado.
     * El id_cliente sale del token (no del request, que cualquiera puede
     * manipular) — y como esta ruta solo exige "alguna sesión válida" (no
     * un rol específico), también se confirma que el token sea de un
     * cliente y no de un administrador/peluquero antes de usarlo como
     * id_cliente.
     */
    public function crear(Request $request)
    {
        if ($request->attributes->get('auth_tokenable_type') !== 'cliente') {
            return response()->json(['ok' => false, 'error' => 'Solo los clientes pueden dejar reseñas'], 403);
        }

        $id_cliente  = intval($request->attributes->get('auth_tokenable_id'));
        $puntuacion  = intval($request->input('puntuacion'));
        $comentario  = $request->input('comentario');

        // Validar que la puntuación esté entre 1 y 5
        if ($puntuacion < 1 || $puntuacion > 5) {
            return response()->json(['ok' => false, 'error' => 'Puntuación inválida']);
        }

        if (empty($comentario)) {
            return response()->json(['ok' => false, 'error' => 'El comentario no puede estar vacío']);
        }

        DB::table('resena')->insert([
            'id_cliente' => $id_cliente,
            'puntuacion' => $puntuacion,
            'comentario' => $comentario
        ]);

        return response()->json(['ok' => true, 'mensaje' => 'Reseña guardada correctamente']);
    }
}

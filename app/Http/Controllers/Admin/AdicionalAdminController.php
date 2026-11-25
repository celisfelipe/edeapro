<?php

/**
 * AdicionalAdminController
 * ========================
 * Gestión de los adicionales (corte de uñas, hidratación, shampoos, etc.)
 * desde la página Servicios del administrador (servicios.js).
 * Los adicionales que se crean aquí aparecen solos en la agenda del cliente
 * (pestaña "Adicionales") y se cobran en Pagos con su precio.
 *
 * Rutas: GET  /api/admin/adicionales
 *        POST /api/admin/adicionales/agregar
 *        POST /api/admin/adicionales/editar
 *        POST /api/admin/adicionales/eliminar
 */

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdicionalAdminController extends Controller
{
    /** Precio máximo aceptado (evita errores de digitación, ej. un cero de más) */
    private const PRECIO_MAXIMO = 5000000;

    /**
     * Lista todos los adicionales, con cuántas citas los han usado
     * (si ya se usaron, no se pueden eliminar).
     */
    public function index()
    {
        $adicionales = DB::select("
            SELECT a.id_adicional, a.nombre_adicional, a.precio_adicional,
                   (SELECT COUNT(*) FROM adicional_cita ac WHERE ac.id_adicional = a.id_adicional) AS usos
            FROM adicional a
            ORDER BY a.nombre_adicional
        ");

        return response()->json(['ok' => true, 'adicionales' => $adicionales]);
    }

    /**
     * Revisa nombre y precio. Devuelve el mensaje de error, o null si están bien.
     * El nombre cabe en la columna nombre_adicional (30 caracteres) y no puede
     * repetirse con otro adicional.
     */
    private function validar(string $nombre, $precio, ?int $id_actual = null): ?string
    {
        if ($nombre === '' || mb_strlen($nombre) > 30) {
            return 'Escribe el nombre del adicional (máximo 30 caracteres).';
        }
        if (!is_numeric($precio) || $precio <= 0 || $precio > self::PRECIO_MAXIMO) {
            return 'Escribe un precio válido (solo números, mayor que 0).';
        }

        $repetido = DB::selectOne(
            "SELECT id_adicional FROM adicional WHERE LOWER(nombre_adicional) = LOWER(?) AND id_adicional != ?",
            [$nombre, $id_actual ?? 0]
        );
        if ($repetido) {
            return 'Ya existe un adicional con ese nombre.';
        }
        return null;
    }

    /**
     * Crea un adicional nuevo. La columna id_adicional no es autoincremental,
     * así que se calcula el siguiente número dentro de una transacción con
     * bloqueo, para que dos administradores no tomen el mismo id a la vez.
     */
    public function agregar(Request $request)
    {
        $nombre = strip_tags(trim((string) $request->input('nombre')));
        $precio = $request->input('precio');

        $error = $this->validar($nombre, $precio);
        if ($error !== null) {
            return response()->json(['ok' => false, 'error' => $error]);
        }

        DB::transaction(function () use ($nombre, $precio) {
            $siguiente = DB::table('adicional')->lockForUpdate()->max('id_adicional') + 1;
            DB::table('adicional')->insert([
                'id_adicional'     => $siguiente,
                'nombre_adicional' => $nombre,
                'precio_adicional' => round((float) $precio, 2),
            ]);
        });

        return response()->json(['ok' => true]);
    }

    /**
     * Cambia el nombre y el precio de un adicional.
     * Las citas ya cobradas no cambian: el pago guarda su propio monto.
     */
    public function editar(Request $request)
    {
        $id     = intval($request->input('id_adicional'));
        $nombre = strip_tags(trim((string) $request->input('nombre')));
        $precio = $request->input('precio');

        if (!DB::table('adicional')->where('id_adicional', $id)->exists()) {
            return response()->json(['ok' => false, 'error' => 'Adicional no encontrado.']);
        }

        $error = $this->validar($nombre, $precio, $id);
        if ($error !== null) {
            return response()->json(['ok' => false, 'error' => $error]);
        }

        DB::table('adicional')->where('id_adicional', $id)->update([
            'nombre_adicional' => $nombre,
            'precio_adicional' => round((float) $precio, 2),
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Elimina un adicional que nunca se ha usado en una cita.
     * Si ya se usó, no se borra: las citas y los pagos antiguos lo necesitan.
     */
    public function eliminar(Request $request)
    {
        $id = intval($request->input('id_adicional'));

        if (DB::table('adicional_cita')->where('id_adicional', $id)->exists()) {
            return response()->json(['ok' => false, 'error' => 'Este adicional ya se usó en citas, por eso no se puede eliminar. Puedes cambiarle el nombre o el precio.']);
        }

        $borrados = DB::table('adicional')->where('id_adicional', $id)->delete();
        if ($borrados === 0) {
            return response()->json(['ok' => false, 'error' => 'Adicional no encontrado.']);
        }

        return response()->json(['ok' => true]);
    }
}
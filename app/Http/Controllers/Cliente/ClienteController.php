<?php

/**
 * ClienteController
 * =================
 * Provee datos al perfil del cliente (perfil.js en cliente/).
 * Permite al cliente ver y editar su información, mascotas, citas y pagos.
 *
 * SEGURIDAD: todos los métodos identifican "qué cliente es" a partir del
 * id_cliente real del token (verificar.token:cliente lo deja en
 * $request->attributes), NUNCA del id_cliente que venga en el request —
 * cualquiera puede escribir cualquier valor ahí.
 *
 * Rutas: GET  /api/cliente/perfil
 *        POST /api/cliente/actualizar
 *        GET  /api/cliente/mascotas
 *        POST /api/cliente/mascotas/agregar
 *        GET  /api/cliente/mascotas/historial
 *        GET  /api/cliente/citas
 *        POST /api/cliente/cancelar-cita
 *        GET  /api/cliente/reagendar-horarios
 *        POST /api/cliente/reagendar-cita
 *        GET  /api/cliente/pagos
 */

namespace App\Http\Controllers\Cliente;

use App\Http\Controllers\Controller;
use App\Services\Disponibilidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClienteController extends Controller
{
    /** Id del cliente dueño del token de la petición actual */
    private function idClienteAutenticado(Request $request)
    {
        return intval($request->attributes->get('auth_tokenable_id'));
    }

    /**
     * Devuelve los datos del perfil del cliente autenticado.
     */
    public function perfil(Request $request)
    {
        $id      = $this->idClienteAutenticado($request);
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
     * Actualiza los datos del perfil del cliente autenticado.
     * El cliente puede cambiar nombre, apellido, teléfono y correo.
     */
    public function actualizar(Request $request)
    {
        $id = $this->idClienteAutenticado($request);

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
     * Devuelve las mascotas registradas para el cliente autenticado.
     */
    public function mascotas(Request $request)
    {
        $id       = $this->idClienteAutenticado($request);
        $mascotas = DB::select(
            "SELECT id_mascota, nombre, especie, edad, genero FROM mascota WHERE id_cliente = ?",
            [$id]
        );

        return response()->json(['ok' => true, 'mascotas' => $mascotas]);
    }

    /**
     * Registra una nueva mascota para el cliente que tiene la sesión activa.
     */
    public function agregarMascota(Request $request)
    {
        $id_cliente = $this->idClienteAutenticado($request);
        $nombre     = strip_tags(trim($request->input('nombre', '')));
        $especie    = strip_tags(trim($request->input('especie', '')));
        $genero     = strip_tags(trim($request->input('genero', '')));
        $edad       = intval($request->input('edad'));

        if (!$id_cliente || !$nombre || !$especie || !$genero) {
            return response()->json(['ok' => false, 'error' => 'Completa todos los campos.']);
        }

        $id_mascota = DB::table('mascota')->insertGetId([
            'id_cliente' => $id_cliente,
            'nombre'     => $nombre,
            'especie'    => $especie,
            'edad'       => $edad,
            'genero'     => $genero
        ]);

        return response()->json(['ok' => true, 'id_mascota' => $id_mascota]);
    }

    /**
     * Devuelve el historial de citas de UNA mascota específica (RF 1.6).
     * Verifica primero que la mascota pertenezca al cliente autenticado —
     * si no, devuelve 403 en vez de filtrar en silencio.
     */
    public function historialMascota(Request $request)
    {
        $id_cliente = $this->idClienteAutenticado($request);
        $id_mascota = intval($request->input('id_mascota'));

        $mascotaValida = DB::select(
            "SELECT id_mascota FROM mascota WHERE id_mascota = ? AND id_cliente = ?",
            [$id_mascota, $id_cliente]
        );
        if (empty($mascotaValida)) {
            return response()->json(['ok' => false, 'error' => 'Mascota no encontrada para este cliente'], 403);
        }

        $historial = DB::select("
            SELECT c.fecha, c.hora, c.estado, s.nombre_servicio, e.nombre_estilista
            FROM cita c
            JOIN servicio s  ON c.id_servicio  = s.id_servicio
            JOIN estilista e ON c.id_estilista = e.id_estilista
            WHERE c.id_mascota = ?
            ORDER BY c.fecha DESC, c.hora DESC
        ", [$id_mascota]);

        return response()->json(['ok' => true, 'historial' => $historial]);
    }

    /**
     * Devuelve el historial de citas del cliente autenticado con detalle de
     * mascota, servicio y estilista. Ordenadas de más reciente a más antigua.
     */
    public function citas(Request $request)
    {
        $id    = $this->idClienteAutenticado($request);
        $citas = DB::select("
            SELECT c.id_cita, c.fecha, c.hora, c.estado,
                   c.id_estilista,
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
     * Cancela una cita del cliente autenticado cambiando su estado a 'Cancelada'.
     * Verifica primero que la cita pertenezca a ese cliente — si no, 403.
     * Solo citas en estado 'Pendiente' deberían poder cancelarse (validación en el JS).
     */
    public function cancelarCita(Request $request)
{
    $id_cliente = $this->idClienteAutenticado($request);
    $id_cita    = intval($request->input('id_cita'));
    $motivo     = strip_tags(trim($request->input('motivo', '')));

    if (!$motivo) {
        return response()->json(['ok' => false, 'error' => 'Debes indicar el motivo de cancelación.']);
    }

    $citaValida = DB::select(
        "SELECT id_cita FROM cita WHERE id_cita = ? AND id_cliente = ? AND estado IN ('Pendiente', 'Reagendada')",
        [$id_cita, $id_cliente]
    );
    if (empty($citaValida)) {
        return response()->json(['ok' => false, 'error' => 'Cita no encontrada o ya no está pendiente.'], 403);
    }

    DB::update(
        "UPDATE cita SET estado = 'Cancelada', motivo = ? WHERE id_cita = ?",
        [$motivo, $id_cita]
    );

    return response()->json(['ok' => true]);
}

    /**
     * Busca una cita reagendable (Pendiente o Reagendada) del cliente
     * autenticado. Devuelve null si no existe o no es suya.
     */
    private function citaReagendable(int $id_cita, int $id_cliente)
    {
        return DB::selectOne(
            "SELECT id_cita, id_estilista, id_raza, id_servicio
             FROM cita
             WHERE id_cita = ? AND id_cliente = ? AND estado IN ('Pendiente', 'Reagendada')",
            [$id_cita, $id_cliente]
        );
    }

    /** Indica si fecha + hora quedan a más de 24h desde ahora (regla de reagendamiento) */
    private function conAnticipacion(string $fecha, string $hora): bool
    {
        return strtotime($fecha . ' ' . $hora) > strtotime('+24 hours');
    }

    /**
     * Devuelve los horarios ("HH:MM") a los que se puede mover una cita en
     * una fecha nueva, con el mismo estilista. Usa las mismas reglas que el
     * agendamiento inicial (App\Services\Disponibilidad):
     *   - la cita completa debe caber antes del cierre (17:00 − duración),
     *   - no puede solaparse con otras citas del estilista (la propia cita
     *     se ignora, para poder moverla dentro del mismo día),
     *   - no se ofrecen domingos ni días con bloqueo temporal del estilista.
     * Además se quitan los horarios a menos de 24h, que reagendarCita() rechazaría.
     *
     * Parámetros: id_cita, fecha (YYYY-MM-DD).
     */
    public function horariosReagendar(Request $request, Disponibilidad $disp)
    {
        $id_cliente = $this->idClienteAutenticado($request);
        $id_cita    = intval($request->input('id_cita'));
        $fecha      = (string) $request->input('fecha', '');

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
            return response()->json(['ok' => false, 'error' => 'Fecha inválida.'], 422);
        }

        $cita = $this->citaReagendable($id_cita, $id_cliente);
        if (!$cita) {
            return response()->json(['ok' => false, 'error' => 'Cita no encontrada o ya no está pendiente.'], 403);
        }

        if (!$disp->estilistaAtiende($cita->id_estilista)) {
            return response()->json(['ok' => true, 'disponibles' => [],
                'aviso' => 'Tu estilista no está recibiendo citas en este momento.']);
        }

        $duracion    = $disp->duracion($cita->id_raza, $cita->id_servicio);
        $disponibles = $disp->horariosDisponibles($cita->id_estilista, $fecha, $duracion, $cita->id_cita);
        $disponibles = array_values(array_filter($disponibles, fn($h) => $this->conAnticipacion($fecha, $h)));

        return response()->json(['ok' => true, 'disponibles' => $disponibles, 'duracion' => $duracion]);
    }

    /**
     * Reagenda una cita del cliente autenticado (mismo estilista).
     * Valida en el servidor, con las mismas reglas que horariosReagendar():
     * que la cita sea suya y esté pendiente, que la nueva fecha sea con más
     * de 24h de anticipación, que la cita completa termine antes del cierre
     * y que el estilista esté libre en todo ese rango.
     */
    public function reagendarCita(Request $request, Disponibilidad $disp)
    {
        $id_cliente = $this->idClienteAutenticado($request);
        $id_cita    = intval($request->input('id_cita'));
        $fecha      = (string) $request->input('fecha', '');
        $hora       = (string) $request->input('hora', '');

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha) || !preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $hora)) {
            return response()->json(['ok' => false, 'error' => 'Debes seleccionar fecha y hora.']);
        }

        if (!$this->conAnticipacion($fecha, $hora)) {
            return response()->json(['ok' => false, 'error' => 'Solo puedes reagendar con más de 24 horas de anticipación.']);
        }

        $cita = $this->citaReagendable($id_cita, $id_cliente);
        if (!$cita) {
            return response()->json(['ok' => false, 'error' => 'Cita no encontrada o ya no está pendiente.'], 403);
        }

        if (!$disp->estilistaAtiende($cita->id_estilista)) {
            return response()->json(['ok' => false, 'error' => 'Tu estilista no está recibiendo citas en este momento.']);
        }

        $duracion = $disp->duracion($cita->id_raza, $cita->id_servicio);
        $error    = $disp->validarHorario($cita->id_estilista, $fecha, $hora, $duracion, $cita->id_cita);
        if ($error !== null) {
            return response()->json(['ok' => false, 'error' => $error]);
        }

        DB::update(
            "UPDATE cita SET fecha = ?, hora = ?, estado = 'Reagendada' WHERE id_cita = ?",
            [$fecha, $hora, $id_cita]
        );

        return response()->json(['ok' => true]);
    }

    /**
     * Devuelve el historial de pagos del cliente autenticado con el nombre
     * del servicio y el monto pagado. El monto se guarda en el momento del
     * pago y no cambia aunque el precio del catálogo (raza_servicio) cambie
     * después. Ordenado de más reciente a más antiguo.
     */
    public function pagos(Request $request)
    {
        $id    = $this->idClienteAutenticado($request);
        $pagos = DB::select("
            SELECT p.fecha_pago, p.metodo_pago, p.estado_pago, p.monto, s.nombre_servicio
            FROM pago p
            JOIN cita c     ON p.id_cita      = c.id_cita
            JOIN servicio s ON c.id_servicio  = s.id_servicio
            WHERE c.id_cliente = ?
            ORDER BY p.fecha_pago DESC
        ", [$id]);

        return response()->json(['ok' => true, 'pagos' => $pagos]);
    }
}

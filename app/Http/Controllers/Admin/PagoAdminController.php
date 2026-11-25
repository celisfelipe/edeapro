<?php

/**
 * PagoAdminController
 * ===================
 * Gestiona la página de pagos del administrador (pagos.js):
 *   - Caja: lo cobrado por método de pago (efectivo, transferencia,
 *     tarjeta) y el total, de un día o de un mes completo.
 *   - Por cobrar: las citas que ya llegaron y no se han pagado,
 *     agrupadas por cliente y día, con raza, mascota, adicionales
 *     y precio sugerido de cada cosa.
 *   - Historial: todos los pagos registrados.
 *   - Registrar: cobra de una vez todas las citas de un cliente con
 *     los montos que confirma el administrador (puede ajustarlos).
 * Al pagar, cada cita pasa a 'Completada'.
 *
 * No se cambia la estructura de la base de datos: se guarda un pago
 * por cada cita, igual que antes.
 *
 * Rutas: GET  /api/admin/pagos?periodo=dia|mes&fecha=AAAA-MM-DD
 *        POST /api/admin/pagos/registrar
 */

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Disponibilidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PagoAdminController extends Controller
{
    /** Métodos de pago que acepta el sistema */
    private const METODOS = ['Efectivo', 'Transferencia', 'Tarjeta de crédito'];

    /** Monto máximo de una cita (evita errores de digitación, ej. un cero de más) */
    private const MONTO_MAXIMO = 5000000;

    /**
     * Devuelve todo lo que muestra la página de pagos:
     * caja, por_cobrar, pagos (historial) y total_recaudado.
     *
     * Parámetros opcionales para la caja:
     *   - periodo: 'dia' (por defecto) o 'mes'
     *   - fecha:   AAAA-MM-DD (por defecto hoy). Con 'mes' se toma el mes de esa fecha.
     *
     * La fecha de hoy se toma de PHP (hora de Colombia) y no de CURDATE(),
     * porque MySQL en Railway trabaja en hora UTC y podría ir un día adelante.
     */
    public function index(Request $request)
    {
        $hoy     = date('Y-m-d');
        $periodo = $request->input('periodo') === 'mes' ? 'mes' : 'dia';
        $fecha   = (string) $request->input('fecha', $hoy);

        // Si la fecha no tiene el formato correcto, se usa hoy
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha) || !strtotime($fecha)) {
            $fecha = $hoy;
        }

        // Rango de la caja: un solo día, o del primer al último día del mes
        $desde = $periodo === 'mes' ? date('Y-m-01', strtotime($fecha)) : $fecha;
        $hasta = $periodo === 'mes' ? date('Y-m-t', strtotime($fecha))  : $fecha;

        return response()->json([
            'ok'              => true,
            'hoy'             => $hoy,
            'caja'            => $this->caja($desde, $hasta),
            'caja_periodo'    => $periodo,
            'caja_desde'      => $desde,   // la página arma el título con lo que realmente se consultó
            'caja_hasta'      => $hasta,
            'por_cobrar'      => $this->porCobrar($hoy),
            'pagos'           => $this->historial(),
            'total_recaudado' => DB::selectOne("SELECT IFNULL(SUM(monto), 0) AS total FROM pago")->total,
        ]);
    }

    /**
     * Lo cobrado entre dos fechas (incluidas) por cada método de pago:
     * cuántos servicios y cuánto dinero. Siempre devuelve los tres métodos
     * (en 0 si no hubo pagos con ese método) para que la página muestre
     * las tres casillas.
     *
     * @return array<int, array{metodo: string, cantidad: int, total: float}>
     */
    private function caja(string $desde, string $hasta): array
    {
        $filas = DB::select("
            SELECT metodo_pago, COUNT(*) AS cantidad, IFNULL(SUM(monto), 0) AS total
            FROM pago
            WHERE fecha_pago BETWEEN ? AND ?
            GROUP BY metodo_pago
        ", [$desde, $hasta]);

        $caja = [];
        foreach (self::METODOS as $metodo) {
            $fila = collect($filas)->firstWhere('metodo_pago', $metodo);
            $caja[] = [
                'metodo'   => $metodo,
                'cantidad' => $fila ? (int) $fila->cantidad : 0,
                'total'    => $fila ? (float) $fila->total : 0,
            ];
        }
        return $caja;
    }

    /**
     * Citas Pendientes o Reagendadas cuya fecha ya llegó (hoy o atrasadas),
     * agrupadas en un "cobro" por cliente y día. Cada cita trae su raza,
     * mascota, servicio (la clasificación, ej. "Pelo corto"), precio de
     * catálogo y sus adicionales. Si una cita antigua no tiene precio de
     * catálogo, su precio llega en NULL y el administrador lo escribe a mano.
     * Las citas de "Servicio individual" (solo adicionales) llegan con
     * solo_adicionales = true y precio 0: se cobran solo sus adicionales.
     *
     * @return array<int, array> lista de cobros, del día más reciente al más antiguo
     */
    private function porCobrar(string $hoy): array
    {
        $citas = DB::select("
            SELECT ci.id_cita, ci.id_cliente, ci.fecha, ci.hora,
                   c.nombre AS nombre_cliente, c.apellido AS apellido_cliente,
                   s.nombre_servicio, r.nombre_raza, m.nombre AS nombre_mascota,
                   rs.precio
            FROM cita ci
            JOIN cliente c  ON ci.id_cliente  = c.id_cliente
            JOIN servicio s ON ci.id_servicio = s.id_servicio
            JOIN mascota m  ON ci.id_mascota  = m.id_mascota
            LEFT JOIN raza r ON ci.id_raza = r.id_raza
            LEFT JOIN raza_servicio rs ON rs.id_raza = ci.id_raza AND rs.id_servicio = ci.id_servicio
            WHERE ci.estado IN ('Pendiente', 'Reagendada') AND ci.fecha <= ?
            ORDER BY ci.fecha DESC, c.nombre, ci.hora
        ", [$hoy]);

        if (empty($citas)) {
            return [];
        }

        // Adicionales de esas citas, en una sola consulta
        $ids = array_map(fn($c) => $c->id_cita, $citas);
        $marcas = implode(',', array_fill(0, count($ids), '?'));
        $adicionales = DB::select("
            SELECT ac.id_cita, a.nombre_adicional, a.precio_adicional
            FROM adicional_cita ac
            JOIN adicional a ON a.id_adicional = ac.id_adicional
            WHERE ac.id_cita IN ($marcas)
        ", $ids);

        // Agrupar: un cobro por cliente y día
        $cobros = [];
        foreach ($citas as $c) {
            $clave = $c->id_cliente . '|' . $c->fecha;
            if (!isset($cobros[$clave])) {
                $cobros[$clave] = [
                    'id_cliente' => $c->id_cliente,
                    'cliente'    => trim($c->nombre_cliente . ' ' . $c->apellido_cliente),
                    'fecha'      => $c->fecha,
                    'atrasado'   => $c->fecha < $hoy,
                    'citas'      => [],
                ];
            }

            $soloAdicionales = $c->nombre_servicio === Disponibilidad::SERVICIO_INDIVIDUAL;

            $cobros[$clave]['citas'][] = [
                'id_cita'     => $c->id_cita,
                'solo_adicionales' => $soloAdicionales,
                'hora'        => $c->hora,
                'raza'        => $c->nombre_raza ?? $c->nombre_servicio,
                'mascota'     => $c->nombre_mascota,
                'servicio'    => $c->nombre_servicio,
                'precio'      => $soloAdicionales ? 0 : ($c->precio !== null ? (float) $c->precio : null),
                'adicionales' => array_values(array_map(
                    fn($a) => ['nombre' => $a->nombre_adicional, 'precio' => (float) $a->precio_adicional],
                    array_filter($adicionales, fn($a) => $a->id_cita == $c->id_cita)
                )),
            ];
        }

        return array_values($cobros);
    }

    /**
     * Historial completo de pagos registrados, del más reciente al más antiguo.
     * Incluye raza y mascota para saber qué se cobró (en las citas de solo
     * adicionales no hay raza, y nombre_servicio trae los adicionales).
     */
    private function historial(): array
    {
        return DB::select("
            SELECT p.id_pago, p.fecha_pago, p.metodo_pago, p.estado_pago, p.monto,
                   c.nombre AS nombre_cliente, c.apellido AS apellido_cliente,
                   " . Disponibilidad::sqlNombreServicio('ci', 's') . " AS nombre_servicio,
                   r.nombre_raza, m.nombre AS nombre_mascota, ci.id_cita
            FROM pago p
            JOIN cita ci    ON p.id_cita = ci.id_cita
            JOIN cliente c  ON ci.id_cliente = c.id_cliente
            JOIN servicio s ON ci.id_servicio = s.id_servicio
            JOIN mascota m  ON ci.id_mascota = m.id_mascota
            LEFT JOIN raza r ON ci.id_raza = r.id_raza
            ORDER BY p.id_pago DESC
        ");
    }

    /**
     * Cobra de una vez varias citas de un mismo cliente.
     *
     * Recibe:
     *   - metodo: 'Efectivo' | 'Transferencia' | 'Tarjeta de crédito'
     *   - cobros: JSON [{ "id_cita": 12, "monto": 80000 }, ...]
     *             donde monto = servicio + adicionales de esa cita,
     *             con los valores que confirmó el administrador.
     *
     * Valida TODO antes de guardar (método, montos, que cada cita exista,
     * siga por atender, ya haya llegado su día y que todas sean del mismo
     * cliente). Luego guarda un pago por cita y las marca 'Completada'
     * dentro de una transacción: o se guarda todo, o no se guarda nada.
     */
    public function registrar(Request $request)
    {
        $metodo = $request->input('metodo');
        $cobros = json_decode((string) $request->input('cobros'), true);

        if (!in_array($metodo, self::METODOS, true)) {
            return response()->json(['ok' => false, 'error' => 'Método de pago no válido.']);
        }
        if (!is_array($cobros) || count($cobros) === 0) {
            return response()->json(['ok' => false, 'error' => 'No hay citas para cobrar.']);
        }

        $hoy = date('Y-m-d');
        $clientes = [];
        $pagos = [];

        foreach ($cobros as $item) {
            $id_cita = intval($item['id_cita'] ?? 0);
            $monto   = $item['monto'] ?? null;

            if (!is_numeric($monto) || $monto <= 0 || $monto > self::MONTO_MAXIMO) {
                return response()->json(['ok' => false, 'error' => 'Revisa los precios: todos deben ser mayores que 0.']);
            }

            // La misma cita no puede venir dos veces (se cobraría doble)
            if (in_array($id_cita, array_column($pagos, 'id_cita'), true)) {
                return response()->json(['ok' => false, 'error' => 'Una cita viene repetida.']);
            }

            $cita = DB::selectOne("SELECT id_cliente, estado, fecha FROM cita WHERE id_cita = ?", [$id_cita]);
            if (!$cita) {
                return response()->json(['ok' => false, 'error' => 'Una de las citas no existe.']);
            }
            // Al pagarla pasa a 'Completada', así que esto también impide cobrarla dos veces
            if (!in_array($cita->estado, ['Pendiente', 'Reagendada'], true)) {
                return response()->json(['ok' => false, 'error' => 'Una de las citas ya fue pagada o está cancelada.']);
            }
            // Pagar significa que el servicio ya se prestó
            if ($cita->fecha > $hoy) {
                return response()->json(['ok' => false, 'error' => 'Solo se puede cobrar el día de la cita o después.']);
            }

            $clientes[$cita->id_cliente] = true;
            $pagos[] = ['id_cita' => $id_cita, 'monto' => round((float) $monto, 2)];
        }

        if (count($clientes) > 1) {
            return response()->json(['ok' => false, 'error' => 'Solo se pueden cobrar juntas las citas de un mismo cliente.']);
        }

        // Todo o nada: si algo falla a mitad, no queda ningún pago a medias
        DB::transaction(function () use ($pagos, $metodo, $hoy) {
            foreach ($pagos as $p) {
                DB::table('pago')->insert([
                    'id_cita'     => $p['id_cita'],
                    'monto'       => $p['monto'],
                    'fecha_pago'  => $hoy,
                    'metodo_pago' => $metodo,
                    'estado_pago' => 'Completado',
                ]);
                DB::update("UPDATE cita SET estado = 'Completada' WHERE id_cita = ?", [$p['id_cita']]);
            }
        });

        return response()->json(['ok' => true, 'total' => array_sum(array_column($pagos, 'monto'))]);
    }
}
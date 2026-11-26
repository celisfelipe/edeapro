<?php

/**
 * ReporteController
 * =================
 * Genera los reportes del negocio en PDF y Excel.
 *
 * Todos los reportes llevan: datos del negocio, período, quién y cuándo
 * los generó, un resumen con los números clave y la tabla con su total.
 * Los PDF usan las vistas de resources/views/reportes/ (plantilla común);
 * los Excel usan App\Exports\ReporteExport.
 *
 * Período: parámetro ?mes=AAAA-MM (ej. 2026-11). Si no llega o es inválido,
 * se usa el mes actual. Aplica a citas y pagos; el de clientes es la lista
 * completa, con las citas que cada cliente tuvo en ese mes.
 *
 * Rutas (administrador):
 *   GET /api/reportes/citas/pdf      GET /api/reportes/citas/excel
 *   GET /api/reportes/pagos/pdf      GET /api/reportes/pagos/excel
 *   GET /api/reportes/clientes/pdf   GET /api/reportes/clientes/excel
 * Rutas (empleado, solo sus citas; el id sale del token, nunca del request):
 *   GET /api/empleado/reportes/citas/pdf
 *   GET /api/empleado/reportes/citas/excel
 */

namespace App\Http\Controllers;

use App\Exports\ReporteExport;
use App\Services\Disponibilidad;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class ReporteController extends Controller
{
    private const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
                           'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    // ══ CITAS ════════════════════════════════════════════════════

    /** PDF de todas las citas del mes */
    public function citasPdf(Request $request)
    {
        return $this->pdf('reportes.citas', $this->datosCitas($request), 'reporte-citas');
    }

    /** Excel de todas las citas del mes */
    public function citasExcel(Request $request)
    {
        return $this->excelCitas($this->datosCitas($request), 'reporte-citas');
    }

    /** PDF de las citas del mes del estilista autenticado (panel empleado) */
    public function misCitasPdf(Request $request)
    {
        $id = intval($request->attributes->get('auth_tokenable_id'));
        return $this->pdf('reportes.citas', $this->datosCitas($request, $id), 'mis-citas');
    }

    /** Excel de las citas del mes del estilista autenticado (panel empleado) */
    public function misCitasExcel(Request $request)
    {
        $id = intval($request->attributes->get('auth_tokenable_id'));
        return $this->excelCitas($this->datosCitas($request, $id), 'mis-citas');
    }

    /**
     * Citas del mes (opcionalmente de un solo estilista) y su resumen por estado.
     * El servicio de las citas de solo adicionales muestra sus adicionales.
     */
    private function datosCitas(Request $request, ?int $id_estilista = null): array
    {
        $periodo = $this->periodo($request);

        $sql = "
            SELECT c.id_cita, c.fecha, c.hora, c.estado,
                   cl.nombre AS nombre_cliente, cl.apellido AS apellido_cliente,
                   m.nombre AS mascota, r.nombre_raza,
                   " . Disponibilidad::sqlNombreServicio('c', 's') . " AS nombre_servicio,
                   e.nombre_estilista, e.apellido_estilista
            FROM cita c
            JOIN cliente cl  ON c.id_cliente   = cl.id_cliente
            JOIN mascota m   ON c.id_mascota   = m.id_mascota
            JOIN servicio s  ON c.id_servicio  = s.id_servicio
            JOIN estilista e ON c.id_estilista = e.id_estilista
            LEFT JOIN raza r ON c.id_raza      = r.id_raza
            WHERE c.fecha BETWEEN ? AND ?";
        $params = [$periodo['desde'], $periodo['hasta']];

        if ($id_estilista !== null) {
            $sql     .= " AND c.id_estilista = ?";
            $params[] = $id_estilista;
        }
        $citas = DB::select($sql . " ORDER BY c.fecha, c.hora", $params);

        // Resumen: cuántas citas hay en cada estado
        $resumen = ['Total' => count($citas), 'Pendiente' => 0, 'Reagendada' => 0, 'Completada' => 0, 'Cancelada' => 0];
        foreach ($citas as $c) {
            if (isset($resumen[$c->estado])) $resumen[$c->estado]++;
        }

        $titulo = $id_estilista === null ? 'Reporte de citas' : 'Reporte de mis citas';
        if ($id_estilista !== null) {
            $e = DB::selectOne("SELECT nombre_estilista, apellido_estilista FROM estilista WHERE id_estilista = ?", [$id_estilista]);
            if ($e) $titulo .= " — {$e->nombre_estilista} {$e->apellido_estilista}";
        }

        return $this->comunes($request, $titulo, $periodo) + ['citas' => $citas, 'resumen' => $resumen];
    }

    /** Excel de citas (mismas columnas para admin y empleado) */
    private function excelCitas(array $d, string $archivo)
    {
        $filas = array_map(fn($c) => [
            $this->fecha($c->fecha),
            date('g:i A', strtotime($c->hora)),
            "{$c->nombre_cliente} {$c->apellido_cliente}",
            $c->mascota . ($c->nombre_raza ? " · {$c->nombre_raza}" : ''),
            $c->nombre_servicio,
            "{$c->nombre_estilista} {$c->apellido_estilista}",
            $c->estado,
        ], $d['citas']);

        $r = $d['resumen'];
        $total = ["Total: {$r['Total']} citas", '', '', '',
                  "Completadas: {$r['Completada']} · Pendientes: " . ($r['Pendiente'] + $r['Reagendada']),
                  '', "Canceladas: {$r['Cancelada']}"];

        return $this->excel($d, ['Fecha', 'Hora', 'Cliente', 'Mascota', 'Servicio', 'Estilista', 'Estado'],
                            $filas, [], $total, $archivo);
    }

    // ══ PAGOS ════════════════════════════════════════════════════

    /** PDF de los pagos del mes */
    public function pagosPdf(Request $request)
    {
        return $this->pdf('reportes.pagos', $this->datosPagos($request), 'reporte-pagos');
    }

    /** Excel de los pagos del mes */
    public function pagosExcel(Request $request)
    {
        $d = $this->datosPagos($request);

        $filas = array_map(fn($p) => [
            str_pad($p->id_pago, 4, '0', STR_PAD_LEFT),
            $this->fecha($p->fecha_pago),
            "{$p->nombre_cliente} {$p->apellido_cliente}",
            $p->mascota . ($p->nombre_raza ? " · {$p->nombre_raza}" : ''),
            $p->detalle,
            $p->metodo_pago,
            $p->monto !== null ? (float) $p->monto : null,   // número real, para poder sumar en Excel
        ], $d['pagos']);

        $total = ['TOTAL (' . count($d['pagos']) . ' pagos)', '', '', '', '', '', (float) $d['total']];

        return $this->excel($d, ['N.º', 'Fecha', 'Cliente', 'Mascota', 'Servicio', 'Método', 'Monto'],
                            $filas, [6], $total, 'reporte-pagos');
    }

    /**
     * Pagos del mes con el detalle de lo cobrado (servicio + adicionales),
     * el total y lo recaudado por cada método de pago.
     */
    private function datosPagos(Request $request): array
    {
        $periodo = $this->periodo($request);

        $pagos = DB::select("
            SELECT p.id_pago, p.fecha_pago, p.metodo_pago, p.monto,
                   cl.nombre AS nombre_cliente, cl.apellido AS apellido_cliente,
                   m.nombre AS mascota, r.nombre_raza,
                   s.nombre_servicio,
                   (SELECT GROUP_CONCAT(a.nombre_adicional ORDER BY a.nombre_adicional SEPARATOR ', ')
                    FROM adicional_cita ac JOIN adicional a ON a.id_adicional = ac.id_adicional
                    WHERE ac.id_cita = ci.id_cita) AS adicionales
            FROM pago p
            JOIN cita ci    ON p.id_cita       = ci.id_cita
            JOIN cliente cl ON ci.id_cliente   = cl.id_cliente
            JOIN mascota m  ON ci.id_mascota   = m.id_mascota
            JOIN servicio s ON ci.id_servicio  = s.id_servicio
            LEFT JOIN raza r ON ci.id_raza     = r.id_raza
            WHERE p.fecha_pago BETWEEN ? AND ?
            ORDER BY p.fecha_pago, p.id_pago
        ", [$periodo['desde'], $periodo['hasta']]);

        // Qué se cobró: "Pelo corto + Desenredado", o solo los adicionales
        // si es una cita de solo adicionales ("Corte de uñas")
        $total = 0;
        $porMetodo = [];
        foreach ($pagos as $p) {
            $p->detalle = $p->nombre_servicio === Disponibilidad::SERVICIO_INDIVIDUAL
                ? ($p->adicionales ?: $p->nombre_servicio)
                : $p->nombre_servicio . ($p->adicionales ? " + {$p->adicionales}" : '');

            $total += (float) $p->monto;
            $porMetodo[$p->metodo_pago]['cantidad'] = ($porMetodo[$p->metodo_pago]['cantidad'] ?? 0) + 1;
            $porMetodo[$p->metodo_pago]['total']    = ($porMetodo[$p->metodo_pago]['total'] ?? 0) + (float) $p->monto;
        }

        return $this->comunes($request, 'Reporte de pagos', $periodo)
             + ['pagos' => $pagos, 'total' => $total, 'porMetodo' => $porMetodo];
    }

    // ══ CLIENTES ═════════════════════════════════════════════════

    /** PDF de clientes */
    public function clientesPdf(Request $request)
    {
        return $this->pdf('reportes.clientes', $this->datosClientes($request), 'reporte-clientes');
    }

    /** Excel de clientes */
    public function clientesExcel(Request $request)
    {
        $d = $this->datosClientes($request);

        $filas = array_map(fn($c) => [
            "{$c->nombre} {$c->apellido}",
            $c->telefono,
            $c->correo,
            (int) $c->mascotas,
            (int) $c->citas_mes,
            (int) $c->total_citas,
            $c->ultima_cita ? $this->fecha($c->ultima_cita) : '—',
        ], $d['clientes']);

        $r = $d['resumen'];
        $total = ["Total: {$r['total']} clientes", '', '', '', $r['activos_mes'] . ' con citas en el mes', '', ''];

        return $this->excel($d, ['Cliente', 'Teléfono', 'Correo', 'Mascotas', 'Citas del mes', 'Citas en total', 'Última cita'],
                            $filas, [], $total, 'reporte-clientes');
    }

    /**
     * Todos los clientes con sus mascotas activas, las citas que tuvieron en
     * el mes elegido, el total histórico y la fecha de su última cita.
     */
    private function datosClientes(Request $request): array
    {
        $periodo = $this->periodo($request);

        $clientes = DB::select("
            SELECT c.id_cliente, c.nombre, c.apellido, c.telefono, c.correo,
                   (SELECT COUNT(*) FROM mascota m WHERE m.id_cliente = c.id_cliente AND m.activa = 1) AS mascotas,
                   COUNT(ci.id_cita) AS total_citas,
                   SUM(ci.fecha BETWEEN ? AND ?) AS citas_mes,
                   MAX(ci.fecha) AS ultima_cita
            FROM cliente c
            LEFT JOIN cita ci ON ci.id_cliente = c.id_cliente AND ci.estado != 'Cancelada'
            GROUP BY c.id_cliente, c.nombre, c.apellido, c.telefono, c.correo
            ORDER BY c.nombre, c.apellido
        ", [$periodo['desde'], $periodo['hasta']]);

        $resumen = [
            'total'       => count($clientes),
            'activos_mes' => count(array_filter($clientes, fn($c) => (int) $c->citas_mes > 0)),
            'sin_citas'   => count(array_filter($clientes, fn($c) => (int) $c->total_citas === 0)),
        ];

        return $this->comunes($request, 'Reporte de clientes', $periodo)
             + ['clientes' => $clientes, 'resumen' => $resumen];
    }

    // ══ AYUDANTES COMUNES ═══════════════════════════════════════

    /**
     * Mes del reporte a partir de ?mes=AAAA-MM. Si falta o es inválido, el mes actual.
     * @return array{desde: string, hasta: string, etiqueta: string, archivo: string}
     */
    private function periodo(Request $request): array
    {
        $mes = (string) $request->input('mes', '');
        if (!preg_match('/^(\d{4})-(0[1-9]|1[0-2])$/', $mes)) {
            $mes = date('Y-m');
        }
        [$anio, $num] = array_map('intval', explode('-', $mes));

        return [
            'desde'    => "{$mes}-01",
            'hasta'    => date('Y-m-t', strtotime("{$mes}-01")),
            'etiqueta' => self::MESES[$num - 1] . " {$anio}",   // "noviembre 2026"
            'archivo'  => $mes,                                  // para el nombre del archivo
        ];
    }

    /**
     * Datos que llevan todos los reportes: título, período, quién y cuándo
     * lo generó, datos del negocio y el logo (incrustado para que dompdf
     * no tenga que buscarlo por internet).
     */
    private function comunes(Request $request, string $titulo, array $periodo): array
    {
        $tipo = $request->attributes->get('auth_tokenable_type');
        $id   = intval($request->attributes->get('auth_tokenable_id'));
        $persona = $tipo === 'estilista'
            ? DB::selectOne("SELECT CONCAT(nombre_estilista, ' ', apellido_estilista) AS nombre, rol FROM estilista WHERE id_estilista = ?", [$id])
            : null;

        $logo = public_path('edeapro/imagenes/logo/logo.png');

        return [
            'titulo'      => $titulo,
            'periodo'     => $periodo,
            'generado'    => now()->format('d/m/Y') . ' a las ' . now()->format('g:i A'),
            'generadoPor' => $persona ? $persona->nombre . ' (' . mb_strtolower($persona->rol) . ')' : 'Sistema',
            'negocio'     => 'Edea Grooming · Mall Terracina Plaza · Carrera 27 #35 sur 16',
            'logo'        => is_file($logo) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logo)) : null,
        ];
    }

    /** "2026-11-24" → "24/11/2026" */
    private function fecha(string $fecha): string
    {
        return date('d/m/Y', strtotime($fecha));
    }

    /**
     * Genera y descarga un PDF con una vista de reportes.
     * El "Página X de Y" se estampa después de armar el PDF, porque solo
     * en ese momento dompdf sabe cuántas páginas quedaron.
     */
    private function pdf(string $vista, array $datos, string $nombre)
    {
        $datos['fecha'] = fn(string $f) => $this->fecha($f);   // para usar $fecha(...) en la vista

        $pdf = Pdf::loadView($vista, $datos)->setPaper('letter', 'portrait');
        $pdf->render();

        $dompdf = $pdf->getDomPDF();
        $fuente = $dompdf->getFontMetrics()->getFont('Helvetica');
        // Carta = 612 x 792 puntos: abajo a la derecha, a la altura del pie
        $dompdf->getCanvas()->page_text(520, 772, 'Página {PAGE_NUM} de {PAGE_COUNT}', $fuente, 7, [0.6, 0.58, 0.55]);

        return $pdf->download("{$nombre}-{$datos['periodo']['archivo']}.pdf");
    }

    /** Genera y descarga un Excel con el formato común (ReporteExport) */
    private function excel(array $d, array $encabezados, array $filas, array $colsMoneda, ?array $total, string $nombre)
    {
        $subtitulos = [
            "Período: {$d['periodo']['etiqueta']}",
            "Generado el {$d['generado']} por {$d['generadoPor']}",
            $d['negocio'],
        ];

        return Excel::download(
            new ReporteExport($d['titulo'], $subtitulos, $encabezados, $filas, $colsMoneda, $total),
            "{$nombre}-{$d['periodo']['archivo']}.xlsx"
        );
    }
}
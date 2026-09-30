<?php

/**
 * ReporteController
 * =================
 * Genera reportes en PDF y Excel para el panel administrador.
 *
 * Rutas:
 *   GET /api/reportes/citas/pdf      → PDF de citas
 *   GET /api/reportes/pagos/pdf      → PDF de pagos
 *   GET /api/reportes/clientes/pdf   → PDF de clientes
 *   GET /api/reportes/citas/excel    → Excel de citas
 *   GET /api/reportes/pagos/excel    → Excel de pagos
 *   GET /api/reportes/clientes/excel → Excel de clientes
 */

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class ReporteController extends Controller
{
    /**
     * Reporte PDF de citas
     * Muestra todas las citas con cliente, mascota, servicio, estilista y estado
     */
    public function citasPdf()
    {
        $citas = DB::select("SELECT * FROM citas_completas ORDER BY fecha DESC, hora ASC");

        $pdf = Pdf::loadView('reportes.citas', [
            'citas' => $citas,
            'fecha' => now()->format('d/m/Y H:i')
        ]);

        return $pdf->download('reporte-citas.pdf');
    }

    /**
     * Reporte PDF de pagos
     * Muestra historial de pagos con cliente, servicio y método de pago
     */
    public function pagosPdf()
    {
        $pagos = DB::select("
            SELECT p.id_pago, p.fecha_pago, p.metodo_pago, p.estado_pago,
                   c.nombre AS nombre_cliente, c.apellido AS apellido_cliente,
                   s.nombre_servicio
            FROM pago p
            JOIN cita ci ON p.id_cita = ci.id_cita
            JOIN cliente c ON ci.id_cliente = c.id_cliente
            JOIN servicio s ON ci.id_servicio = s.id_servicio
            ORDER BY p.fecha_pago DESC
        ");

        $pdf = Pdf::loadView('reportes.pagos', [
            'pagos' => $pagos,
            'fecha' => now()->format('d/m/Y H:i')
        ]);

        return $pdf->download('reporte-pagos.pdf');
    }

    /**
     * Reporte PDF de clientes
     * Muestra lista de clientes registrados
     */
    public function clientesPdf()
    {
        $clientes = DB::select("
        SELECT c.id_cliente, c.nombre, c.apellido, c.telefono, c.correo,
            COUNT(ci.id_cita) AS total_citas
        FROM cliente c
        LEFT JOIN cita ci ON c.id_cliente = ci.id_cliente
        GROUP BY c.id_cliente, c.nombre, c.apellido, c.telefono, c.correo
        ORDER BY c.apellido ASC
");

        $pdf = Pdf::loadView('reportes.clientes', [
            'clientes' => $clientes,
            'fecha'    => now()->format('d/m/Y H:i')
        ]);

        return $pdf->download('reporte-clientes.pdf');
    }

    /**
 * Reporte Excel de citas
 */
public function citasExcel()
{
    $citas = DB::select("SELECT * FROM citas_completas ORDER BY fecha DESC, hora ASC");

    return Excel::download(new class($citas) implements \Maatwebsite\Excel\Concerns\FromArray,
        \Maatwebsite\Excel\Concerns\WithHeadings,
        \Maatwebsite\Excel\Concerns\WithStyles {

        private $citas;

        public function __construct($citas) {
            $this->citas = $citas;
        }

        public function headings(): array {
            return ['Fecha', 'Hora', 'Cliente', 'Mascota', 'Servicio', 'Estilista', 'Estado'];
        }

        public function array(): array {
            return array_map(fn($c) => [
                $c->fecha,
                date('g:i A', strtotime($c->hora)), // 12h, ej. 2:30 PM
                $c->nombre_cliente . ' ' . $c->apellido_cliente,
                $c->mascota,
                $c->nombre_servicio,
                $c->nombre_estilista,
                $c->estado
            ], $this->citas);
        }

        public function styles(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet) {
            return [
                1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                      'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'AF9D81']]]
            ];
        }
    }, 'reporte-citas.xlsx');
}

/**
 * Reporte Excel de pagos
 */
public function pagosExcel()
{
    $pagos = DB::select("
        SELECT p.fecha_pago, p.metodo_pago, p.estado_pago,
               c.nombre AS nombre_cliente, c.apellido AS apellido_cliente,
               s.nombre_servicio
        FROM pago p
        JOIN cita ci ON p.id_cita = ci.id_cita
        JOIN cliente c ON ci.id_cliente = c.id_cliente
        JOIN servicio s ON ci.id_servicio = s.id_servicio
        ORDER BY p.fecha_pago DESC
    ");

    return Excel::download(new class($pagos) implements \Maatwebsite\Excel\Concerns\FromArray,
        \Maatwebsite\Excel\Concerns\WithHeadings,
        \Maatwebsite\Excel\Concerns\WithStyles {

        private $pagos;

        public function __construct($pagos) {
            $this->pagos = $pagos;
        }

        public function headings(): array {
            return ['Fecha', 'Cliente', 'Servicio', 'Método de Pago', 'Estado'];
        }

        public function array(): array {
            return array_map(fn($p) => [
                $p->fecha_pago,
                $p->nombre_cliente . ' ' . $p->apellido_cliente,
                $p->nombre_servicio,
                $p->metodo_pago,
                $p->estado_pago
            ], $this->pagos);
        }

        public function styles(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet) {
            return [
                1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                      'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'AF9D81']]]
            ];
        }
    }, 'reporte-pagos.xlsx');
}

/**
 * Reporte Excel de clientes
 */
public function clientesExcel()
{
    $clientes = DB::select("
        SELECT c.nombre, c.apellido, c.telefono, c.correo,
               COUNT(ci.id_cita) AS total_citas
        FROM cliente c
        LEFT JOIN cita ci ON c.id_cliente = ci.id_cliente
        GROUP BY c.id_cliente, c.nombre, c.apellido, c.telefono, c.correo
        ORDER BY c.apellido ASC
    ");

    return Excel::download(new class($clientes) implements \Maatwebsite\Excel\Concerns\FromArray,
        \Maatwebsite\Excel\Concerns\WithHeadings,
        \Maatwebsite\Excel\Concerns\WithStyles {

        private $clientes;

        public function __construct($clientes) {
            $this->clientes = $clientes;
        }

        public function headings(): array {
            return ['Nombre', 'Apellido', 'Teléfono', 'Correo', 'Total Citas'];
        }

        public function array(): array {
            return array_map(fn($c) => [
                $c->nombre,
                $c->apellido,
                $c->telefono,
                $c->correo,
                $c->total_citas
            ], $this->clientes);
        }

        public function styles(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet) {
            return [
                1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                      'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'AF9D81']]]
            ];
        }
    }, 'reporte-clientes.xlsx');
}
}

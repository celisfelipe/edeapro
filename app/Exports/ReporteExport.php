<?php

/**
 * ReporteExport
 * =============
 * Arma los reportes en Excel (citas, pagos y clientes) con el mismo formato:
 *
 *   Fila 1   EDEA PRO — Reporte de …          (título)
 *   Fila 2   Período: noviembre 2026           (subtítulos: período, quién lo generó…)
 *   …
 *   (fila vacía)
 *   Encabezados de la tabla (fondo oscuro, quedan fijos al bajar)
 *   Filas de datos
 *   Fila de total (opcional)
 *
 * Los montos se guardan como NÚMEROS (no texto) con formato de pesos, para
 * que en Excel se puedan sumar o filtrar. Lo usa ReporteController.
 */

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;

class ReporteExport implements FromArray, ShouldAutoSize, WithEvents, WithTitle
{
    /**
     * @param string     $titulo       ej. "Reporte de pagos"
     * @param string[]   $subtitulos   líneas debajo del título (período, generado por…)
     * @param string[]   $encabezados  nombres de las columnas
     * @param array[]    $filas        una lista de valores por fila, en el orden de $encabezados
     * @param int[]      $colsMoneda   posiciones (desde 0) de las columnas con dinero
     * @param array|null $filaTotal    fila final de totales (mismo largo que $encabezados), o null
     */
    public function __construct(
        private string $titulo,
        private array $subtitulos,
        private array $encabezados,
        private array $filas,
        private array $colsMoneda = [],
        private ?array $filaTotal = null,
    ) {}

    /** Nombre de la hoja de Excel */
    public function title(): string
    {
        return mb_substr($this->titulo, 0, 31);   // Excel admite máximo 31 caracteres
    }

    /** Fila (desde 1) donde van los encabezados de la tabla */
    private function filaEncabezados(): int
    {
        return 1 + count($this->subtitulos) + 2;   // título + subtítulos + una fila vacía
    }

    /** Todas las filas de la hoja, en orden */
    public function array(): array
    {
        $hoja   = [['EDEA PRO — ' . $this->titulo]];
        foreach ($this->subtitulos as $linea) {
            $hoja[] = [$linea];
        }
        $hoja[] = [''];   // fila de separación (un arreglo vacío se saltaría)
        $hoja[] = $this->encabezados;
        foreach ($this->filas as $fila) {
            $hoja[] = $fila;
        }
        if ($this->filaTotal !== null) {
            $hoja[] = $this->filaTotal;
        }
        return $hoja;
    }

    /** Estilos: título grande, encabezados oscuros y fijos, montos en pesos, total en negrita */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $evento) {
                $hoja      = $evento->sheet->getDelegate();
                $ultimaCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($this->encabezados));
                $filaEnc   = $this->filaEncabezados();
                $primera   = $filaEnc + 1;
                $ultima    = $filaEnc + count($this->filas) + ($this->filaTotal !== null ? 1 : 0);

                // Título y subtítulos: se unen a lo ancho de la tabla para que
                // su texto largo no ensanche la columna A (el ajuste automático
                // de ancho no tiene en cuenta las celdas unidas)
                for ($f = 1; $f <= 1 + count($this->subtitulos); $f++) {
                    $hoja->mergeCells("A{$f}:{$ultimaCol}{$f}");
                }
                $hoja->getStyle('A1')->getFont()->setBold(true)->setSize(14);
                if ($this->subtitulos) {
                    $hoja->getStyle('A2:A' . (1 + count($this->subtitulos)))->getFont()->getColor()->setRGB('706B63');
                }

                // Encabezados: fondo gris oscuro, letra blanca, y fijos al bajar
                $rangoEnc = "A{$filaEnc}:{$ultimaCol}{$filaEnc}";
                $hoja->getStyle($rangoEnc)->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
                $hoja->getStyle($rangoEnc)->getFill()->setFillType('solid')->getStartColor()->setRGB('33312F');
                $hoja->freezePane('A' . $primera);

                // Columnas de dinero con formato de pesos ($ 55.000)
                foreach ($this->colsMoneda as $i) {
                    $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i + 1);
                    $hoja->getStyle("{$col}{$primera}:{$col}{$ultima}")
                         ->getNumberFormat()->setFormatCode('"$"#,##0');
                }

                // Fila de total en negrita con fondo dorado claro
                if ($this->filaTotal !== null) {
                    $rangoTotal = "A{$ultima}:{$ultimaCol}{$ultima}";
                    $hoja->getStyle($rangoTotal)->getFont()->setBold(true);
                    $hoja->getStyle($rangoTotal)->getFill()->setFillType('solid')->getStartColor()->setRGB('F5EFE3');
                }
            },
        ];
    }
}
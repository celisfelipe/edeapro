{{--
    plantilla.blade.php — Diseño común de los reportes PDF
    =======================================================
    Encabezado (logo, negocio, título, período), línea de "generado por",
    pie de página fijo (el "Página X de Y" lo estampa ReporteController::pdf()),
    y estilos de tablas y tarjetas.
    Cada reporte (citas, pagos, clientes) pone su contenido en @section('contenido').

    Datos que recibe de ReporteController::comunes():
      $titulo, $periodo['etiqueta'], $generado, $generadoPor, $negocio, $logo

    Nota: dompdf no entiende flexbox ni grid, por eso el acomodo se hace con tablas.
--}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $titulo }} — {{ $periodo['etiqueta'] }}</title>
    <style>
        @page { margin: 26px 32px 46px 32px; }
        body  { font-family: Helvetica, Arial, sans-serif; font-size: 10px; color: #33312F; }

        /* Encabezado */
        .encabezado      { width: 100%; border-bottom: 3px solid #AF9D81; padding-bottom: 8px; }
        .encabezado td   { vertical-align: middle; border: none; padding: 0; }
        .logo            { height: 34px; }
        .negocio         { font-size: 8.5px; color: #706B63; margin-top: 3px; }
        .titulo          { font-size: 15px; font-weight: bold; text-align: right; }
        .periodo         { font-size: 10px; color: #706B63; text-align: right; margin-top: 2px; }
        .generado        { font-size: 8.5px; color: #706B63; margin: 6px 0 12px; }

        /* Tarjetas de resumen (una tabla de una fila) */
        .resumen         { width: 100%; border-collapse: separate; border-spacing: 6px 0; margin: 0 -6px 14px; }
        .resumen td      { border: 1px solid #E7E3DA; border-radius: 5px; padding: 7px 9px; width: 25%; }
        .resumen .dest   { background: #F5EFE3; border-color: #AF9D81; }
        .resumen .lbl    { font-size: 7.5px; color: #706B63; letter-spacing: .5px; text-transform: uppercase; }
        .resumen .val    { font-size: 14px; font-weight: bold; margin-top: 2px; }
        .resumen .sub    { font-size: 7.5px; color: #706B63; }

        /* Tabla de datos */
        table.datos      { width: 100%; border-collapse: collapse; }
        .datos th        { background: #33312F; color: #FFFFFF; font-size: 8px; font-weight: bold; text-align: left;
                           padding: 6px 6px; text-transform: uppercase; letter-spacing: .4px; }
        .datos td        { padding: 5px 6px; border-bottom: 1px solid #E7E3DA; font-size: 9px; }
        .datos tr:nth-child(even) td { background: #FAF8F4; }
        .datos .num      { text-align: right; white-space: nowrap; }
        .datos .sub      { color: #706B63; font-size: 8px; }
        .datos tr.total td { border-top: 2px solid #33312F; border-bottom: none; font-weight: bold; background: #F5EFE3; }
        .vacio           { text-align: center; color: #706B63; padding: 18px; }

        /* Estados de cita */
        .estado              { font-weight: bold; }
        .estado-pendiente    { color: #B7791F; }
        .estado-reagendada   { color: #5B5690; }
        .estado-completada   { color: #2F7A4E; }
        .estado-cancelada    { color: #B91C1C; }

        /* Pie de página fijo en todas las hojas (el número de página se estampa aparte) */
        .pie             { position: fixed; bottom: -30px; left: 0; right: 0; border-top: 1px solid #E7E3DA;
                           padding-top: 5px; font-size: 7.5px; color: #9A958C; }
    </style>
</head>
<body>
    <div class="pie">
        EDEA PRO · Documento de uso interno, no es una factura
    </div>

    <table class="encabezado"><tr>
        <td>
            @if($logo)
                <img src="{{ $logo }}" class="logo" alt="Edea">
            @else
                <strong style="font-size:16px">EDEA PRO</strong>
            @endif
            <div class="negocio">{{ $negocio }}</div>
        </td>
        <td>
            <div class="titulo">{{ $titulo }}</div>
            <div class="periodo">Período: {{ $periodo['etiqueta'] }}</div>
        </td>
    </tr></table>

    <div class="generado">Generado el {{ $generado }} por {{ $generadoPor }}</div>

    @yield('contenido')
</body>
</html>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Pagos</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
        h1 { color: #af9d81; text-align: center; margin-bottom: 5px; }
        .fecha { text-align: center; color: #888; font-size: 11px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #af9d81; color: white; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 6px 8px; border-bottom: 1px solid #e0d5c5; font-size: 11px; }
        tr:nth-child(even) { background: #f9f7f4; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #aaa; }
    </style>
</head>
<body>
    <h1>🐾 EDEA PRO — Reporte de Pagos</h1>
    <div class="fecha">Generado el {{ $fecha }}</div>

    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Método</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            @foreach($pagos as $pago)
            <tr>
                <td>{{ $pago->fecha_pago }}</td>
                <td>{{ $pago->nombre_cliente }} {{ $pago->apellido_cliente }}</td>
                <td>{{ $pago->nombre_servicio }}</td>
                <td>{{ $pago->metodo_pago }}</td>
                <td>{{ $pago->estado_pago }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">EDEA PRO — Peluquería Canina y Felina</div>
</body>
</html>
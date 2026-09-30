<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Citas</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
        h1 { color: #af9d81; text-align: center; margin-bottom: 5px; }
        .fecha { text-align: center; color: #888; font-size: 11px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #af9d81; color: white; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 6px 8px; border-bottom: 1px solid #e0d5c5; font-size: 11px; }
        tr:nth-child(even) { background: #f9f7f4; }
        .estado-pendiente  { color: #e0943a; font-weight: bold; }
        .estado-completada { color: #2d6a4f; font-weight: bold; }
        .estado-cancelada  { color: #c0392b; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #aaa; }
    </style>
</head>
<body>
    <h1>🐾 EDEA PRO — Reporte de Citas</h1>
    <div class="fecha">Generado el {{ $fecha }}</div>

    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Mascota</th>
                <th>Servicio</th>
                <th>Estilista</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            @foreach($citas as $cita)
            <tr>
                <td>{{ $cita->fecha }}</td>
                <td>{{ date('g:i A', strtotime($cita->hora)) }}</td>
                <td>{{ $cita->nombre_cliente }} {{ $cita->apellido_cliente }}</td>
                <td>{{ $cita->mascota }}</td>
                <td>{{ $cita->nombre_servicio }}</td>
                <td>{{ $cita->nombre_estilista }}</td>
                <td class="estado-{{ strtolower($cita->estado) }}">{{ $cita->estado }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">EDEA PRO — Peluquería Canina y Felina</div>
</body>
</html>
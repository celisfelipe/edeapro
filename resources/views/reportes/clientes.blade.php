<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Clientes</title>
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
    <h1>🐾 EDEA PRO — Reporte de Clientes</h1>
    <div class="fecha">Generado el {{ $fecha }}</div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Total Citas</th>
            </tr>
        </thead>
        <tbody>
            @foreach($clientes as $i => $cliente)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $cliente->nombre }} {{ $cliente->apellido }}</td>
                <td>{{ $cliente->telefono }}</td>
                <td>{{ $cliente->correo }}</td>
                <td>{{ $cliente->total_citas }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">EDEA PRO — Peluquería Canina y Felina</div>
</body>
</html>
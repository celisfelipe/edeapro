{{--
    Reporte de clientes (PDF): la lista completa, con las citas de cada uno
    en el mes elegido. Datos de ReporteController::datosClientes():
      $clientes, $resumen (total, activos_mes, sin_citas)
    Usa el diseño común de plantilla.blade.php.
--}}
@extends('reportes.plantilla')

@section('contenido')
    <table class="resumen"><tr>
        <td class="dest">
            <div class="lbl">Clientes registrados</div>
            <div class="val">{{ $resumen['total'] }}</div>
        </td>
        <td>
            <div class="lbl">Con citas en el mes</div>
            <div class="val">{{ $resumen['activos_mes'] }}</div>
        </td>
        <td>
            <div class="lbl">Sin citas todavía</div>
            <div class="val">{{ $resumen['sin_citas'] }}</div>
        </td>
        <td>
            <div class="lbl">Mascotas activas</div>
            <div class="val">{{ array_sum(array_map(fn($c) => (int) $c->mascotas, $clientes)) }}</div>
        </td>
    </tr></table>

    <table class="datos">
        <thead>
            <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th class="num">Mascotas</th>
                <th class="num">Citas del mes</th>
                <th class="num">Citas en total</th>
                <th>Última cita</th>
            </tr>
        </thead>
        <tbody>
            @forelse($clientes as $i => $c)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $c->nombre }} {{ $c->apellido }}</td>
                    <td>{{ $c->telefono ?: '—' }}</td>
                    <td>{{ $c->correo }}</td>
                    <td class="num">{{ (int) $c->mascotas }}</td>
                    <td class="num">{{ (int) $c->citas_mes }}</td>
                    <td class="num">{{ (int) $c->total_citas }}</td>
                    <td>{{ $c->ultima_cita ? $fecha($c->ultima_cita) : '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="8" class="vacio">No hay clientes registrados.</td></tr>
            @endforelse
        </tbody>
    </table>
    <p style="margin-top:6px; font-size:8px; color:#706B63">Las citas canceladas no se cuentan.</p>
@endsection
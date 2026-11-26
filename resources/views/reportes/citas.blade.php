{{--
    Reporte de citas (PDF), del administrador o de un estilista.
    Datos de ReporteController::datosCitas(): $citas, $resumen (por estado)
    Usa el diseño común de plantilla.blade.php.
--}}
@extends('reportes.plantilla')

@section('contenido')
    <table class="resumen"><tr>
        <td class="dest">
            <div class="lbl">Total de citas</div>
            <div class="val">{{ $resumen['Total'] }}</div>
        </td>
        <td>
            <div class="lbl">Completadas</div>
            <div class="val estado-completada">{{ $resumen['Completada'] }}</div>
        </td>
        <td>
            <div class="lbl">Pendientes</div>
            <div class="val estado-pendiente">{{ $resumen['Pendiente'] + $resumen['Reagendada'] }}</div>
            <div class="sub">{{ $resumen['Reagendada'] }} reagendadas</div>
        </td>
        <td>
            <div class="lbl">Canceladas</div>
            <div class="val estado-cancelada">{{ $resumen['Cancelada'] }}</div>
        </td>
    </tr></table>

    <table class="datos">
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
            @forelse($citas as $c)
                <tr>
                    <td>{{ $fecha($c->fecha) }}</td>
                    <td>{{ date('g:i A', strtotime($c->hora)) }}</td>
                    <td>{{ $c->nombre_cliente }} {{ $c->apellido_cliente }}</td>
                    <td>{{ $c->mascota }}@if($c->nombre_raza)<br><span class="sub">{{ $c->nombre_raza }}</span>@endif</td>
                    <td>{{ $c->nombre_servicio }}</td>
                    <td>{{ $c->nombre_estilista }} {{ $c->apellido_estilista }}</td>
                    <td class="estado estado-{{ strtolower($c->estado) }}">{{ $c->estado }}</td>
                </tr>
            @empty
                <tr><td colspan="7" class="vacio">No hay citas en {{ $periodo['etiqueta'] }}.</td></tr>
            @endforelse
        </tbody>
    </table>
@endsection
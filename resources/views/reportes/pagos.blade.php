{{--
    Reporte de pagos (PDF). Datos de ReporteController::datosPagos():
      $pagos (con ->detalle = servicio + adicionales), $total, $porMetodo
    Usa el diseño común de plantilla.blade.php.
--}}
@extends('reportes.plantilla')

@section('contenido')
    @php
        $pesos  = fn($v) => '$' . number_format((float) $v, 0, ',', '.');
        $metodo = fn($m) => $porMetodo[$m] ?? ['cantidad' => 0, 'total' => 0];
    @endphp

    <table class="resumen"><tr>
        <td class="dest">
            <div class="lbl">Total recaudado</div>
            <div class="val">{{ $pesos($total) }}</div>
            <div class="sub">{{ count($pagos) }} pagos</div>
        </td>
        @foreach(['Efectivo', 'Transferencia', 'Tarjeta de crédito'] as $m)
            <td>
                <div class="lbl">{{ $m }}</div>
                <div class="val">{{ $pesos($metodo($m)['total']) }}</div>
                <div class="sub">{{ $metodo($m)['cantidad'] }} pagos</div>
            </td>
        @endforeach
    </tr></table>

    <table class="datos">
        <thead>
            <tr>
                <th>N.º</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Mascota</th>
                <th>Servicio</th>
                <th>Método</th>
                <th class="num">Monto</th>
            </tr>
        </thead>
        <tbody>
            @forelse($pagos as $p)
                <tr>
                    <td>{{ str_pad($p->id_pago, 4, '0', STR_PAD_LEFT) }}</td>
                    <td>{{ $fecha($p->fecha_pago) }}</td>
                    <td>{{ $p->nombre_cliente }} {{ $p->apellido_cliente }}</td>
                    <td>{{ $p->mascota }}@if($p->nombre_raza)<br><span class="sub">{{ $p->nombre_raza }}</span>@endif</td>
                    <td>{{ $p->detalle }}</td>
                    <td>{{ $p->metodo_pago }}</td>
                    <td class="num">{{ $p->monto !== null ? $pesos($p->monto) : '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="7" class="vacio">No hay pagos registrados en {{ $periodo['etiqueta'] }}.</td></tr>
            @endforelse

            @if(count($pagos))
                <tr class="total">
                    <td colspan="6" style="text-align:right">TOTAL ({{ count($pagos) }} pagos)</td>
                    <td class="num">{{ $pesos($total) }}</td>
                </tr>
            @endif
        </tbody>
    </table>
@endsection
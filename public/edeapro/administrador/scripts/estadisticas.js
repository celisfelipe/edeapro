/**
 * estadisticas.js — Panel Administrador / Estadísticas
 * ======================================================
 * Muestra tarjetas con totales y gráficos del sistema.
 * Usa la librería Chart.js para los gráficos de torta y barras.
 * Solo accesible con sesión de administrador (ver sesion.js).
 *
 * Conecta con la API de Laravel:
 *   GET /api/admin/estadisticas → totales, citas por estado, servicios populares
 *
 * Depende de: fetchToken.js (fetchAuth), sesion.js (verificarSesionAdmin, cerrarSesion),
 *             Chart.js (CDN).
 *
 * Todo se ejecuta al cargar la página: llena las tarjetas de resumen
 * (#total-clientes, #total-citas, #total-ingresos) y dibuja dos gráficos:
 *   #graficoCitas     → torta con la cantidad de citas por estado
 *   #graficoServicios → barras con los servicios más solicitados
 * "Ingresos" es el precio de catálogo de las citas completadas; lo realmente
 * cobrado está en la página de Pagos.
 */

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;

    fetchAuth('${API_BASE}/api/admin/estadisticas')
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;

        // Tarjetas de resumen
        document.getElementById('total-clientes').textContent = data.total_clientes;
        document.getElementById('total-citas').textContent    = data.total_citas;
        document.getElementById('total-ingresos').textContent = '$' + Number(data.total_ingresos).toLocaleString('es-CO');

        // Gráfico de torta: citas por estado (Pendiente / Completada / Cancelada)
        new Chart(document.getElementById('graficoCitas'), {
            type: 'pie',
            data: {
                labels: data.citas_estado.map(c => c.estado),
                datasets: [{
                    data: data.citas_estado.map(c => c.total),
                    backgroundColor: ['#ffc107', '#28a745', '#dc3545']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'right' } }
            }
        });

        // Gráfico de barras: servicios más solicitados
        new Chart(document.getElementById('graficoServicios'), {
            type: 'bar',
            data: {
                labels: data.servicios.map(s => s.nombre_servicio),
                datasets: [{
                    label: 'Citas',
                    data: data.servicios.map(s => s.total),
                    backgroundColor: '#ae9d81'
                }]
            }
        });
    });
});

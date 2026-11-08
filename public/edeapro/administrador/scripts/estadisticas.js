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

    fetchAuth(`${API_BASE}/api/admin/estadisticas`)
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;

        // Tarjetas de resumen
        document.getElementById('total-clientes').textContent = data.total_clientes;
        document.getElementById('total-citas').textContent    = data.total_citas;
        document.getElementById('total-ingresos').textContent = '$' + Number(data.total_ingresos).toLocaleString('es-CO');

                // Letra de la marca en todos los gráficos
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#706B63';

        // Color de cada estado según su NOMBRE (no según el orden en que
        // lleguen de la base de datos), con los mismos colores del panel
        const COLOR_ESTADO = {
            'Pendiente':  '#F2AE00',   // dorado
            'Reagendada': '#C98B00',   // dorado oscuro
            'Completada': '#4BAE6E',   // verde
            'Cancelada':  '#DC2626'    // rojo
        };

        // Gráfico de dona: citas por estado
        new Chart(document.getElementById('graficoCitas'), {
            type: 'doughnut',
            data: {
                labels: data.citas_estado.map(c => c.estado),
                datasets: [{
                    data: data.citas_estado.map(c => c.total),
                    backgroundColor: data.citas_estado.map(c => COLOR_ESTADO[c.estado] || '#A8A49C'),
                    borderColor: '#FFFFFF',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,   // el alto lo pone .grafico-caja en el CSS
                cutout: '62%',                // tamaño del hueco del centro
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 18 } }
                }
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
                    backgroundColor: '#F2AE00',
                    hoverBackgroundColor: '#C98B00',
                    borderRadius: 8,          // esquinas redondeadas
                    maxBarThickness: 56       // que las barras no queden gigantes
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },   // una sola serie: no hace falta leyenda
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 },            // solo números enteros (no hay media cita)
                        grid: { color: 'rgba(51, 49, 47, 0.08)' }
                    }
                }
            }
        });
    });
});

/**
 * estadisticas.js — Panel Administrador / Estadísticas
 * ======================================================
 * Muestra tarjetas con totales y gráficos del sistema.
 * Usa la librería Chart.js para los gráficos de torta y barras.
 * Verifica que el usuario tenga rol "administrador" en localStorage.
 *
 * Conecta con la API de Laravel:
 *   GET /api/admin/estadisticas → totales, citas por estado, servicios populares
 */

document.addEventListener('DOMContentLoaded', function () {

    const user = JSON.parse(localStorage.getItem('user'));
    const rol  = localStorage.getItem('rol');

    if (!user || rol !== 'administrador') {
        window.location.href = '../../paginas/login.html';
        return;
    }

    document.getElementById('nombre-admin').textContent = user.nombre_estilista + ' ' + user.apellido_estilista;

    fetchAuth('http://127.0.0.1:8000/api/admin/estadisticas')
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
                    backgroundColor: '#2f3e4e'
                }]
            }
        });
    });
});

function cerrarSesion() {
    localStorage.removeItem('user');
    localStorage.removeItem('rol');
    window.location.href = '../../paginas/login.html';
}

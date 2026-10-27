/**
 * inicio.js — Panel Empleado / Servicios
 * =========================================
 * Muestra las citas asignadas al estilista que inició sesión.
 * Filtra por el id_estilista guardado en localStorage.
 * La sesión (rol "peluquero") la verifica sesion.js.
 *
 * Conecta con la API de Laravel:
 *   GET /api/empleado/citas?id_estilista=X → citas del estilista
 */

document.addEventListener('DOMContentLoaded', function () {

    if (!verificarSesionEmpleado()) return;

    cargarServicios();
});

/**
 * Trae las citas asignadas al estilista logueado.
 * Usa el id_estilista del localStorage para filtrar en el servidor.
 * Muestra el estado con colores: verde (completada), amarillo (pendiente), rojo (cancelada).
 */
function cargarServicios() {
    const user = JSON.parse(localStorage.getItem('user'));

    fetchAuth(`${API_BASE}/api/empleado/citas?id_estilista=${user.id_estilista}`)
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('tabla-servicios');
        if (!data.ok || data.citas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No hay citas asignadas</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        data.citas.forEach(c => {
            // Clase de color e ícono según el estado de la cita
            const estado = c.estado === 'Completada' ? 'status-green' :
                           c.estado === 'Pendiente'  ? 'status-yellow' : 'status-red';
            const iconoEstado = c.estado === 'Completada' ? 'fa-check' :
                           c.estado === 'Pendiente'  ? 'fa-clock' : 'fa-xmark';
            tbody.innerHTML += `
                <tr>
                    <td>${escaparHTML(c.nombre_cliente)} ${escaparHTML(c.apellido_cliente)}</td>
                    <td>${escaparHTML(c.nombre_servicio)}</td>
                    <td>${escaparHTML(c.fecha)}</td>
                    <td>${escaparHTML(formatoHora12(c.hora))}</td>
                    <td class="${estado}"><i class="fa-solid ${iconoEstado}"></i> ${escaparHTML(c.estado)}</td>
                </tr>`;
        });
    });
}

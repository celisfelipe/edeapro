/**
 * inicio.js — Panel Administrador / Citas
 * =========================================
 * Carga y muestra todas las citas del sistema en una tabla.
 * Permite cancelar citas mediante un modal de confirmación.
 * Verifica que el usuario tenga rol "administrador" en localStorage.
 *
 * Conecta con la API de Laravel:
 *   GET  /api/admin/citas          → cargar todas las citas
 *   POST /api/admin/citas/cancelar → cancelar una cita
 * Usa la vista citas_completas de la BD que ya tiene los JOINs hechos.
 */

document.addEventListener('DOMContentLoaded', function () {

    // Verificar que el usuario sea administrador
    const user = JSON.parse(localStorage.getItem('user'));
    const rol  = localStorage.getItem('rol');

    if (!user || rol !== 'administrador') {
        window.location.href = '../../paginas/login.html';
        return;
    }

    // Mostrar nombre del administrador en el header
    document.getElementById('nombre-admin').textContent = user.nombre_estilista + ' ' + user.apellido_estilista;

    // Traer todas las citas desde Laravel
    fetch('http://127.0.0.1:8000/api/admin/citas')
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('tabla-citas');
        if (!data.ok || data.citas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">No hay citas registradas</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        data.citas.forEach(cita => {
            // Asignar clase de color según el estado de la cita
            const estado = cita.estado === 'Completada' ? 'status-green' :
                           cita.estado === 'Pendiente'  ? 'status-yellow' : 'status-red';
            tbody.innerHTML += `
                <tr>
                    <td>${cita.fecha}</td>
                    <td>${cita.hora}</td>
                    <td>${cita.nombre_cliente} ${cita.apellido_cliente}</td>
                    <td>${cita.mascota}</td>
                    <td>${cita.nombre_servicio}</td>
                    <td>${cita.nombre_estilista}</td>
                    <td class="${estado}">${cita.estado}</td>
                    <td>
                        <button class="btn btn-red" onclick="cancelarCita(${cita.id_cita})">Cancelar</button>
                        <button class="btn btn-blue">Detalles</button>
                    </td>
                </tr>`;
        });
    })
    .catch(() => {
        document.getElementById('tabla-citas').innerHTML = '<tr><td colspan="8">Error cargando citas</td></tr>';
    });
});

/**
 * Muestra modal de confirmación antes de cancelar.
 * Si el usuario confirma, envía el id_cita a Laravel y recarga la tabla.
 */
function cancelarCita(id) {
    modalConfirmar('¿Seguro que deseas cancelar esta cita?', function () {
        fetch('http://127.0.0.1:8000/api/admin/citas/cancelar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ id_cita: id })
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                modalExito('Cita cancelada correctamente.');
                // Recargar la página después de 1.5s para reflejar el cambio
                setTimeout(() => location.reload(), 1500);
            } else {
                modalError('Error: ' + data.error);
            }
        });
    });
}

/** Elimina la sesión del localStorage y redirige al login */
function cerrarSesion() {
    localStorage.removeItem('user');
    localStorage.removeItem('rol');
    window.location.href = '../../paginas/login.html';
}

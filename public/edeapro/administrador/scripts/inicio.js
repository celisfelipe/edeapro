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
    fetchAuth('http://127.0.0.1:8000/api/admin/citas')
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('tabla-citas');
        if (!data.ok || data.citas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">No hay citas registradas</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        data.citas.forEach(cita => {
            // Asignar clase de color e ícono según el estado de la cita
            const estado = cita.estado === 'Completada' ? 'status-green' :
                           cita.estado === 'Pendiente'  ? 'status-yellow' : 'status-red';
            const iconoEstado = cita.estado === 'Completada' ? 'fa-check' :
                           cita.estado === 'Pendiente'  ? 'fa-clock' : 'fa-xmark';
            tbody.innerHTML += `
                <tr>
                    <td>${cita.fecha}</td>
                    <td>${cita.hora}</td>
                    <td>${cita.nombre_cliente} ${cita.apellido_cliente}</td>
                    <td>${cita.mascota}</td>
                    <td>${cita.nombre_servicio}</td>
                    <td>${cita.nombre_estilista}</td>
                    <td class="${estado}"><i class="fa-solid ${iconoEstado}"></i> ${cita.estado}</td>
                    <td>
                        <button class="btn btn-red" onclick="cancelarCita(${cita.id_cita})"><i class="fa-solid fa-xmark"></i> Cancelar</button>
                        <button class="btn btn-blue"><i class="fa-solid fa-eye"></i> Detalles</button>
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
        fetchAuth('http://127.0.0.1:8000/api/admin/citas/cancelar', {
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

/**
 * descargarReporte() — Descarga un reporte PDF desde Laravel
 * El token se envía en el header para autenticar la petición.
 * @param {string} tipo - 'citas', 'pagos' o 'clientes'
 */
function descargarReporte(tipo) {
    const token = localStorage.getItem('token');

    fetch(`http://127.0.0.1:8000/api/reportes/${tipo}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) {
            modalError('Error al generar el reporte');
            return;
        }
        return res.blob();
    })
    .then(blob => {
        if (!blob) return;
        // Crear link temporal para descargar el PDF
        const url  = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `reporte-${tipo}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
    })
    .catch(() => modalError('Error de conexión al generar el reporte'));
}

/**
 * descargarExcel() — Descarga un reporte Excel desde Laravel
 * @param {string} tipo - 'citas', 'pagos' o 'clientes'
 */
function descargarExcel(tipo) {
    const token = localStorage.getItem('token');

    fetch(`http://127.0.0.1:8000/api/reportes/${tipo}/excel`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) {
            modalError('Error al generar el reporte Excel');
            return;
        }
        return res.blob();
    })
    .then(blob => {
        if (!blob) return;
        const url  = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `reporte-${tipo}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
    })
    .catch(() => modalError('Error de conexión al generar el reporte Excel'));
}
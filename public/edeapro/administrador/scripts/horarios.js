/**
 * horarios.js — Panel Administrador / Horarios
 * =============================================
 * Muestra la agenda diaria de todos los estilistas con la grilla compartida
 * (scripts/agendaGrilla.js): columnas = estilistas, filas = horas.
 *
 * Permite ver y cambiar la disponibilidad de cada estilista.
 * Permite registrar y eliminar bloqueos temporales por fechas.
 *
 * Depende de: fetchToken.js (fetchAuth), formatoHora.js (formatoHora12),
 *             agendaGrilla.js (iniciarGrilla), sesion.js (verificarSesionAdmin, cerrarSesion).
 *
 * API Laravel:
 *   GET  /api/admin/horarios?fecha=YYYY-MM-DD        → citas y estilistas del día
 *   POST /api/admin/horarios/disponibilidad          → cambiar disponibilidad
 *   GET  /api/admin/disponibilidad-temporal          → listar bloqueos
 *   POST /api/admin/disponibilidad-temporal/agregar  → agregar bloqueo
 *   POST /api/admin/disponibilidad-temporal/eliminar → eliminar bloqueo
 */

/* ── Init ─────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;

    iniciarGrilla(fecha => `http://127.0.0.1:8000/api/admin/horarios?fecha=${fecha}`);
    cargarDisponibilidad();
    cargarBloqueos();
});

/* ══════════════════════════════════════════════════════════════════════════
   DISPONIBILIDAD DE ESTILISTAS
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Llena la tabla #tabla-disponibilidad con los estilistas activos y un botón
 * para alternar entre "Disponible" y "No Disponible".
 *
 * Usa el endpoint de horarios solo por la lista `estilistas` que devuelve
 * (la fecha da igual). Con esa misma lista llena el <select> del formulario
 * de bloqueos (#bloqueo-estilista).
 *
 * @returns {void}
 */
function cargarDisponibilidad() {
    fetchAuth('http://127.0.0.1:8000/api/admin/horarios?fecha=' + new Date().toISOString().split('T')[0])
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;
        const tbody = document.getElementById('tabla-disponibilidad');
        tbody.innerHTML = '';
        data.estilistas.forEach(e => {
            const disponible = e.disponibilidad === 'Disponible';
            tbody.innerHTML += `
                <tr>
                    <td>${e.nombre_estilista}</td>
                    <td class="${disponible ? 'status-green' : 'status-red'}">
                        <i class="fa-solid ${disponible ? 'fa-check' : 'fa-xmark'}"></i>
                        ${e.disponibilidad}
                    </td>
                    <td>
                        <button class="btn ${disponible ? 'btn-red' : 'btn-green'}"
                            onclick="cambiarDisponibilidad(${e.id_estilista}, '${disponible ? 'No Disponible' : 'Disponible'}')">
                            <i class="fa-solid ${disponible ? 'fa-ban' : 'fa-check'}"></i>
                            ${disponible ? 'Marcar No Disponible' : 'Marcar Disponible'}
                        </button>
                    </td>
                </tr>`;
        });

        const select = document.getElementById('bloqueo-estilista');
        select.innerHTML = data.estilistas.map(e =>
            `<option value="${e.id_estilista}">${e.nombre_estilista}</option>`
        ).join('');
    });
}

/* ══════════════════════════════════════════════════════════════════════════
   BLOQUEOS TEMPORALES
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Llena la tabla #tabla-bloqueos con los bloqueos temporales vigentes o
 * futuros (fecha_fin >= hoy). Los vencidos no llegan desde la API.
 *
 * @returns {void}
 */
function cargarBloqueos() {
    fetchAuth('http://127.0.0.1:8000/api/admin/disponibilidad-temporal')
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;
        const tbody = document.getElementById('tabla-bloqueos');
        if (data.bloqueos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No hay bloqueos temporales registrados</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        data.bloqueos.forEach(b => {
            tbody.innerHTML += `
                <tr>
                    <td>${b.nombre_estilista} ${b.apellido_estilista}</td>
                    <td>${b.fecha_inicio}</td>
                    <td>${b.fecha_fin}</td>
                    <td>${b.motivo || '—'}</td>
                    <td>
                        <button class="btn btn-red" onclick="eliminarBloqueo(${b.id_disponibilidad})">
                            <i class="fa-solid fa-trash"></i> Eliminar
                        </button>
                    </td>
                </tr>`;
        });
    });
}

/**
 * Registra un bloqueo temporal (ej. vacaciones) con los datos del formulario:
 * estilista, fecha de inicio, fecha de fin y motivo (opcional).
 * Mientras dure el bloqueo, el estilista no aparece con horarios libres en la
 * agenda del cliente. No cambia su disponibilidad general.
 * Si todo sale bien, limpia el formulario y recarga la tabla de bloqueos.
 *
 * @returns {void}
 */
function agregarBloqueo() {
    const id_estilista = document.getElementById('bloqueo-estilista').value;
    const fecha_inicio = document.getElementById('bloqueo-fecha-inicio').value;
    const fecha_fin    = document.getElementById('bloqueo-fecha-fin').value;
    const motivo       = document.getElementById('bloqueo-motivo').value.trim();

    if (!id_estilista || !fecha_inicio || !fecha_fin) {
        alert('Completa estilista, fecha de inicio y fecha de fin.');
        return;
    }

    fetchAuth('http://127.0.0.1:8000/api/admin/disponibilidad-temporal/agregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id_estilista, fecha_inicio, fecha_fin, motivo })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            document.getElementById('bloqueo-fecha-inicio').value = '';
            document.getElementById('bloqueo-fecha-fin').value    = '';
            document.getElementById('bloqueo-motivo').value       = '';
            cargarBloqueos();
        } else {
            alert('Error: ' + data.error);
        }
    });
}

/**
 * Elimina un bloqueo temporal (previa confirmación) y recarga la tabla.
 *
 * @param {number} id - id_disponibilidad del bloqueo
 * @returns {void}
 */
function eliminarBloqueo(id) {
    if (!confirm('¿Eliminar este bloqueo de disponibilidad?')) return;

    fetchAuth('http://127.0.0.1:8000/api/admin/disponibilidad-temporal/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id_disponibilidad: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) cargarBloqueos();
        else alert('Error al eliminar el bloqueo.');
    });
}

/**
 * Cambia la disponibilidad general de un estilista y recarga la tabla.
 * Un estilista "No Disponible" deja de aparecer en la agenda del cliente.
 *
 * @param {number} id                  - id_estilista
 * @param {string} nuevaDisponibilidad - 'Disponible' o 'No Disponible'
 * @returns {void}
 */
function cambiarDisponibilidad(id, nuevaDisponibilidad) {
    fetchAuth('http://127.0.0.1:8000/api/admin/horarios/disponibilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id_estilista: id, disponibilidad: nuevaDisponibilidad })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) cargarDisponibilidad();
        else alert('Error al cambiar disponibilidad.');
    });
}

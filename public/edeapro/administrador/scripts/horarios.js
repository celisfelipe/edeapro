/**
 * horarios.js — Panel Administrador / Horarios
 * =============================================
 * Muestra la agenda diaria (grilla) y gestiona bloqueos temporales.
 * La disponibilidad general de estilistas se gestiona en empleados.js.
 */

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;

    iniciarGrilla(fecha => `${API_BASE}/api/admin/horarios?fecha=${fecha}`);

    // Ya no llamamos cargarDisponibilidad() — eso está en empleados.js
    // Solo necesitamos llenar el select de estilistas para el formulario de bloqueos
    cargarEstilistasSelect();
    cargarBloqueos();
});

/**
 * Llena el <select id="bloqueo-estilista"> con los estilistas activos.
 * Usa el mismo endpoint de horarios pero solo toma la lista de estilistas.
 * Antes esto lo hacía cargarDisponibilidad(), que ya no existe en este archivo.
 */
function cargarEstilistasSelect() {
    fetchAuth('${API_BASE}/api/admin/horarios?fecha=' + new Date().toISOString().split('T')[0])
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;
        const select = document.getElementById('bloqueo-estilista');
        select.innerHTML = data.estilistas.map(e =>
            `<option value="${e.id_estilista}">${escaparHTML(e.nombre_estilista)}</option>`
        ).join('');
    });
}

/* ══════════════════════════════════════════════════════════════════════════
   BLOQUEOS TEMPORALES
   ══════════════════════════════════════════════════════════════════════════ */

function cargarBloqueos() {
    fetchAuth('${API_BASE}/api/admin/disponibilidad-temporal')
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
                    <td>${escaparHTML(b.nombre_estilista)} ${escaparHTML(b.apellido_estilista)}</td>
                    <td>${escaparHTML(b.fecha_inicio)}</td>
                    <td>${escaparHTML(b.fecha_fin)}</td>
                    <td>${escaparHTML(b.motivo || '—')}</td>
                    <td>
                        <button class="btn btn-red" onclick="eliminarBloqueo(${b.id_disponibilidad})">
                            <i class="fa-solid fa-trash"></i> Eliminar
                        </button>
                    </td>
                </tr>`;
        });
    });
}

function agregarBloqueo() {
    const id_estilista = document.getElementById('bloqueo-estilista').value;
    const fecha_inicio = document.getElementById('bloqueo-fecha-inicio').value;
    const fecha_fin    = document.getElementById('bloqueo-fecha-fin').value;
    const motivo       = document.getElementById('bloqueo-motivo').value.trim();

    if (!id_estilista || !fecha_inicio || !fecha_fin) {
        alert('Completa estilista, fecha de inicio y fecha de fin.');
        return;
    }

    fetchAuth('${API_BASE}/api/admin/disponibilidad-temporal/agregar', {
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

function eliminarBloqueo(id) {
    if (!confirm('¿Eliminar este bloqueo de disponibilidad?')) return;

    fetchAuth('${API_BASE}/api/admin/disponibilidad-temporal/eliminar', {
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

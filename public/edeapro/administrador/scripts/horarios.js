/**
 * horarios.js — Panel Administrador / Horarios
 * =============================================
 * Muestra la grilla de horarios del día (citas por estilista y hora).
 * Permite ver la disponibilidad de cada estilista y cambiarla.
 * Permite además registrar bloqueos temporales por fechas (ej. vacaciones),
 * independientes de la disponibilidad general.
 * Verifica que el usuario tenga rol "administrador" en localStorage.
 *
 * Conecta con la API de Laravel:
 *   GET  /api/admin/horarios?fecha=YYYY-MM-DD     → citas y estilistas del día
 *   POST /api/admin/horarios/disponibilidad       → cambiar disponibilidad de estilista
 *   GET  /api/admin/disponibilidad-temporal       → listar bloqueos vigentes/futuros
 *   POST /api/admin/disponibilidad-temporal/agregar  → registrar un bloqueo
 *   POST /api/admin/disponibilidad-temporal/eliminar → eliminar un bloqueo
 */

document.addEventListener('DOMContentLoaded', function () {

    const user = JSON.parse(localStorage.getItem('user'));
    const rol  = localStorage.getItem('rol');

    if (!user || rol !== 'administrador') {
        window.location.href = '../../paginas/login.html';
        return;
    }

    document.getElementById('nombre-admin').textContent = user.nombre_estilista + ' ' + user.apellido_estilista;

    // Poner la fecha de hoy en el selector por defecto
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha-selector').value = hoy;

    // Cargar la tabla de disponibilidad al iniciar
    cargarDisponibilidad();
    cargarBloqueos();
});

/**
 * Construye la grilla de horarios para la fecha seleccionada.
 * Genera slots de 30 minutos entre 9:00 y 17:00.
 * Por cada slot y estilista, muestra la cita asignada o "Libre".
 */
function cargarHorarios() {
    const fecha = document.getElementById('fecha-selector').value;
    if (!fecha) return;

    fetchAuth(`http://127.0.0.1:8000/api/admin/horarios?fecha=${fecha}`)
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;

        const contenedor = document.getElementById('contenedor-horarios');
        const estilistas = data.estilistas;
        const citas      = data.citas;

        // Generar array de slots de 30 min entre 9:00 y 17:00
        const horas = [];
        for (let h = 9; h <= 17; h++) {
            horas.push(`${String(h).padStart(2, '0')}:00`);
            if (h < 17) horas.push(`${String(h).padStart(2, '0')}:30`);
        }

        // Encabezado de la tabla con un <th> por estilista
        let html = `<table class="horario-table">
            <tr>
                <th>Hora</th>
                ${estilistas.map(e => `<th>${e.nombre_estilista}</th>`).join('')}
            </tr>`;

        // Por cada slot de hora, buscar si hay una cita para cada estilista
        horas.forEach(hora => {
            html += `<tr><td class="hora-col">${hora}</td>`;
            estilistas.forEach(e => {
                // Buscar cita que coincida con el estilista y la hora exacta
                const cita = citas.find(c =>
                    c.id_estilista == e.id_estilista && c.hora.substring(0, 5) === hora
                );
                if (cita) {
                    // Cita completada se muestra en verde
                    const clase = cita.estado === 'Completada' ? 'completada' : '';
                    html += `<td>
                        <div class="cita-bloque ${clase}">
                            <i class="fa-solid fa-paw"></i> ${cita.nombre_raza}<br>
                            <small>${cita.nombre_cliente} ${cita.apellido_cliente}</small><br>
                            <small>${cita.duracion}</small>
                        </div>
                    </td>`;
                } else {
                    html += `<td><span class="libre">Libre</span></td>`;
                }
            });
            html += '</tr>';
        });

        html += '</table>';
        contenedor.innerHTML = html;
    });
}

/**
 * Carga la tabla de disponibilidad de todos los estilistas activos.
 * Muestra un botón para cambiar entre Disponible / No Disponible.
 * Esto afecta si el estilista aparece en la agenda pública.
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
                    <td class="${disponible ? 'status-green' : 'status-red'}"><i class="fa-solid ${disponible ? 'fa-check' : 'fa-xmark'}"></i> ${e.disponibilidad}</td>
                    <td>
                        <button class="btn ${disponible ? 'btn-red' : 'btn-green'}"
                            onclick="cambiarDisponibilidad(${e.id_estilista}, '${disponible ? 'No Disponible' : 'Disponible'}')">
                            <i class="fa-solid ${disponible ? 'fa-ban' : 'fa-check'}"></i> ${disponible ? 'Marcar No Disponible' : 'Marcar Disponible'}
                        </button>
                    </td>
                </tr>`;
        });

        // Reutilizar la misma lista de estilistas para el selector del formulario de bloqueos
        const select = document.getElementById('bloqueo-estilista');
        select.innerHTML = data.estilistas.map(e =>
            `<option value="${e.id_estilista}">${e.nombre_estilista}</option>`
        ).join('');
    });
}

/**
 * Carga los bloqueos temporales vigentes/futuros y los muestra en la tabla.
 * Los bloqueos ya vencidos no se listan (quedan en la BD como historial).
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
 * Registra un bloqueo temporal de disponibilidad para el estilista y rango
 * de fechas elegidos en el formulario. No afecta la disponibilidad general.
 */
function agregarBloqueo() {
    const id_estilista  = document.getElementById('bloqueo-estilista').value;
    const fecha_inicio  = document.getElementById('bloqueo-fecha-inicio').value;
    const fecha_fin     = document.getElementById('bloqueo-fecha-fin').value;
    const motivo        = document.getElementById('bloqueo-motivo').value.trim();

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

/** Elimina un bloqueo temporal previa confirmación */
function eliminarBloqueo(id) {
    if (!confirm('¿Eliminar este bloqueo de disponibilidad?')) return;

    fetchAuth('http://127.0.0.1:8000/api/admin/disponibilidad-temporal/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id_disponibilidad: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            cargarBloqueos();
        } else {
            alert('Error al eliminar el bloqueo.');
        }
    });
}

/**
 * Cambia la disponibilidad de un estilista.
 * @param {number} id - id_estilista
 * @param {string} nuevaDisponibilidad - 'Disponible' o 'No Disponible'
 */
function cambiarDisponibilidad(id, nuevaDisponibilidad) {
    fetchAuth('http://127.0.0.1:8000/api/admin/horarios/disponibilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id_estilista: id, disponibilidad: nuevaDisponibilidad })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            cargarDisponibilidad(); // Refrescar la tabla sin recargar la página
        } else {
            modalError('Error al cambiar disponibilidad.');
        }
    });
}

/** Elimina la sesión del localStorage y redirige al login */
function cerrarSesion() {
    localStorage.removeItem('user');
    localStorage.removeItem('rol');
    window.location.href = '../../paginas/login.html';
}

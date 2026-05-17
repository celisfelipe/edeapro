/**
 * horarios.js — Panel Administrador / Horarios
 * =============================================
 * Muestra la grilla de horarios del día (citas por estilista y hora).
 * Permite ver la disponibilidad de cada estilista y cambiarla.
 * Verifica que el usuario tenga rol "administrador" en localStorage.
 *
 * Conecta con la API de Laravel:
 *   GET  /api/admin/horarios?fecha=YYYY-MM-DD  → citas y estilistas del día
 *   POST /api/admin/horarios/disponibilidad    → cambiar disponibilidad de estilista
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
});

/**
 * Construye la grilla de horarios para la fecha seleccionada.
 * Genera slots de 30 minutos entre 9:00 y 17:00.
 * Por cada slot y estilista, muestra la cita asignada o "Libre".
 */
function cargarHorarios() {
    const fecha = document.getElementById('fecha-selector').value;
    if (!fecha) return;

    fetch(`http://127.0.0.1:8000/api/admin/horarios?fecha=${fecha}`)
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
                            🐾 ${cita.nombre_raza}<br>
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
    fetch('http://127.0.0.1:8000/api/admin/horarios?fecha=' + new Date().toISOString().split('T')[0])
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
                    <td class="${disponible ? 'status-green' : 'status-red'}">${e.disponibilidad}</td>
                    <td>
                        <button class="btn ${disponible ? 'btn-red' : 'btn-green'}"
                            onclick="cambiarDisponibilidad(${e.id_estilista}, '${disponible ? 'No Disponible' : 'Disponible'}')">
                            ${disponible ? 'Marcar No Disponible' : 'Marcar Disponible'}
                        </button>
                    </td>
                </tr>`;
        });
    });
}

/**
 * Cambia la disponibilidad de un estilista.
 * @param {number} id - id_estilista
 * @param {string} nuevaDisponibilidad - 'Disponible' o 'No Disponible'
 */
function cambiarDisponibilidad(id, nuevaDisponibilidad) {
    fetch('http://127.0.0.1:8000/api/admin/horarios/disponibilidad', {
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

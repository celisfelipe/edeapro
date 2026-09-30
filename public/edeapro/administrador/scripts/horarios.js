/**
 * horarios.js — Panel Administrador / Horarios
 * =============================================
 * Muestra la agenda de citas en un calendario interactivo (FullCalendar).
 * Vista semanal por defecto: eje Y = horas, eje X = días de la semana.
 * Cada cita aparece como un bloque de color; al hacer clic se ve el detalle.
 *
 * Permite ver y cambiar la disponibilidad de cada estilista.
 * Permite registrar y eliminar bloqueos temporales por fechas.
 *
 * Depende de: fetchToken.js (fetchAuth), formatoHora.js (formatoHora12),
 *             sesion.js (verificarSesionAdmin, cerrarSesion) y FullCalendar (CDN).
 *
 * API Laravel:
 *   GET  /api/admin/horarios?fecha=YYYY-MM-DD        → citas y estilistas del día
 *   POST /api/admin/horarios/disponibilidad          → cambiar disponibilidad
 *   GET  /api/admin/disponibilidad-temporal          → listar bloqueos
 *   POST /api/admin/disponibilidad-temporal/agregar  → agregar bloqueo
 *   POST /api/admin/disponibilidad-temporal/eliminar → eliminar bloqueo
 */

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;

    inicializarCalendario();
    cargarDisponibilidad();
    cargarBloqueos();
});

/**
 * Crea y dibuja el calendario FullCalendar dentro de #calendario.
 *
 * - Vista inicial timeGridWeek: columnas = días, filas = horas (8 AM – 6 PM).
 * - Las horas del eje Y y de cada bloque se muestran en formato 12h.
 * - Cada cita es un bloque coloreado según su estado (ver cargarEventos).
 * - Al hacer clic en una cita se muestra su detalle en un alert.
 *
 * FullCalendar llama a `events` cada vez que cambia el rango visible
 * (al navegar entre semanas/meses) y ahí se piden las citas a la API.
 *
 * @returns {void}
 */
function inicializarCalendario() {
    const el = document.getElementById('calendario');
    if (!el) return;

    const calendario = new FullCalendar.Calendar(el, {
        locale:       'es',
        initialView:  'timeGridWeek',
        headerToolbar: {
            left:   'prev,next today',
            center: 'title',
            right:  'dayGridMonth,timeGridWeek,timeGridDay'
        },
        slotMinTime:     '08:00:00',   // la agenda empieza a las 8
        slotMaxTime:     '18:00:00',   // y termina a las 6pm
        slotDuration:    '00:30:00',   // slots de 30 minutos
        allDaySlot:      false,        // sin fila de "todo el día"
        nowIndicator:    true,         // línea roja en la hora actual
        height:          'auto',
        // Formato 12h en el eje Y y dentro de los bloques de evento
        slotLabelFormat: { hour: 'numeric', minute: '2-digit', hour12: true },
        eventTimeFormat: { hour: 'numeric', minute: '2-digit', hour12: true },
        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5, 6],  // lunes a sábado
            startTime:  '09:00',
            endTime:    '17:00'
        },

        // Cargar eventos dinámicamente según el rango visible
        events: function (info, successCallback, failureCallback) {
            cargarEventos(info.start, info.end)
                .then(eventos => successCallback(eventos))
                .catch(()    => failureCallback());
        },

        // Al hacer clic en una cita, mostrar su detalle
        eventClick: function (info) {
            const p     = info.event.extendedProps;
            const fecha = info.event.start.toLocaleDateString('es-CO', {
                weekday: 'long', day: 'numeric', month: 'long'
            });
            alert(
                `📅 ${fecha} · 🕐 ${formatoHora12(p.hora)}\n\n` +
                `👤 ${p.cliente}\n` +
                `🐾 ${p.mascota}\n` +
                `✂️ Estilista: ${p.estilista}\n` +
                `💇 Servicio: ${p.servicio}\n` +
                `Estado: ${p.estado}`
            );
        }
    });

    calendario.render();
}

/**
 * Pide a Laravel las citas de cada día del rango visible y las convierte
 * al formato de evento de FullCalendar.
 *
 * La API devuelve las citas de un solo día, así que se hace una petición
 * por día, todas en paralelo (Promise.all). Si un día falla, se omite
 * sin romper el resto del calendario.
 *
 * Colores por estado: Pendiente = amarillo, Completada = verde,
 * Cancelada = rojo, cualquier otro (ej. Reagendada) = marrón del tema.
 *
 * @param {Date} desde - inicio del rango visible (inclusive)
 * @param {Date} hasta - fin del rango visible (exclusivo)
 * @returns {Promise<Object[]>} eventos listos para FullCalendar
 */
async function cargarEventos(desde, hasta) {
    // Color del bloque según el estado de la cita
    const colores = {
        'Pendiente':  { bg: '#e8c56a', text: '#333' },
        'Completada': { bg: '#7eb56a', text: '#fff' },
        'Cancelada':  { bg: '#dc3545', text: '#fff' }
    };

    const eventos  = [];
    const promesas = [];
    const cursor   = new Date(desde);

    while (cursor < hasta) {
        const fecha = cursor.toISOString().split('T')[0]; // YYYY-MM-DD

        const p = fetchAuth(`http://127.0.0.1:8000/api/admin/horarios?fecha=${fecha}`)
            .then(res => res.json())
            .then(data => {
                if (!data.ok || !data.citas) return;

                data.citas.forEach(cita => {
                    const color = colores[cita.estado] || { bg: '#ae9d81', text: '#fff' };

                    eventos.push({
                        // Título visible en el bloque del calendario
                        title: `${cita.nombre_estilista} · ${cita.nombre_cliente}`,
                        // Combinar fecha + hora para el datetime ISO que necesita FullCalendar
                        start: `${cita.fecha}T${cita.hora}`,
                        backgroundColor: color.bg,
                        borderColor:     color.bg,
                        textColor:       color.text,
                        // Datos extra accesibles en eventClick
                        extendedProps: {
                            hora:      cita.hora,
                            cliente:   `${cita.nombre_cliente} ${cita.apellido_cliente}`,
                            mascota:   cita.nombre_raza ? `${cita.mascota} (${cita.nombre_raza})` : (cita.mascota || '—'),
                            servicio:  cita.nombre_servicio || '—',
                            estilista: cita.nombre_estilista,
                            estado:    cita.estado
                        }
                    });
                });
            })
            .catch(() => {});

        promesas.push(p);
        cursor.setDate(cursor.getDate() + 1);
    }

    await Promise.all(promesas);
    return eventos;
}

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

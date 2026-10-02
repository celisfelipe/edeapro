/**
 * horarios.js — Panel Administrador / Horarios
 * =============================================
 * Muestra la agenda de citas en una grilla personalizada por estilista.
 * Vista diaria: columnas = estilistas, filas = horas (8 AM – 6 PM).
 * Cada cita aparece como un bloque de color proporcional a su duración;
 * al hacer clic se despliega el panel lateral de detalle.
 *
 * Permite ver y cambiar la disponibilidad de cada estilista.
 * Permite registrar y eliminar bloqueos temporales por fechas.
 *
 * Depende de: fetchToken.js (fetchAuth), formatoHora.js (formatoHora12),
 *             sesion.js (verificarSesionAdmin, cerrarSesion).
 *
 * API Laravel:
 *   GET  /api/admin/horarios?fecha=YYYY-MM-DD        → citas y estilistas del día
 *   POST /api/admin/horarios/disponibilidad          → cambiar disponibilidad
 *   GET  /api/admin/disponibilidad-temporal          → listar bloqueos
 *   POST /api/admin/disponibilidad-temporal/agregar  → agregar bloqueo
 *   POST /api/admin/disponibilidad-temporal/eliminar → eliminar bloqueo
 */

/* ── Estado de la grilla ──────────────────────────────────────────────────── */
let diaOffset = 0;   // 0 = hoy, -1 = ayer, +1 = mañana, …

/* ── Configuración de la grilla ──────────────────────────────────────────── */
const HORA_INICIO   = 8;    // 8 AM
const HORA_FIN      = 18;   // 6 PM
const MINUTOS_SLOT  = 30;   // cada fila = 30 min
const PX_POR_SLOT   = 48;   // alto de cada fila; debe coincidir con .grilla-fila-slot > * en el CSS

/* ── Init ─────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;

    renderGrilla();
    cargarDisponibilidad();
    cargarBloqueos();
});

/* ══════════════════════════════════════════════════════════════════════════
   GRILLA DE AGENDA
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Navega N días hacia adelante o atrás respecto al día actual.
 * @param {number} delta  +1 = mañana, -1 = ayer
 */
function cambiarDia(delta) {
    diaOffset += delta;
    renderGrilla();
}

/** Vuelve al día de hoy. */
function irHoy() {
    diaOffset = 0;
    renderGrilla();
}

/**
 * Calcula la fecha según `diaOffset` y devuelve la cadena YYYY-MM-DD
 * en hora local (toISOString usa UTC y en Colombia, después de las 7 PM,
 * devolvería el día siguiente).
 * @returns {string}
 */
function fechaActual() {
    const d = new Date();
    d.setDate(d.getDate() + diaOffset);
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * Reemplaza el contenido de la grilla por un mensaje (cargando, error, vacío).
 * El mensaje ocupa todo el ancho (grid-column: 1 / -1 en .grilla-mensaje),
 * así que no hace falta tocar grid-template-columns.
 *
 * @param {HTMLElement} grilla - #grilla-agenda
 * @param {string}      texto
 */
function mostrarMensajeGrilla(grilla, texto) {
    grilla.innerHTML = `<div class="grilla-mensaje">${texto}</div>`;
}

/**
 * Punto de entrada de la grilla: actualiza la etiqueta de fecha, pide las
 * citas del día a la API y arma la grilla.
 *
 * Estructura: un único grid (#grilla-agenda) cuyas columnas son
 * [horas | estilista 1 | estilista 2 | …]. La cabecera y cada fila de slot
 * son wrappers con `display: contents`, así que sus celdas son, para el
 * layout, hijos directos del grid y todas comparten las mismas columnas.
 * grid-template-columns se asigna solo aquí.
 */
function renderGrilla() {
    const grilla = document.getElementById('grilla-agenda');
    if (!grilla) return;

    const fecha = fechaActual();

    const label = document.getElementById('grilla-fecha-label');
    if (label) {
        const d = new Date(fecha + 'T00:00:00');
        label.textContent = d.toLocaleDateString('es-CO', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    mostrarMensajeGrilla(grilla, 'Cargando agenda…');

    fetchAuth(`http://127.0.0.1:8000/api/admin/horarios?fecha=${fecha}`)
        .then(res => res.json())
        .then(data => {
            if (!data.ok) {
                mostrarMensajeGrilla(grilla, 'No se pudo cargar la agenda.');
                return;
            }
            const estilistas = data.estilistas || [];
            const citas      = data.citas      || [];

            if (estilistas.length === 0) {
                mostrarMensajeGrilla(grilla, 'No hay estilistas registrados.');
                return;
            }

            grilla.style.gridTemplateColumns = `76px repeat(${estilistas.length}, minmax(140px, 1fr))`;
            grilla.innerHTML = '';
            grilla.appendChild(construirCabecera(estilistas));
            construirFilasSlots(estilistas, citas).forEach(fila => grilla.appendChild(fila));
        })
        .catch(() => mostrarMensajeGrilla(grilla, 'Error al conectar con el servidor.'));
}

/**
 * Construye la fila de cabecera: una celda esquina vacía (sobre la columna
 * de horas) + una celda por estilista con avatar, nombre y badge de
 * disponibilidad.
 *
 * @param {Object[]} estilistas - lista devuelta por la API
 * @returns {HTMLElement} wrapper .grilla-fila (display: contents)
 */
function construirCabecera(estilistas) {
    const fila = document.createElement('div');
    fila.className = 'grilla-fila grilla-fila-cabecera';

    const esquina = document.createElement('div');
    esquina.className = 'grilla-head-cell';
    fila.appendChild(esquina);

    estilistas.forEach(e => {
        const disponible = e.disponibilidad === 'Disponible';
        const inicial    = (e.nombre_estilista || '?')[0].toUpperCase();

        const col = document.createElement('div');
        col.className = 'grilla-head-cell grilla-col-estilista';
        col.innerHTML = `
            <div class="grilla-avatar">${inicial}</div>
            <div class="grilla-nombre">${e.nombre_estilista}</div>
            <span class="grilla-badge ${disponible ? 'grilla-badge-disponible' : 'grilla-badge-no-disponible'}">
                ${disponible ? 'Disponible' : 'No disponible'}
            </span>`;
        fila.appendChild(col);
    });

    return fila;
}

/**
 * Construye una fila por slot de 30 min (8 AM – 6 PM): celda de hora a la
 * izquierda (con texto solo en las horas en punto) + una celda por estilista.
 * Las citas se dibujan en la celda donde empiezan, con `position: absolute`
 * y una altura proporcional a su duración, así que pueden cubrir varios slots.
 *
 * @param {Object[]} estilistas - lista de estilistas
 * @param {Object[]} citas      - lista de citas del día
 * @returns {HTMLElement[]} wrappers .grilla-fila (display: contents), en orden
 */
function construirFilasSlots(estilistas, citas) {
    const filas = [];

    // Agrupar citas por estilista para búsqueda rápida
    const citasPorEstilista = {};
    estilistas.forEach(e => { citasPorEstilista[e.id_estilista] = []; });
    citas.forEach(c => {
        if (citasPorEstilista[c.id_estilista] !== undefined) {
            citasPorEstilista[c.id_estilista].push(c);
        }
    });

    // Total de slots: (18 - 8) * 2 = 20 slots de 30 min
    const totalSlots = ((HORA_FIN - HORA_INICIO) * 60) / MINUTOS_SLOT;

    for (let s = 0; s < totalSlots; s++) {
        const minutosDesdeInicio = s * MINUTOS_SLOT;
        const hora   = HORA_INICIO + Math.floor(minutosDesdeInicio / 60);
        const minuto = minutosDesdeInicio % 60;
        const esHora = minuto === 0;   // slot de hora en punto: lleva la etiqueta

        const fila = document.createElement('div');
        fila.className = 'grilla-fila grilla-fila-slot' + (esHora ? '' : ' media-hora');
        fila.dataset.slot = s;

        // Celda de etiqueta horaria (solo en horas en punto)
        const celdaHora = document.createElement('div');
        celdaHora.className = 'grilla-hora-label';
        if (esHora) {
            celdaHora.textContent = formatoHora12(`${String(hora).padStart(2, '0')}:00`);
        }
        fila.appendChild(celdaHora);

        // Una celda por estilista
        estilistas.forEach(e => {
            const celda = document.createElement('div');
            celda.className = 'grilla-celda';

            // Citas que empiezan dentro de este slot (ej. 9:15 cae en el slot de 9:00)
            const citasSlot = citasPorEstilista[e.id_estilista].filter(c => {
                const [h, m] = c.hora.split(':').map(Number);
                return Math.floor((h * 60 + m - HORA_INICIO * 60) / MINUTOS_SLOT) === s;
            });

            citasSlot.forEach(cita => celda.appendChild(crearBloqueCita(cita)));

            fila.appendChild(celda);
        });

        filas.push(fila);
    }

    return filas;
}

/**
 * Crea el elemento DOM de un bloque de cita dentro de la grilla.
 * La altura es proporcional a la duración real del servicio, y si la cita
 * no empieza justo al inicio del slot (ej. 9:15 en el slot de 9:00) se
 * desplaza hacia abajo en la misma proporción.
 * Al hacer clic abre el panel lateral de detalle.
 *
 * @param {Object} cita - objeto cita de la API
 * @returns {HTMLElement}
 */
function crearBloqueCita(cita) {
    const duracion   = parseInt(cita.duracion) || 30;
    const slots      = duracion / MINUTOS_SLOT;
    const altura     = slots * PX_POR_SLOT - 6;   // -6px para el gap visual

    // Calcular hora de fin
    const [h, m]    = cita.hora.split(':').map(Number);
    const finTotal  = h * 60 + m + duracion;
    const horaFin   = `${String(Math.floor(finTotal / 60)).padStart(2, '0')}:${String(finTotal % 60).padStart(2, '0')}`;

    const estado    = (cita.estado || '').toLowerCase();
    const claseCss  = estado === 'pendiente'  ? 'pendiente'
                    : estado === 'completada' ? 'completada'
                    : estado === 'cancelada'  ? 'cancelada'
                    : 'pendiente';

    const mascota   = cita.nombre_raza
        ? `${cita.mascota} (${cita.nombre_raza})`
        : (cita.mascota || '—');

    const desfase = ((m % MINUTOS_SLOT) / MINUTOS_SLOT) * PX_POR_SLOT;

    const bloque = document.createElement('div');
    bloque.className = `cita-bloque ${claseCss}`;
    bloque.style.top    = `${3 + desfase}px`;   // 3px = margen superior base
    bloque.style.height = `${altura}px`;
    bloque.innerHTML = `
        <div class="cita-bloque-hora">${formatoHora12(cita.hora)} – ${formatoHora12(horaFin)}</div>
        <div class="cita-bloque-nombre">${cita.nombre_cliente} ${cita.apellido_cliente}</div>
        <div class="cita-bloque-servicio">${cita.nombre_servicio || '—'} · ${mascota}</div>`;

    bloque.addEventListener('click', function (e) {
        e.stopPropagation();
        abrirDetalleCita(cita, horaFin);
    });

    return bloque;
}

/**
 * Llena el panel lateral (#modal-detalle-overlay) con los datos de la cita
 * y lo hace visible añadiendo la clase `open`.
 *
 * @param {Object} cita    - objeto cita de la API
 * @param {string} horaFin - hora calculada de fin (HH:MM)
 */
function abrirDetalleCita(cita, horaFin) {
    const [anio, mes, dia] = cita.fecha.split('-');
    const fechaObj = new Date(Number(anio), Number(mes) - 1, Number(dia));
    const fechaStr = fechaObj.toLocaleDateString('es-CO', {
        weekday: 'long', day: 'numeric', month: 'long'
    });

    const mascota = cita.nombre_raza
        ? `${cita.mascota} (${cita.nombre_raza})`
        : (cita.mascota || '—');

    document.getElementById('detalle-cliente').textContent  = `${cita.nombre_cliente} ${cita.apellido_cliente}`;
    document.getElementById('detalle-mascota').textContent  = mascota;
    document.getElementById('detalle-servicio').textContent = cita.nombre_servicio || '—';
    document.getElementById('detalle-estilista').textContent = cita.nombre_estilista;
    document.getElementById('detalle-fecha').textContent    = fechaStr;
    document.getElementById('detalle-hora').textContent     = `${formatoHora12(cita.hora)} – ${formatoHora12(horaFin)}`;
    document.getElementById('detalle-estado').textContent   = cita.estado;

    const overlay = document.getElementById('modal-detalle-overlay');
    overlay.classList.add('open');

    document.getElementById('modal-detalle-close').onclick = function () {
        overlay.classList.remove('open');
    };

    overlay.onclick = function (e) {
        if (e.target === this) this.classList.remove('open');
    };
}

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

/**
 * notificaciones.js — Panel Administrador / Notificaciones
 * =========================================================
 * Carga y muestra las notificaciones del sistema.
 * Permite marcar notificaciones como leídas, una por una o todas a la vez.
 * Solo accesible con sesión de administrador (ver sesion.js).
 *
 * Conecta con la API de Laravel:
 *   GET  /api/admin/notificaciones      → cargar notificaciones
 *   POST /api/admin/notificaciones/leer → marcar como leída
 *
 * Depende de: fetchToken.js (fetchAuth), sesion.js (verificarSesionAdmin, cerrarSesion),
 *             formatoHora.js (formatoHora12).
 */

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;

    cargarNotificaciones();
});

// IDs de las notificaciones no leídas de la última carga (usado por "Marcar todas como leídas")
let notificacionesNoLeidasIds = [];

/**
 * Trae todas las notificaciones desde Laravel y las muestra como tarjetas.
 * Las no leídas se resaltan con la clase 'no-leida' y tienen un botón para
 * marcarlas como leídas. Guarda sus ids en notificacionesNoLeidasIds.
 *
 * @returns {void}
 */
function cargarNotificaciones() {
    fetchAuth('${API_BASE}/api/admin/notificaciones')
    .then(res => res.json())
    .then(data => {
        const contenedor = document.getElementById('contenedor-notificaciones');
        notificacionesNoLeidasIds = [];

        if (!data.ok || data.notificaciones.length === 0) {
            contenedor.innerHTML = '<p>No hay notificaciones</p>';
            actualizarBotonMarcarTodas();
            return;
        }
        contenedor.innerHTML = '';
        data.notificaciones.forEach(n => {
            const noLeida = n.estado === 'No leída';
            if (noLeida) notificacionesNoLeidasIds.push(n.id_notificacion);

            // Ícono según el tipo de notificación (cita/pago), si el dato lo indica
            const tipoIcono = (n.tipo || '').toLowerCase().includes('pago') ? 'fa-credit-card' : 'fa-calendar-check';

            contenedor.innerHTML += `
                <div class="notif ${noLeida ? 'no-leida' : ''}">
                    <h3><i class="fa-solid ${noLeida ? 'fa-bell' : 'fa-bell-slash'}"></i> ${escaparHTML(n.titulo)} ${noLeida ? '<span class="badge-noleida">Nueva</span>' : ''}
                    </h3>
                    <p>${escaparHTML(horasA12h(n.mensaje))}</p>
                    <small><i class="fa-solid ${tipoIcono}"></i> Cliente: ${escaparHTML(n.nombre_cliente)} ${escaparHTML(n.apellido_cliente)} · ${escaparHTML(n.tipo)}</small>
                    ${noLeida ? `<br><button class="btn btn-blue" style="margin-top:8px" onclick="marcarLeida(${n.id_notificacion})"><i class="fa-solid fa-check"></i> Marcar como leída</button>` : ''}
                </div>`;
        });
        actualizarBotonMarcarTodas();
    });
}

/**
 * Los mensajes los arman triggers de la BD con la hora en 24h
 * ("... a las 14:30:00"). Esta función cambia cada hora HH:MM:SS
 * del texto a formato 12h ("... a las 2:30 PM").
 *
 * @param {string} texto - mensaje de la notificación
 * @returns {string} el mismo mensaje con las horas en 12h
 */
function horasA12h(texto) {
    return String(texto || '').replace(/\b(\d{2}:\d{2}):\d{2}\b/g, (_, hhmm) => formatoHora12(hhmm));
}

/**
 * Muestra el botón "Marcar todas como leídas" solo si hay notificaciones
 * pendientes.
 *
 * @returns {void}
 */
function actualizarBotonMarcarTodas() {
    const btn = document.getElementById('btnMarcarTodas');
    if (!btn) return;
    btn.style.display = notificacionesNoLeidasIds.length > 0 ? 'inline-flex' : 'none';
}

/**
 * Envía a Laravel la petición para marcar una notificación como leída.
 * La usan marcarLeida() y marcarTodasLeidas().
 *
 * @param {number} id - id_notificacion
 * @returns {Promise<Response>}
 */
function enviarMarcarLeida(id) {
    return fetchAuth('${API_BASE}/api/admin/notificaciones/leer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id_notificacion: id })
    });
}

/**
 * Marca como leídas todas las notificaciones pendientes (en paralelo)
 * y luego recarga la lista.
 *
 * @returns {void}
 */
function marcarTodasLeidas() {
    if (notificacionesNoLeidasIds.length === 0) return;
    Promise.all(notificacionesNoLeidasIds.map(enviarMarcarLeida))
        .then(() => cargarNotificaciones());
}

/**
 * Marca una notificación como leída y recarga la lista.
 *
 * @param {number} id - id_notificacion
 * @returns {void}
 */
function marcarLeida(id) {
    enviarMarcarLeida(id)
    .then(res => res.json())
    .then(data => {
        if (data.ok) cargarNotificaciones(); // Refrescar la lista
    });
}

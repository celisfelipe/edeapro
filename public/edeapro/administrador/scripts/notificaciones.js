/**
 * notificaciones.js — Panel Administrador / Notificaciones
 * =========================================================
 * Carga y muestra las notificaciones del sistema.
 * Permite marcar notificaciones individuales como leídas.
 * Verifica que el usuario tenga rol "administrador" en localStorage.
 *
 * Conecta con la API de Laravel:
 *   GET  /api/admin/notificaciones      → cargar notificaciones
 *   POST /api/admin/notificaciones/leer → marcar como leída
 */

document.addEventListener('DOMContentLoaded', function () {

    const user = JSON.parse(localStorage.getItem('user'));
    const rol  = localStorage.getItem('rol');

    if (!user || rol !== 'administrador') {
        window.location.href = '../../paginas/login.html';
        return;
    }

    document.getElementById('nombre-admin').textContent = user.nombre_estilista + ' ' + user.apellido_estilista;

    cargarNotificaciones();
});

// IDs de las notificaciones no leídas de la última carga (usado por "Marcar todas como leídas")
let notificacionesNoLeidasIds = [];

/**
 * Trae todas las notificaciones desde Laravel y las muestra como tarjetas.
 * Las notificaciones no leídas se muestran resaltadas con clase 'no-leida'
 * y tienen un botón para marcarlas como leídas.
 */
function cargarNotificaciones() {
    fetchAuth('http://127.0.0.1:8000/api/admin/notificaciones')
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
                    <h3><i class="fa-solid ${noLeida ? 'fa-bell' : 'fa-bell-slash'}"></i> ${n.titulo} ${noLeida ? '<span class="badge-noleida">Nueva</span>' : ''}
                    </h3>
                    <p>${n.mensaje}</p>
                    <small><i class="fa-solid ${tipoIcono}"></i> Cliente: ${n.nombre_cliente} ${n.apellido_cliente} · ${n.tipo}</small>
                    ${noLeida ? `<br><button class="btn btn-blue" style="margin-top:8px" onclick="marcarLeida(${n.id_notificacion})"><i class="fa-solid fa-check"></i> Marcar como leída</button>` : ''}
                </div>`;
        });
        actualizarBotonMarcarTodas();
    });
}

/** Muestra el botón "Marcar todas como leídas" solo si hay notificaciones pendientes */
function actualizarBotonMarcarTodas() {
    const btn = document.getElementById('btnMarcarTodas');
    if (!btn) return;
    btn.style.display = notificacionesNoLeidasIds.length > 0 ? 'inline-flex' : 'none';
}

/**
 * Marca todas las notificaciones no leídas como leídas.
 * Reutiliza el mismo endpoint de marcar-una-por-una, llamado en bucle.
 */
function marcarTodasLeidas() {
    if (notificacionesNoLeidasIds.length === 0) return;
    Promise.all(notificacionesNoLeidasIds.map(id =>
        fetchAuth('http://127.0.0.1:8000/api/admin/notificaciones/leer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ id_notificacion: id })
        })
    )).then(() => cargarNotificaciones());
}

/**
 * Marca una notificación como leída enviando su id a Laravel.
 * Recarga la lista para reflejar el cambio visualmente.
 */
function marcarLeida(id) {
    fetchAuth('http://127.0.0.1:8000/api/admin/notificaciones/leer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id_notificacion: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) cargarNotificaciones(); // Refrescar la lista
    });
}

/** Elimina la sesión del localStorage y redirige al login */
function cerrarSesion() {
    localStorage.removeItem('user');
    localStorage.removeItem('rol');
    window.location.href = '../../paginas/login.html';
}

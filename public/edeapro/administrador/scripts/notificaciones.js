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

/**
 * Trae todas las notificaciones desde Laravel y las muestra como tarjetas.
 * Las notificaciones no leídas se muestran resaltadas con clase 'no-leida'
 * y tienen un botón para marcarlas como leídas.
 */
function cargarNotificaciones() {
    fetch('http://127.0.0.1:8000/api/admin/notificaciones')
    .then(res => res.json())
    .then(data => {
        const contenedor = document.getElementById('contenedor-notificaciones');
        if (!data.ok || data.notificaciones.length === 0) {
            contenedor.innerHTML = '<p>No hay notificaciones</p>';
            return;
        }
        contenedor.innerHTML = '';
        data.notificaciones.forEach(n => {
            const noLeida = n.estado === 'No leída';
            contenedor.innerHTML += `
                <div class="notif ${noLeida ? 'no-leida' : ''}">
                    <h3>${n.titulo} ${noLeida ? '<span class="badge-noleida">Nueva</span>' : ''}
                    </h3>
                    <p>${n.mensaje}</p>
                    <small>Cliente: ${n.nombre_cliente} ${n.apellido_cliente} · ${n.tipo}</small>
                    ${noLeida ? `<br><button class="btn btn-blue" style="margin-top:8px" onclick="marcarLeida(${n.id_notificacion})">Marcar como leída</button>` : ''}
                </div>`;
        });
    });
}

/**
 * Marca una notificación como leída enviando su id a Laravel.
 * Recarga la lista para reflejar el cambio visualmente.
 */
function marcarLeida(id) {
    fetch('http://127.0.0.1:8000/api/admin/notificaciones/leer', {
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

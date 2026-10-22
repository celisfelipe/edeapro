/**
 * sesion.js — Panel Administrador / Sesión compartida
 * =====================================================
 * Lógica de sesión común a todas las páginas del panel admin.
 * Antes estaba copiada en cada script (clientes.js, pagos.js, ...);
 * ahora vive solo aquí.
 *
 * Se incluye en cada página del admin antes del script propio de la página:
 *   <script src="../../scripts/fetchToken.js"></script>
 *   <script src="../scripts/sesion.js"></script>
 *   <script src="../scripts/<pagina>.js"></script>
 *
 * Datos que usa de localStorage (los guarda login.js):
 *   user  → objeto del estilista logueado (nombre_estilista, apellido_estilista, ...)
 *   rol   → 'administrador' | 'peluquero' | 'cliente'
 *   token → token Bearer que envía fetchAuth()
 */

/** Ruta al login relativa a las páginas de administrador/paginas/ */
const LOGIN_URL = '../../paginas/login.html';

/**
 * Verifica que haya una sesión activa con rol "administrador".
 * - Si no la hay, redirige al login y devuelve null.
 * - Si la hay, pinta el nombre del admin en el header (#nombre-admin)
 *   y devuelve el usuario.
 *
 * Uso típico al inicio de cada página:
 *   document.addEventListener('DOMContentLoaded', function () {
 *       if (!verificarSesionAdmin()) return;
 *       ...
 *   });
 *
 * @returns {object|null} el usuario logueado, o null si se redirigió al login
 */
function verificarSesionAdmin() {
    const user = JSON.parse(localStorage.getItem('user'));
    const rol  = localStorage.getItem('rol');

    if (!user || rol !== 'administrador') {
        window.location.href = LOGIN_URL;
        return null;
    }

    const nombreEl = document.getElementById('nombre-admin');
    if (nombreEl) nombreEl.textContent = user.nombre_estilista + ' ' + user.apellido_estilista;

    return user;
}

/**
 * Cierra la sesión: revoca el token en el servidor, borra usuario, rol y
 * token del localStorage y redirige al login. Se llama desde el botón
 * "Cerrar sesión" del pie del sidebar.
 *
 * La revocación es "best effort": si el servidor no responde, igual se
 * limpia la sesión local para que el usuario pueda salir.
 */
function cerrarSesion() {
    fetchAuth('http://127.0.0.1:8000/api/logout', { method: 'POST', keepalive: true })
        .catch(() => {})
        .finally(() => {
            localStorage.removeItem('user');
            localStorage.removeItem('rol');
            localStorage.removeItem('token');
            window.location.href = LOGIN_URL;
        });
}

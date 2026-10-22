/**
 * sesion.js — Panel Empleado / Sesión compartida
 * ================================================
 * Lógica de sesión común a todas las páginas del panel empleado
 * (equivalente a administrador/scripts/sesion.js). Antes estaba copiada
 * en inicio.js, clientes.js y disponibilidad.js; ahora vive solo aquí.
 *
 * Se incluye en cada página del empleado antes del script propio:
 *   <script src="../../scripts/fetchToken.js"></script>
 *   <script src="../scripts/sesion.js"></script>
 *   <script src="../scripts/<pagina>.js"></script>
 *
 * Datos que usa de localStorage (los guarda login.js):
 *   user  → objeto del estilista logueado
 *   rol   → 'peluquero' para este panel
 *   token → token Bearer que envía fetchAuth()
 */

/** Ruta al login relativa a las páginas de empleado/paginas/ */
const LOGIN_URL = '../../paginas/login.html';

/**
 * Verifica que haya una sesión activa con rol "peluquero".
 * - Si no la hay, redirige al login y devuelve null.
 * - Si la hay, pinta el nombre en el header (#nombre-empleado)
 *   y devuelve el usuario.
 *
 * @returns {object|null} el usuario logueado, o null si se redirigió al login
 */
function verificarSesionEmpleado() {
    const user = JSON.parse(localStorage.getItem('user'));
    const rol  = localStorage.getItem('rol');

    if (!user || rol !== 'peluquero') {
        window.location.href = LOGIN_URL;
        return null;
    }

    const nombreEl = document.getElementById('nombre-empleado');
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

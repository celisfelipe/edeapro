/**
 * fetchToken.js — Fetch con autenticación
 * =========================================
 * Contiene fetchAuth() para enviar el token de seguridad
 * en cada petición a las rutas protegidas de Laravel.
 *
 * Se carga en todas las páginas que hacen peticiones
 * al panel admin, empleado y cliente.
 *
 * Uso: fetchAuth(url, opciones) en vez de fetch(url, opciones)
 */

/**
 * fetchAuth() — Agrega automáticamente el token Bearer
 * en el header de cada petición a Laravel.
 */
function fetchAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    return fetch(url, options);
}
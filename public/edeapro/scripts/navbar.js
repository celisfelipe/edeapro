/**
 * navbar.js — Navbar Dinámico del Sitio Público
 * ================================================
 * Cambia el botón "Inicio de Sesión" del navbar según si hay sesión activa.
 * Se carga en todas las páginas públicas del sitio.
 *
 * Si hay sesión activa, el botón cambia a:
 *   cliente       → "Mi perfil"    → cliente/perfil.html
 *   administrador → "Panel Admin"  → administrador/paginas/inicio.html
 *   peluquero     → "Mi panel"     → empleado/paginas/inicio.html
 *
 * Si no hay sesión, el botón queda como "Inicio de Sesión" (por defecto en el HTML).
 */

document.addEventListener('DOMContentLoaded', function () {
    const user      = JSON.parse(localStorage.getItem('user'));
    const rol       = localStorage.getItem('rol');
    const loginLink = document.querySelector('nav .login');

    // Si la página no tiene navbar, no hacer nada
    if (!loginLink) return;

    // Cambiar el texto y destino del botón según el rol del usuario
    if (user && rol === 'cliente') {
        loginLink.textContent = 'Mi perfil';
        loginLink.href = '../cliente/perfil.html';
    } else if (user && rol === 'administrador') {
        loginLink.textContent = 'Panel Admin';
        loginLink.href = '../administrador/paginas/inicio.html';
    } else if (user && rol === 'peluquero') {
        loginLink.textContent = 'Mi panel';
        loginLink.href = '../empleado/paginas/inicio.html';
    }
    // Si no hay sesión, el botón queda con el href y texto originales del HTML
});

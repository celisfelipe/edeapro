/**
 * navbar.js — Navbar Dinámico del Sitio Público
 * ================================================
 * Cambia el botón "Inicio de Sesión" según si hay sesión activa.
 * El botón arranca invisible para evitar el parpadeo al cargar.
 * Se vuelve visible solo cuando el JS ya sabe qué texto mostrar.
 */

document.addEventListener('DOMContentLoaded', function () {
    const user      = JSON.parse(localStorage.getItem('user'));
    const rol       = localStorage.getItem('rol');
    const loginLink = document.querySelector('nav .login');

    if (!loginLink) return;

    // Cambiar texto y destino según el rol del usuario
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

    // Mostrar el botón solo cuando ya sabe qué texto poner
    // Esto evita el parpadeo de "Inicio de Sesión" → "Mi perfil"
    loginLink.style.visibility = 'visible';
});

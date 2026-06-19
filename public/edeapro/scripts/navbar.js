/**
 * navbar.js — Navbar Dinámico del Sitio Público
 * ================================================
 * Cambia el botón "Inicio de Sesión" según si hay sesión activa.
 * Cambia el destino del botón "Agendar cita" según la sesión:
 *   - Sin sesión → login.html (para que primero inicie sesión)
 *   - Con sesión → agenda.html (va directo a agendar)
 *
 * El botón de login arranca invisible para evitar parpadeo
 * y se vuelve visible cuando el JS ya sabe qué mostrar.
 */

document.addEventListener('DOMContentLoaded', function () {
    const user      = JSON.parse(localStorage.getItem('user'));
    const rol       = localStorage.getItem('rol');
    const loginLink = document.querySelector('nav .login');
    const agendarLink = document.querySelector('nav a[href="agenda.html"], nav a[href="../paginas/agenda.html"]');

    // Cambiar botón de agendar según sesión
    if (agendarLink) {
        if (!user) {
            // Sin sesión → mandar al login primero
            agendarLink.href = 'login.html';
            agendarLink.title = 'Inicia sesión para agendar';
        } else if (user && rol === 'cliente') {
            // Con sesión de cliente → ir directo a la agenda
            agendarLink.href = 'agenda.html';
        }
    }

    if (!loginLink) return;

    // Cambiar botón de login según el rol
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
    loginLink.style.visibility = 'visible';
});

/* ── Menú hamburguesa (móvil/tablet) ──────────────────────────
   Muestra/oculta los links del nav en pantallas chicas.
   No afecta el comportamiento en escritorio. */
document.addEventListener('DOMContentLoaded', function () {
    const header = document.querySelector('header');
    const hamburger = document.querySelector('.nav-hamburger');
    if (!header || !hamburger) return;

    hamburger.addEventListener('click', function () {
        header.classList.toggle('nav-open');
    });

    // Cerrar el menú al elegir un link (evita que quede abierto al navegar)
    header.querySelectorAll('nav a').forEach(function (link) {
        link.addEventListener('click', function () {
            header.classList.remove('nav-open');
        });
    });
});

/**
 * verificarSesionAgenda()
 * Verifica si hay sesión de cliente antes de ir a la agenda.
 * Se usa en cualquier botón del sitio que lleve a agendar cita.
 * Sin sesión manda al login, con sesión va directo a la agenda.
 */
function verificarSesionAgenda(event) {
    event.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    const rol  = localStorage.getItem('rol');

    if (user && rol === 'cliente') {
        window.location.href = 'agenda.html';
    } else {
        window.location.href = 'login.html';
    }
}

/**
 * disponibilidad.js — Panel Empleado / Mi Agenda
 * ================================================
 * Muestra la agenda diaria del estilista que inició sesión con la misma
 * grilla del administrador (scripts/agendaGrilla.js): una sola columna,
 * la suya, con sus citas por franja horaria. Se navega por días con los
 * botones ‹ Hoy ›.
 *
 * A diferencia del admin, aquí no se cambia la disponibilidad ni se
 * administran bloqueos temporales (esas rutas son solo de administrador).
 * Verifica que el usuario tenga rol "peluquero" en localStorage.
 *
 * Conecta con la API de Laravel:
 *   GET /api/empleado/agenda?fecha=YYYY-MM-DD → citas del día del estilista
 *       autenticado; el backend toma el id del token, no del request.
 *
 * Depende de: fetchToken.js (fetchAuth), formatoHora.js (formatoHora12),
 *             agendaGrilla.js (iniciarGrilla).
 */

document.addEventListener('DOMContentLoaded', function () {

    const user = JSON.parse(localStorage.getItem('user'));
    const rol  = localStorage.getItem('rol');

    if (!user || rol !== 'peluquero') {
        window.location.href = '../../paginas/login.html';
        return;
    }

    document.getElementById('nombre-empleado').textContent = user.nombre_estilista + ' ' + user.apellido_estilista;

    iniciarGrilla(fecha => `http://127.0.0.1:8000/api/empleado/agenda?fecha=${fecha}`);
});

/** Elimina la sesión del localStorage y redirige al login */
function cerrarSesion() {
    localStorage.removeItem('user');
    localStorage.removeItem('rol');
    window.location.href = '../../paginas/login.html';
}

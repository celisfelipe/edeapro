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
 * La sesión (rol "peluquero") la verifica sesion.js.
 *
 * Conecta con la API de Laravel:
 *   GET /api/empleado/agenda?fecha=YYYY-MM-DD → citas del día del estilista
 *       autenticado; el backend toma el id del token, no del request.
 *
 * Depende de: fetchToken.js (fetchAuth), formatoHora.js (formatoHora12),
 *             agendaGrilla.js (iniciarGrilla).
 */

document.addEventListener('DOMContentLoaded', function () {

    if (!verificarSesionEmpleado()) return;

    iniciarGrilla(fecha => `http://127.0.0.1:8000/api/empleado/agenda?fecha=${fecha}`);
});

/**
 * formatoHora.js — Utilidad compartida de formato de horas
 * =========================================================
 * La base de datos y la API trabajan con horas en formato 24h ("14:30:00"),
 * pero en pantalla se muestran siempre en formato 12h ("2:30 PM").
 *
 * Regla: el valor que se envía a la API NO se toca (sigue en 24h);
 * solo se convierte el texto que ve el usuario.
 *
 * Se incluye con <script src=".../scripts/formatoHora.js"></script>
 * antes del script de la página que lo usa.
 */

/**
 * Convierte una hora de 24h a 12h con AM/PM.
 *
 * @param {string} hora - "HH:MM" o "HH:MM:SS" (ej. "14:30:00")
 * @returns {string} hora en 12h (ej. "2:30 PM"); si llega vacía o
 *                   con formato inesperado se devuelve tal cual.
 *
 * @example formatoHora12('09:00')    // "9:00 AM"
 * @example formatoHora12('12:15:00') // "12:15 PM"
 * @example formatoHora12('00:00')    // "12:00 AM"
 */
function formatoHora12(hora) {
    if (!hora) return hora;
    const partes = String(hora).split(':');
    const h = parseInt(partes[0], 10);
    const m = partes[1];
    if (isNaN(h) || m === undefined) return hora;

    const sufijo = h >= 12 ? 'PM' : 'AM';
    const h12    = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m} ${sufijo}`;
}

/**
 * reportes.js — Panel Empleado / Reportes
 * =========================================
 * Descarga el reporte de citas del estilista que inició sesión en PDF o Excel.
 * Solo incluye SUS citas: el backend toma el id_estilista del token, no del
 * request, así que un empleado no puede descargar las citas de otro.
 *
 * Conecta con la API de Laravel:
 *   GET /api/empleado/reportes/citas/pdf
 *   GET /api/empleado/reportes/citas/excel
 *
 * Depende de: fetchToken.js (fetchAuth), descargas.js (descargarArchivo),
 *             sesion.js (verificarSesionEmpleado, cerrarSesion).
 */

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionEmpleado()) return;
});

/**
 * Descarga el reporte de mis citas. Deshabilita el botón mientras se genera
 * y muestra el error debajo de los botones si falla.
 *
 * @param {string}            formato - 'pdf' o 'excel'
 * @param {HTMLButtonElement} boton   - el botón pulsado
 */
function descargarMisCitas(formato, boton) {
    const extension = formato === 'excel' ? 'xlsx' : 'pdf';
    const estado    = document.getElementById('reporte-estado');
    estado.textContent = '';
    boton.disabled = true;

    descargarArchivo(`http://127.0.0.1:8000/api/empleado/reportes/citas/${formato}`, `mis-citas.${extension}`)
        .catch(() => { estado.textContent = `No se pudo generar el reporte (${extension.toUpperCase()}). Intenta de nuevo.`; })
        .finally(() => { boton.disabled = false; });
}

/**
 * reportes.js — Panel Administrador / Reportes
 * ==============================================
 * Descarga los reportes generales del negocio en PDF o Excel.
 * Antes estaban en el menú "Exportar" de la página de Citas; ahora tienen
 * su propia entrada en el sidebar.
 *
 * API Laravel:
 *   GET /api/reportes/{tipo}/pdf   → tipo = citas | pagos | clientes
 *   GET /api/reportes/{tipo}/excel
 *
 * Depende de: fetchToken.js (fetchAuth), descargas.js (descargarArchivo),
 *             sesion.js (verificarSesionAdmin, cerrarSesion),
 *             modal.js (modalError).
 */

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;
});

/**
 * Descarga un reporte desde un botón de la página.
 * Deshabilita el botón mientras se genera para evitar descargas dobles.
 *
 * @param {string}            tipo    - 'citas', 'pagos' o 'clientes'
 * @param {string}            formato - 'pdf' o 'excel'
 * @param {HTMLButtonElement} boton   - el botón pulsado
 */
function descargarReporte(tipo, formato, boton) {
    const extension = formato === 'excel' ? 'xlsx' : 'pdf';
    boton.disabled = true;

    descargarArchivo(`${API_BASE}/api/reportes/${tipo}/${formato}`, `reporte-${tipo}.${extension}`)
        .catch(() => modalError(`No se pudo generar el reporte de ${tipo} (${extension.toUpperCase()}).`))
        .finally(() => { boton.disabled = false; });
}

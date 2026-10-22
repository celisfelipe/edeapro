/**
 * descargas.js — Descarga de archivos protegidos
 * ================================================
 * Descarga un archivo (PDF, Excel) de una ruta de Laravel que exige token.
 * Un <a href> normal no puede enviar el header Authorization, así que se pide
 * con fetchAuth(), se recibe como blob y se fuerza la descarga en el navegador.
 *
 * Lo usan las páginas de Reportes del administrador y del empleado.
 *
 * Depende de: fetchToken.js (fetchAuth).
 */

/**
 * @param {string} url            - ruta completa de la API
 * @param {string} nombreArchivo  - nombre con el que se guarda (ej. 'reporte-citas.pdf')
 * @returns {Promise<void>} se rechaza si el servidor responde con error o no hay conexión
 */
function descargarArchivo(url, nombreArchivo) {
    return fetchAuth(url)
        .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.blob();
        })
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const link    = document.createElement('a');
            link.href     = blobUrl;
            link.download = nombreArchivo;
            link.click();
            window.URL.revokeObjectURL(blobUrl);
        });
}

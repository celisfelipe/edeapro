/**
 * inicio.js — Panel Administrador / Citas
 * =========================================
 * Carga y muestra todas las citas del sistema en una tabla paginada.
 * Permite cancelar citas (con modal de confirmación) y ver el detalle
 * completo de cada cita en un modal lateral.
 *
 * API Laravel:
 *   GET  /api/admin/citas          → lista todas las citas (vista citas_completas)
 *   POST /api/admin/citas/cancelar → cambia estado a Cancelada
 *
 * Depende de: fetchToken.js (fetchAuth), formatoHora.js (formatoHora12),
 *             sesion.js (verificarSesionAdmin, cerrarSesion),
 *             modal.js (modalConfirmar, modalExito, modalError).
 */

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;

    // Cerrar modal de detalles al hacer clic en la X o fuera del panel
    document.getElementById('modal-detalle-close').addEventListener('click', cerrarDetalle);
    document.getElementById('modal-detalle-overlay').addEventListener('click', function (e) {
        // Solo cierra si el clic fue exactamente sobre el overlay, no sobre el panel
        if (e.target === this) cerrarDetalle();
    });

    // Botón "Detalles" de cada fila: un solo listener en el <tbody> (delegación).
    // La cita viaja en data-cita (JSON con encodeURIComponent) y se lee con dataset.
    document.getElementById('tabla-citas').addEventListener('click', function (e) {
        const btn = e.target.closest('.btn-detalle');
        if (btn) verDetalle(btn.dataset.cita);
    });

    // Traer todas las citas desde Laravel
    fetchAuth('${API_BASE}/api/admin/citas')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('tabla-citas');
            if (!data.ok || data.citas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8">No hay citas registradas</td></tr>';
                document.getElementById('stat-total').textContent       = 0;
                document.getElementById('stat-pendientes').textContent  = 0;
                document.getElementById('stat-completadas').textContent = 0;
                document.getElementById('stat-canceladas').textContent  = 0;
                return;
            }

            allCitas     = data.citas;
            paginaActual = 1;

            // Calcular totales para las cards de resumen
            document.getElementById('stat-total').textContent       = allCitas.length;
            document.getElementById('stat-pendientes').textContent  = allCitas.filter(c => c.estado === 'Pendiente').length;
            document.getElementById('stat-completadas').textContent = allCitas.filter(c => c.estado === 'Completada').length;
            document.getElementById('stat-canceladas').textContent  = allCitas.filter(c => c.estado === 'Cancelada').length;

            renderTablaCitas();
        })
        .catch(() => {
            document.getElementById('tabla-citas').innerHTML =
                '<tr><td colspan="8">Error cargando citas</td></tr>';
        });
});

// Estado de paginación de la tabla de citas
let allCitas     = [];
let paginaActual = 1;
const CITAS_POR_PAGINA = 12;

/**
 * Calcula las iniciales de un cliente para el avatar circular.
 *
 * @param {string} nombre
 * @param {string} apellido
 * @returns {string} ej. "Felipe", "Celis" → "FC" (sin pasar a mayúsculas)
 */
function inicialesCliente(nombre, apellido) {
    return ((nombre || '')[0] || '') + ((apellido || '')[0] || '');
}

/**
 * Devuelve la clase CSS de color y el ícono de Font Awesome para un estado.
 *
 * @param {string} estado - 'Completada' | 'Pendiente' | cualquier otro
 * @returns {{clase: string, icono: string}} verde/check, amarillo/reloj o rojo/x
 */
function estiloEstado(estado) {
    if (estado === 'Completada') return { clase: 'status-green',  icono: 'fa-check' };
    if (estado === 'Pendiente')  return { clase: 'status-yellow', icono: 'fa-clock' };
    return { clase: 'status-red', icono: 'fa-xmark' };
}

/**
 * Dibuja en #tabla-citas las citas de la página actual (CITAS_POR_PAGINA
 * por página, tomadas de allCitas) y actualiza el footer de paginación.
 *
 * @returns {void}
 */
function renderTablaCitas() {
    const tbody  = document.getElementById('tabla-citas');
    const inicio = (paginaActual - 1) * CITAS_POR_PAGINA;
    const pagina = allCitas.slice(inicio, inicio + CITAS_POR_PAGINA);

    tbody.innerHTML = '';
    pagina.forEach(cita => {
        const estilo = estiloEstado(cita.estado);

        // El objeto cita completo se serializa en JSON para pasarlo al modal de detalles.
        // encodeURIComponent evita que las comillas y caracteres especiales rompan el HTML.
        const citaJson = encodeURIComponent(JSON.stringify(cita));

        tbody.innerHTML += `
            <tr>
                <td>${escaparHTML(cita.fecha)}</td>
                <td>${escaparHTML(formatoHora12(cita.hora))}</td>
                <td>
                    <div class="cliente-info">
                        <span class="avatar-circle">${escaparHTML(inicialesCliente(cita.nombre_cliente, cita.apellido_cliente).toUpperCase())}</span>
                        ${escaparHTML(cita.nombre_cliente)} ${escaparHTML(cita.apellido_cliente)}
                    </div>
                </td>
                <td>${escaparHTML(cita.mascota)}</td>
                <td>${escaparHTML(cita.nombre_servicio)}</td>
                <td>${escaparHTML(cita.nombre_estilista)}</td>
                <td class="${estilo.clase}"><i class="fa-solid ${estilo.icono}"></i> ${escaparHTML(cita.estado)}</td>
                <td class="acciones-cell">
                    <button class="btn btn-red" onclick="cancelarCita(${cita.id_cita})">
                        <i class="fa-solid fa-xmark"></i> Cancelar
                    </button>
                    <button class="btn btn-blue btn-detalle" data-cita="${citaJson}">
                        <i class="fa-solid fa-eye"></i> Detalles
                    </button>
                </td>
            </tr>`;
    });

    renderPaginacionCitas();
}

/**
 * Dibuja en #citasFooter el texto "Mostrando X-Y de Z citas" y un botón
 * por cada página.
 *
 * @returns {void}
 */
function renderPaginacionCitas() {
    const footer = document.getElementById('citasFooter');
    if (!footer) return;

    const total        = allCitas.length;
    const totalPaginas = Math.max(1, Math.ceil(total / CITAS_POR_PAGINA));
    const desde        = total === 0 ? 0 : (paginaActual - 1) * CITAS_POR_PAGINA + 1;
    const hasta        = Math.min(paginaActual * CITAS_POR_PAGINA, total);

    let botones = '';
    for (let p = 1; p <= totalPaginas; p++) {
        botones += `<button class="page-btn ${p === paginaActual ? 'active' : ''}" onclick="irPaginaCitas(${p})">${p}</button>`;
    }

    footer.innerHTML = `
        <span class="footer-info">Mostrando ${desde}-${hasta} de ${total} citas</span>
        <div class="pagination">${botones}</div>`;
}

/**
 * Cambia de página en la tabla de citas.
 *
 * @param {number} p - número de página (empieza en 1)
 * @returns {void}
 */
function irPaginaCitas(p) {
    paginaActual = p;
    renderTablaCitas();
}

/**
 * Abre el panel lateral con toda la información de una cita.
 * La cita llega serializada desde el onclick del botón "Detalles"
 * (JSON.stringify + encodeURIComponent); aquí se decodifica y se
 * rellenan los campos del modal. Fecha en DD/MM/YYYY y hora en 12h.
 *
 * @param {string} citaEncoded - encodeURIComponent(JSON.stringify(cita))
 * @returns {void}
 */
function verDetalle(citaEncoded) {
    const cita = JSON.parse(decodeURIComponent(citaEncoded));

    // Formatear fecha de YYYY-MM-DD a DD/MM/YYYY
    const [anio, mes, dia] = cita.fecha.split('-');
    const fechaFormateada  = `${dia}/${mes}/${anio}`;

    const estilo = estiloEstado(cita.estado);

    // Rellenar el contenido del panel
    document.getElementById('detalle-cliente').textContent   = `${cita.nombre_cliente} ${cita.apellido_cliente}`;
    document.getElementById('detalle-mascota').textContent   = cita.mascota;
    document.getElementById('detalle-servicio').textContent  = cita.nombre_servicio;
    document.getElementById('detalle-estilista').textContent = cita.nombre_estilista;
    document.getElementById('detalle-fecha').textContent     = fechaFormateada;
    document.getElementById('detalle-hora').textContent      = formatoHora12(cita.hora);
    document.getElementById('detalle-estado').innerHTML      =
        `<span class="${estilo.clase}"><i class="fa-solid ${estilo.icono}"></i> ${escaparHTML(cita.estado)}</span>`;

    // Mostrar el overlay y el panel con animación (clase 'open' en CSS)
    document.getElementById('modal-detalle-overlay').classList.add('open');
}

/**
 * Cierra el panel lateral de detalles.
 *
 * @returns {void}
 */
function cerrarDetalle() {
    document.getElementById('modal-detalle-overlay').classList.remove('open');
}

/**
 * Pide confirmación y cancela una cita. Si la API responde bien, muestra
 * un mensaje de éxito y recarga la página para refrescar tabla y totales.
 * La API rechaza cancelar citas que ya están Canceladas o Completadas.
 *
 * @param {number} id - id_cita
 * @returns {void}
 */
function cancelarCita(id) {
    modalConfirmar('¿Seguro que deseas cancelar esta cita?', function () {
        fetchAuth('${API_BASE}/api/admin/citas/cancelar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ id_cita: id })
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                modalExito('Cita cancelada correctamente.');
                setTimeout(() => location.reload(), 1500);
            } else {
                modalError('Error: ' + data.error);
            }
        });
    });
}

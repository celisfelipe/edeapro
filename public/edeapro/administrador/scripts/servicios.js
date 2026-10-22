/**
 * servicios.js — Panel Administrador / Servicios
 * ===============================================
 * Carga los servicios agrupados por categoría en un acordeón.
 * Permite editar el precio y la duración de cada servicio por raza.
 * Solo accesible con sesión de administrador (ver sesion.js).
 *
 * Conecta con la API de Laravel:
 *   GET  /api/admin/servicios        → cargar servicios
 *   POST /api/admin/servicios/editar → actualizar precio y duración
 *
 * Depende de: fetchToken.js (fetchAuth), sesion.js (verificarSesionAdmin, cerrarSesion),
 *             modal.js (modalExito, modalError).
 */

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;

    cargarServicios();

    // Clics dentro de los acordeones: un solo listener en el contenedor
    // (delegación). Los datos viajan en data-* y se leen con dataset.
    document.getElementById('contenedor-servicios').addEventListener('click', function (e) {
        const btnEditar = e.target.closest('.btn-editar');
        if (btnEditar) {
            const d = btnEditar.dataset;
            editarServicio(Number(d.idRaza), Number(d.idServicio), d.duracion, Number(d.precio));
            return;
        }

        const header = e.target.closest('.acordeon-header');
        if (header) toggleAcordeon(header.dataset.id);
    });

    // Filtrar razas por nombre dentro del acordeón que esté abierto
    document.getElementById('buscar-raza').addEventListener('input', function () {
        const termino = this.value.trim().toLowerCase();
        document.querySelectorAll('#contenedor-servicios .acordeon-body table tr').forEach(function (fila) {
            if (fila.querySelector('th')) return; // saltar la fila de encabezado
            const raza = fila.querySelector('td').textContent.toLowerCase();
            fila.style.display = raza.includes(termino) ? '' : 'none';
        });
    });
});

/**
 * Trae todos los servicios y los agrupa por categoría (nombre_servicio).
 * Cada categoría se muestra como un acordeón cerrado con la tabla de
 * razas (duración, precio y botón Editar) adentro.
 *
 * @returns {void}
 */
function cargarServicios() {
    fetchAuth('http://127.0.0.1:8000/api/admin/servicios')
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;

        // Agrupar los servicios por nombre_servicio (ej: "Pelo corto", "Gatos")
        const categorias = {};
        data.servicios.forEach(s => {
            if (!categorias[s.nombre_servicio]) {
                categorias[s.nombre_servicio] = [];
            }
            categorias[s.nombre_servicio].push(s);
        });

        const contenedor = document.getElementById('contenedor-servicios');
        contenedor.innerHTML = '';

        // Crear un acordeón por cada categoría de servicio
        Object.keys(categorias).forEach(cat => {
            const razas = categorias[cat];
            // Crear un id único para el acordeón a partir del nombre
            const id = cat.replace(/\s+/g, '-').toLowerCase();

            contenedor.innerHTML += `
                <div class="acordeon">
                    <div class="acordeon-header" data-id="${escaparHTML(id)}">
                        <span><i class="fa-solid fa-paw"></i> ${escaparHTML(cat)}</span>
                        <span class="badge">${razas.length} razas</span>
                        <span class="flecha" id="flecha-${escaparHTML(id)}"><i class="fa-solid fa-chevron-down"></i></span>
                    </div>
                    <div class="acordeon-body" id="body-${escaparHTML(id)}" style="display:none">
                        <table>
                            <tr>
                                <th>Raza</th>
                                <th>Duración</th>
                                <th>Precio</th>
                                <th>Acciones</th>
                            </tr>
                            ${razas.map(s => `
                                <tr>
                                    <td>${escaparHTML(s.nombre_raza)}</td>
                                    <td>${escaparHTML(s.duracion)}</td>
                                    <td>$${Number(s.precio).toLocaleString('es-CO')}</td>
                                    <td>
                                        <button class="btn btn-blue btn-editar"
                                            data-id-raza="${s.id_raza}"
                                            data-id-servicio="${s.id_servicio}"
                                            data-duracion="${escaparHTML(s.duracion)}"
                                            data-precio="${s.precio}"><i class="fa-solid fa-pen"></i> Editar</button>
                                    </td>
                                </tr>`).join('')}
                        </table>
                    </div>
                </div>`;
        });
    });
}

/**
 * Abre o cierra el cuerpo de un acordeón y gira su flecha (chevron) 180°.
 *
 * @param {string} id - id de la categoría (nombre en minúsculas con guiones)
 * @returns {void}
 */
function toggleAcordeon(id) {
    const body   = document.getElementById('body-' + id);
    const flecha = document.getElementById('flecha-' + id);
    if (body.style.display === 'none') {
        body.style.display = 'block';
        flecha.style.transform = 'rotate(180deg)';
    } else {
        body.style.display = 'none';
        flecha.style.transform = 'rotate(0deg)';
    }
}

/**
 * Abre el modal para editar el precio y la duración de un servicio.
 * El registro se identifica por la combinación id_raza + id_servicio.
 *
 * @param {number} id_raza
 * @param {number} id_servicio
 * @param {string} duracion - duración actual (ej. "45 min")
 * @param {number} precio   - precio actual
 * @returns {void}
 */
function editarServicio(id_raza, id_servicio, duracion, precio) {
    const overlay = document.getElementById('modal-editar-servicio');

    // Prellenar el modal con los valores actuales
    document.getElementById('edit-svc-duracion').value = duracion;
    document.getElementById('edit-svc-precio').value   = precio;
    overlay.classList.add('open');

    document.getElementById('edit-servicio-ok').onclick = function () {
        fetchAuth('http://127.0.0.1:8000/api/admin/servicios/editar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                id_raza,
                id_servicio,
                duracion: document.getElementById('edit-svc-duracion').value,
                precio:   document.getElementById('edit-svc-precio').value
            })
        })
        .then(res => res.json())
        .then(data => {
            overlay.classList.remove('open');
            if (data.ok) {
                cargarServicios(); // Refrescar el acordeón con los nuevos datos
                modalExito('Servicio actualizado correctamente.');
            } else {
                modalError('Error: ' + data.error);
            }
        });
    };

    document.getElementById('edit-servicio-cancel').onclick = function () {
        overlay.classList.remove('open');
    };
}

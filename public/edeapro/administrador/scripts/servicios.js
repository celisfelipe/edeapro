/**
 * servicios.js — Panel Administrador / Servicios
 */

function cargarCheckboxesServicios() {
    fetchAuth(`${API_BASE}/api/admin/servicios/lista-categorias`)
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;
        const contenedor = document.getElementById('servicios-checkboxes');
        contenedor.innerHTML = data.servicios.map(s => `
            <div style="border:1px solid #ddd; border-radius:8px; padding:10px; margin-bottom:8px;">
                <label style="display:flex; align-items:center; gap:8px; font-weight:600; cursor:pointer;">
                    <input type="checkbox" class="chk-servicio" data-id="${s.id_servicio}" value="${s.id_servicio}">
                    ${escaparHTML(s.nombre_servicio)}
                </label>
                <div class="campos-servicio" data-id="${s.id_servicio}" style="display:none; margin-top:8px;">
                    <div class="modal-form-group" style="margin-bottom:6px;">
                        <label>Precio</label>
                        <input type="number" class="campo-precio" data-id="${s.id_servicio}" placeholder="Ej: 50000">
                    </div>
                    <div class="modal-form-group">
                        <label>Duración</label>
                        <input type="text" class="campo-duracion" data-id="${s.id_servicio}" placeholder="Ej: 60 min">
                    </div>
                </div>
            </div>
        `).join('');

        contenedor.querySelectorAll('.chk-servicio').forEach(chk => {
            chk.addEventListener('change', function() {
                const campos = contenedor.querySelector(`.campos-servicio[data-id="${this.dataset.id}"]`);
                campos.style.display = this.checked ? 'block' : 'none';
            });
        });
    });
}

function cargarServicios() {
    fetchAuth(`${API_BASE}/api/admin/servicios`)
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;

        const categorias = {};
        data.servicios.forEach(s => {
            if (!categorias[s.nombre_servicio]) {
                categorias[s.nombre_servicio] = [];
            }
            categorias[s.nombre_servicio].push(s);
        });

        const contenedor = document.getElementById('contenedor-servicios');
        contenedor.innerHTML = '';

        Object.keys(categorias).forEach(cat => {
            const razas = categorias[cat];
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
                                        <button class="btn btn-red btn-eliminar-svc"
                                            data-id-raza="${s.id_raza}"
                                            data-nombre="${escaparHTML(s.nombre_raza)}"><i class="fa-solid fa-trash"></i> Eliminar</button>
                                    </td>
                                </tr>`).join('')}
                        </table>
                    </div>
                </div>`;
        });
    });
}

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

function editarServicio(id_raza, id_servicio, duracion, precio) {
    const overlay = document.getElementById('modal-editar-servicio');

    document.getElementById('edit-svc-duracion').value = duracion;
    document.getElementById('edit-svc-precio').value   = precio;
    overlay.classList.add('open');

    document.getElementById('edit-servicio-ok').onclick = function () {
        fetchAuth(`${API_BASE}/api/admin/servicios/editar`, {
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
                cargarServicios();
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

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;

    cargarServicios();

    document.getElementById('contenedor-servicios').addEventListener('click', function (e) {
        const btnEditar = e.target.closest('.btn-editar');
        if (btnEditar) {
            const d = btnEditar.dataset;
            editarServicio(Number(d.idRaza), Number(d.idServicio), d.duracion, Number(d.precio));
            return;
        }

        const btnEliminar = e.target.closest('.btn-eliminar-svc');
        if (btnEliminar) {
            const nombre = btnEliminar.dataset.nombre;
            const id     = btnEliminar.dataset.idRaza;
            if (!confirm(`¿Seguro que quieres eliminar la raza "${nombre}"? Se eliminará de todos los servicios.`)) return;
            fetchAuth(`${API_BASE}/api/admin/servicios/eliminar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ id_raza: id })
            })
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    cargarServicios();
                    modalExito('Raza eliminada correctamente.');
                } else {
                    modalError('Error: ' + data.error);
                }
            });
            return;
        }

        const header = e.target.closest('.acordeon-header');
        if (header) toggleAcordeon(header.dataset.id);
    });

    document.getElementById('buscar-raza').addEventListener('input', function () {
        const termino = this.value.trim().toLowerCase();
        document.querySelectorAll('#contenedor-servicios .acordeon-body table tr').forEach(function (fila) {
            if (fila.querySelector('th')) return;
            const raza = fila.querySelector('td').textContent.toLowerCase();
            fila.style.display = raza.includes(termino) ? '' : 'none';
        });
    });

    document.getElementById('btn-nuevo-servicio').addEventListener('click', function () {
        document.getElementById('nuevo-svc-nombre').value = '';
        cargarCheckboxesServicios();
        document.getElementById('modal-nuevo-servicio').classList.add('open');
    });

    document.getElementById('nuevo-servicio-cancel').addEventListener('click', function () {
        document.getElementById('modal-nuevo-servicio').classList.remove('open');
    });

    document.getElementById('nuevo-servicio-ok').addEventListener('click', function () {
        const nombre = document.getElementById('nuevo-svc-nombre').value.trim();
        if (!nombre) { modalError('Ingresa el nombre de la raza.'); return; }

        const seleccionados = [];
        document.querySelectorAll('.chk-servicio:checked').forEach(chk => {
            const id = chk.dataset.id;
            const precio   = document.querySelector(`.campo-precio[data-id="${id}"]`).value;
            const duracion = document.querySelector(`.campo-duracion[data-id="${id}"]`).value;
            if (!precio || !duracion) return;
            seleccionados.push({ id_servicio: id, precio, duracion });
        });

        if (seleccionados.length === 0) {
            modalError('Marca al menos un servicio con precio y duración.');
            return;
        }

        fetchAuth(`${API_BASE}/api/admin/servicios/agregar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_raza: nombre, servicios: seleccionados })
        })
        .then(res => res.json())
        .then(data => {
            document.getElementById('modal-nuevo-servicio').classList.remove('open');
            if (data.ok) {
                cargarServicios();
                modalExito('Raza creada correctamente.');
            } else {
                modalError('Error: ' + data.error);
            }
        });
    });
});

// ── ADICIONALES ───────────────────────────────────────────────
// Extras como corte de uñas o un shampoo especial. Lo que se crea aquí
// aparece solo en la agenda del cliente (pestaña "Adicionales") y en Pagos.

/** Adicional que se está editando en el modal (null = crear uno nuevo) */
let adicionalEditando = null;

/**
 * Pide los adicionales al servidor y llena la tabla #tabla-adicionales.
 * Un adicional que ya se usó en citas no muestra el botón de eliminar.
 * @returns {void}
 */
function cargarAdicionales() {
    fetchAuth(`${API_BASE}/api/admin/adicionales`)
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('tabla-adicionales');
        if (!data.ok) return;

        if (data.adicionales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No hay adicionales. Crea el primero con "Nuevo adicional".</td></tr>';
            return;
        }

        tbody.innerHTML = data.adicionales.map(a => `
            <tr>
                <td>${escaparHTML(a.nombre_adicional)}</td>
                <td>$${Number(a.precio_adicional).toLocaleString('es-CO')}</td>
                <td>20 min</td>
                <td class="acciones-cell">
                    <button class="btn btn-blue btn-editar-adicional"
                            data-id="${a.id_adicional}"
                            data-nombre="${escaparHTML(a.nombre_adicional)}"
                            data-precio="${Number(a.precio_adicional)}"><i class="fa-solid fa-pen"></i> Editar</button>
                    ${Number(a.usos) === 0
                        ? `<button class="btn btn-red btn-eliminar-adicional"
                                   data-id="${a.id_adicional}"
                                   data-nombre="${escaparHTML(a.nombre_adicional)}"><i class="fa-solid fa-trash"></i> Eliminar</button>`
                        : ''}
                </td>
            </tr>`).join('');
    });
}

/**
 * Abre el modal del adicional: vacío para crear, o con sus datos para editar.
 * @param {{id: number, nombre: string, precio: number}|null} adicional
 * @returns {void}
 */
function abrirModalAdicional(adicional) {
    adicionalEditando = adicional;
    document.getElementById('adicional-titulo').textContent = adicional ? 'Editar adicional' : 'Nuevo adicional';
    document.getElementById('adicional-nombre').value = adicional ? adicional.nombre : '';
    document.getElementById('adicional-precio').value = adicional ? adicional.precio : '';
    document.getElementById('modal-adicional').classList.add('open');
}

/**
 * Guarda el adicional del modal (crea o edita) y recarga la tabla.
 * El servidor vuelve a validar nombre y precio.
 * @returns {void}
 */
function guardarAdicional() {
    const nombre = document.getElementById('adicional-nombre').value.trim();
    const precio = document.getElementById('adicional-precio').value;

    if (!nombre) { modalError('Escribe el nombre del adicional.'); return; }
    if (!precio || Number(precio) <= 0) { modalError('Escribe un precio mayor que 0.'); return; }

    const datos = { nombre, precio };
    let url = `${API_BASE}/api/admin/adicionales/agregar`;
    if (adicionalEditando) {
        url = `${API_BASE}/api/admin/adicionales/editar`;
        datos.id_adicional = adicionalEditando.id;
    }

    fetchAuth(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(datos)
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            document.getElementById('modal-adicional').classList.remove('open');
            cargarAdicionales();
            modalExito(adicionalEditando ? 'Adicional actualizado.' : 'Adicional creado. Ya aparece en la agenda.');
        } else {
            modalError(data.error);
        }
    });
}

/**
 * Elimina un adicional después de confirmar. El servidor no deja borrar
 * uno que ya se usó en citas.
 * @param {number} id
 * @param {string} nombre
 * @returns {void}
 */
function eliminarAdicional(id, nombre) {
    modalConfirmar(`¿Eliminar el adicional "${nombre}"?`, function () {
        fetchAuth(`${API_BASE}/api/admin/adicionales/eliminar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ id_adicional: id })
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                cargarAdicionales();
                modalExito('Adicional eliminado.');
            } else {
                modalError(data.error);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;

    cargarAdicionales();

    document.getElementById('btn-nuevo-adicional').addEventListener('click', () => abrirModalAdicional(null));
    document.getElementById('adicional-cancel').addEventListener('click', () => {
        document.getElementById('modal-adicional').classList.remove('open');
    });
    document.getElementById('adicional-ok').addEventListener('click', guardarAdicional);

    // Botones de cada fila (la tabla se vuelve a pintar, por eso se escucha en el tbody)
    document.getElementById('tabla-adicionales').addEventListener('click', function (e) {
        const editar = e.target.closest('.btn-editar-adicional');
        if (editar) {
            const d = editar.dataset;
            abrirModalAdicional({ id: Number(d.id), nombre: d.nombre, precio: Number(d.precio) });
            return;
        }
        const eliminar = e.target.closest('.btn-eliminar-adicional');
        if (eliminar) eliminarAdicional(Number(eliminar.dataset.id), eliminar.dataset.nombre);
    });
});
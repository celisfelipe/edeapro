/**
 * servicios.js — Panel Administrador / Servicios
 * ===============================================
 * Carga los servicios agrupados por categoría en un acordeón.
 * Permite editar el precio y la duración de cada servicio por raza.
 * Verifica que el usuario tenga rol "administrador" en localStorage.
 *
 * Conecta con la API de Laravel:
 *   GET  /api/admin/servicios        → cargar servicios
 *   POST /api/admin/servicios/editar → actualizar precio y duración
 */

document.addEventListener('DOMContentLoaded', function () {

    const user = JSON.parse(localStorage.getItem('user'));
    const rol  = localStorage.getItem('rol');

    if (!user || rol !== 'administrador') {
        window.location.href = '../../paginas/login.html';
        return;
    }

    document.getElementById('nombre-admin').textContent = user.nombre_estilista + ' ' + user.apellido_estilista;

    cargarServicios();
});

/**
 * Trae todos los servicios y los agrupa por categoría (nombre_servicio).
 * Cada categoría se muestra como un acordeón con tabla de razas adentro.
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
                    <div class="acordeon-header" onclick="toggleAcordeon('${id}')">
                        <span>📋 ${cat}</span>
                        <span class="badge">${razas.length} razas</span>
                        <span class="flecha" id="flecha-${id}">▶</span>
                    </div>
                    <div class="acordeon-body" id="body-${id}" style="display:none">
                        <table>
                            <tr>
                                <th>Raza</th>
                                <th>Duración</th>
                                <th>Precio</th>
                                <th>Acciones</th>
                            </tr>
                            ${razas.map(s => `
                                <tr>
                                    <td>${s.nombre_raza}</td>
                                    <td>${s.duracion}</td>
                                    <td>$${Number(s.precio).toLocaleString('es-CO')}</td>
                                    <td>
                                        <button class="btn btn-blue" onclick="editarServicio(${s.id_raza}, ${s.id_servicio}, '${s.duracion}', ${s.precio})">Editar</button>
                                    </td>
                                </tr>`).join('')}
                        </table>
                    </div>
                </div>`;
        });
    });
}

/**
 * Abre o cierra el cuerpo de un acordeón.
 * También cambia la flecha de ▶ a ▼ y viceversa.
 */
function toggleAcordeon(id) {
    const body   = document.getElementById('body-' + id);
    const flecha = document.getElementById('flecha-' + id);
    if (body.style.display === 'none') {
        body.style.display = 'block';
        flecha.textContent = '▼';
    } else {
        body.style.display = 'none';
        flecha.textContent = '▶';
    }
}

/**
 * Abre el modal para editar el precio y la duración de un servicio.
 * Se identifica el servicio por la combinación id_raza + id_servicio.
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

/** Elimina la sesión del localStorage y redirige al login */
function cerrarSesion() {
    localStorage.removeItem('user');
    localStorage.removeItem('rol');
    window.location.href = '../../paginas/login.html';
}

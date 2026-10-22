/**
 * clientes.js — Panel Administrador / Clientes
 * =============================================
 * Carga la lista de clientes con buscador en tiempo real.
 * Permite editar datos (modal) y eliminar clientes (con confirmación).
 * Solo accesible con sesión de administrador (ver sesion.js).
 *
 * Conecta con la API de Laravel:
 *   GET  /api/admin/clientes          → cargar todos los clientes
 *   POST /api/admin/clientes/editar   → actualizar datos de un cliente
 *   POST /api/admin/clientes/eliminar → eliminar cliente y sus datos
 *
 * Depende de: fetchToken.js (fetchAuth), sesion.js (verificarSesionAdmin, cerrarSesion),
 *             modal.js (modalExito, modalError, modalConfirmar).
 */

// Guarda todos los clientes para poder filtrar sin ir al servidor cada vez
let todosLosClientes = [];

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;

    cargarClientes();

    // Botón "Editar" de cada fila: un solo listener en el <tbody> (delegación).
    // Los datos viajan en data-* y se leen con dataset, así un nombre con
    // comillas o apóstrofes (ej. O'Brien) ya no rompe el botón.
    document.getElementById('tabla-clientes').addEventListener('click', function (e) {
        const btn = e.target.closest('.btn-editar');
        if (!btn) return;
        const d = btn.dataset;
        editarCliente(Number(d.id), d.nombre, d.apellido, d.telefono, d.correo);
    });

    // Filtrar la tabla en tiempo real mientras el usuario escribe
    document.getElementById('buscador').addEventListener('input', function () {
        const texto = this.value.toLowerCase();
        const filtrados = todosLosClientes.filter(c =>
            c.nombre.toLowerCase().includes(texto)   ||
            c.apellido.toLowerCase().includes(texto) ||
            c.telefono.includes(texto)               ||
            c.correo.toLowerCase().includes(texto)
        );
        mostrarClientes(filtrados);
    });
});

/**
 * Trae todos los clientes desde Laravel, los guarda en todosLosClientes
 * (para que el buscador filtre sin volver al servidor) y los muestra.
 *
 * @returns {void}
 */
function cargarClientes() {
    fetchAuth('http://127.0.0.1:8000/api/admin/clientes')
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            todosLosClientes = data.clientes; // Guardar para el buscador
            mostrarClientes(todosLosClientes);
        }
    })
    .catch(() => {
        document.getElementById('tabla-clientes').innerHTML = '<tr><td colspan="4">Error cargando clientes</td></tr>';
    });
}

/**
 * Dibuja una lista de clientes en #tabla-clientes, con los botones
 * Editar y Eliminar en cada fila.
 *
 * @param {Object[]} clientes - clientes a mostrar (todos o ya filtrados)
 * @returns {void}
 */
function mostrarClientes(clientes) {
    const tbody = document.getElementById('tabla-clientes');
    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No se encontraron clientes</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    clientes.forEach(c => {
        tbody.innerHTML += `
            <tr>
                <td>${escaparHTML(c.nombre)} ${escaparHTML(c.apellido)}</td>
                <td>${escaparHTML(c.telefono)}</td>
                <td>${escaparHTML(c.correo)}</td>
                <td>
                    <button class="btn btn-blue btn-editar"
                        data-id="${c.id_cliente}"
                        data-nombre="${escaparHTML(c.nombre)}"
                        data-apellido="${escaparHTML(c.apellido)}"
                        data-telefono="${escaparHTML(c.telefono)}"
                        data-correo="${escaparHTML(c.correo)}"><i class="fa-solid fa-pen"></i> Editar</button>
                    <button class="btn btn-red" onclick="eliminarCliente(${c.id_cliente})"><i class="fa-solid fa-trash"></i> Eliminar</button>
                </td>
            </tr>`;
    });
}

/**
 * Abre el modal de edición con los datos actuales del cliente.
 * Al guardar, envía los nuevos datos a Laravel y refresca la tabla.
 *
 * @param {number} id       - id_cliente
 * @param {string} nombre
 * @param {string} apellido
 * @param {string} telefono
 * @param {string} correo
 * @returns {void}
 */
function editarCliente(id, nombre, apellido, telefono, correo) {
    const overlay = document.getElementById('modal-editar-cliente');

    // Prellenar el formulario del modal con los datos actuales
    document.getElementById('edit-nombre').value   = nombre;
    document.getElementById('edit-apellido').value = apellido;
    document.getElementById('edit-telefono').value = telefono;
    document.getElementById('edit-correo').value   = correo;
    overlay.classList.add('open');

    // Al confirmar, enviar los datos actualizados a Laravel
    document.getElementById('edit-cliente-ok').onclick = function () {
        const nombre   = document.getElementById('edit-nombre').value;
        const apellido = document.getElementById('edit-apellido').value;
        const telefono = document.getElementById('edit-telefono').value;
        const correo   = document.getElementById('edit-correo').value;

        const vNombre   = validarNombre(nombre, 'El nombre');
        if (!vNombre.ok)   { modalError(vNombre.error);   return; }

        const vApellido = validarNombre(apellido, 'El apellido');
        if (!vApellido.ok) { modalError(vApellido.error); return; }

        const vTel      = validarTelefono(telefono);
        if (!vTel.ok)      { modalError(vTel.error);      return; }

        const vCorreo   = validarCorreo(correo);
        if (!vCorreo.ok)   { modalError(vCorreo.error);   return; }
        
        fetchAuth('http://127.0.0.1:8000/api/admin/clientes/editar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                id_cliente: id,
                nombre:   document.getElementById('edit-nombre').value,
                apellido: document.getElementById('edit-apellido').value,
                telefono: document.getElementById('edit-telefono').value,
                correo:   document.getElementById('edit-correo').value
            })
        })
        .then(res => res.json())
        .then(data => {
            overlay.classList.remove('open');
            if (data.ok) {
                cargarClientes(); // Refrescar la tabla con los datos nuevos
                modalExito('Cliente actualizado correctamente.');
            } else {
                modalError('Error: ' + data.error);
            }
        });
    };

    // Cerrar el modal sin guardar
    document.getElementById('edit-cliente-cancel').onclick = function () {
        overlay.classList.remove('open');
    };
}

/**
 * Pide confirmación y elimina un cliente. Laravel borra también todos
 * sus datos relacionados (citas, mascotas, pagos, notificaciones).
 *
 * @param {number} id - id_cliente
 * @returns {void}
 */
function eliminarCliente(id) {
    modalConfirmar('¿Seguro que deseas eliminar este cliente? Esta acción no se puede deshacer.', function () {
        fetchAuth('http://127.0.0.1:8000/api/admin/clientes/eliminar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ id_cliente: id })
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                modalExito('Cliente eliminado correctamente.');
                setTimeout(() => location.reload(), 1500);
            } else {
                modalError('Error: ' + data.error);
            }
        });
    });
}

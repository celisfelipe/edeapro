/**
 * clientes.js — Panel Administrador / Clientes
 * =============================================
 * Carga la lista de clientes con buscador en tiempo real.
 * Permite editar datos (modal) y eliminar clientes (con confirmación).
 * Verifica que el usuario tenga rol "administrador" en localStorage.
 *
 * Conecta con la API de Laravel:
 *   GET  /api/admin/clientes          → cargar todos los clientes
 *   POST /api/admin/clientes/editar   → actualizar datos de un cliente
 *   POST /api/admin/clientes/eliminar → eliminar cliente y sus datos
 */

// Guarda todos los clientes para poder filtrar sin ir al servidor cada vez
let todosLosClientes = [];

document.addEventListener('DOMContentLoaded', function () {

    const user = JSON.parse(localStorage.getItem('user'));
    const rol  = localStorage.getItem('rol');

    if (!user || rol !== 'administrador') {
        window.location.href = '../../paginas/login.html';
        return;
    }

    document.getElementById('nombre-admin').textContent = user.nombre_estilista + ' ' + user.apellido_estilista;

    cargarClientes();

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

/** Trae todos los clientes desde Laravel y los muestra en la tabla */
function cargarClientes() {
    fetch('http://127.0.0.1:8000/api/admin/clientes')
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

/** Renderiza el array de clientes en la tabla del HTML */
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
                <td>${c.nombre} ${c.apellido}</td>
                <td>${c.telefono}</td>
                <td>${c.correo}</td>
                <td>
                    <button class="btn btn-blue" onclick="editarCliente(${c.id_cliente}, '${c.nombre}', '${c.apellido}', '${c.telefono}', '${c.correo}')">Editar</button>
                    <button class="btn btn-red" onclick="eliminarCliente(${c.id_cliente})">Eliminar</button>
                </td>
            </tr>`;
    });
}

/**
 * Abre el modal de edición con los datos actuales del cliente.
 * Al guardar, envía los nuevos datos a Laravel y refresca la tabla.
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
        fetch('http://127.0.0.1:8000/api/admin/clientes/editar', {
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
 * Pide confirmación antes de eliminar.
 * Laravel elimina el cliente y todos sus datos relacionados
 * (citas, mascotas, pagos, notificaciones).
 */
function eliminarCliente(id) {
    modalConfirmar('¿Seguro que deseas eliminar este cliente? Esta acción no se puede deshacer.', function () {
        fetch('http://127.0.0.1:8000/api/admin/clientes/eliminar', {
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

/** Elimina la sesión del localStorage y redirige al login */
function cerrarSesion() {
    localStorage.removeItem('user');
    localStorage.removeItem('rol');
    window.location.href = '../../paginas/login.html';
}

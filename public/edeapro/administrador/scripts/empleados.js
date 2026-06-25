/**
 * empleados.js — Panel Administrador / Empleados
 * ===============================================
 * Carga la lista de estilistas y permite agregar, editar y eliminar.
 * Verifica que el usuario tenga rol "administrador" en localStorage.
 *
 * Conecta con la API de Laravel:
 *   GET  /api/admin/empleados          → cargar estilistas
 *   POST /api/admin/empleados/agregar  → registrar nuevo estilista
 *   POST /api/admin/empleados/editar   → editar datos de un estilista
 *   POST /api/admin/empleados/eliminar → eliminar estilista
 */

document.addEventListener('DOMContentLoaded', function () {

    const user = JSON.parse(localStorage.getItem('user'));
    const rol  = localStorage.getItem('rol');

    if (!user || rol !== 'administrador') {
        window.location.href = '../../paginas/login.html';
        return;
    }

    document.getElementById('nombre-admin').textContent = user.nombre_estilista + ' ' + user.apellido_estilista;

    cargarEmpleados();
});

/** Trae todos los estilistas desde Laravel y los muestra en la tabla */
function cargarEmpleados() {
    fetchAuth('http://127.0.0.1:8000/api/admin/empleados')
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;
        const tbody = document.getElementById('tabla-empleados');
        if (data.empleados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No hay empleados registrados</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        data.empleados.forEach(e => {
            const iniciales   = ((e.nombre_estilista || '')[0] || '') + ((e.apellido_estilista || '')[0] || '');
            const rolClase    = e.rol === 'Administrador' ? 'rol-administrador' : 'rol-peluquero';
            const rolIcono    = e.rol === 'Administrador' ? 'fa-user-shield' : 'fa-scissors';
            const estadoClase = e.estado === 'Activo' ? 'activo' : 'inactivo';
            tbody.innerHTML += `
                <tr>
                    <td>
                        <div class="cliente-info">
                            <span class="avatar-circle">${iniciales.toUpperCase()}</span>
                            ${e.nombre_estilista} ${e.apellido_estilista}
                        </div>
                    </td>
                    <td><span class="badge-rol ${rolClase}"><i class="fa-solid ${rolIcono}"></i> ${e.rol}</span></td>
                    <td>${e.telefono_estilista}</td>
                    <td>${e.correo}</td>
                    <td><span class="badge-estado"><span class="dot ${estadoClase}"></span> ${e.estado}</span></td>
                    <td>
                        <button class="btn btn-blue" onclick="editarEstilista(${e.id_estilista}, '${e.nombre_estilista}', '${e.apellido_estilista}', '${e.telefono_estilista}', '${e.correo}', '${e.rol}')"><i class="fa-solid fa-pen"></i> Editar</button>
                        <button class="btn btn-red" onclick="eliminarEmpleado(${e.id_estilista})"><i class="fa-solid fa-trash"></i> Eliminar</button>
                    </td>
                </tr>`;
        });
    });
}

/** Muestra el formulario para agregar un nuevo estilista */
function mostrarFormulario() {
    document.getElementById('formulario').style.display = 'block';
}

/** Oculta el formulario de agregar sin guardar */
function ocultarFormulario() {
    document.getElementById('formulario').style.display = 'none';
}

/**
 * Valida los campos del formulario y envía el nuevo estilista a Laravel.
 * El estilista se crea con estado 'Activo' y disponibilidad 'Disponible' por defecto.
 */
function agregarEmpleado() {
    const nombre     = document.getElementById('inp-nombre').value;
    const apellido   = document.getElementById('inp-apellido').value;
    const telefono   = document.getElementById('inp-telefono').value;
    const correo     = document.getElementById('inp-correo').value;
    const contrasena = document.getElementById('inp-contrasena').value;
    const rol        = document.getElementById('inp-rol').value;

    if (!nombre || !apellido || !telefono || !correo || !contrasena) {
        modalError('Completa todos los campos.');
        return;
    }

    fetchAuth('http://127.0.0.1:8000/api/admin/empleados/agregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ nombre, apellido, telefono, correo, contrasena, rol })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            modalExito('Empleado registrado correctamente.');
            ocultarFormulario();
            cargarEmpleados(); // Refrescar la tabla
        } else {
            modalError('Error: ' + data.error);
        }
    });
}

/**
 * Abre el modal de edición con los datos actuales del estilista.
 * El rol no se puede cambiar desde aquí (se envía el mismo que tenía).
 */
function editarEstilista(id, nombre, apellido, telefono, correo, rol) {
    const overlay = document.getElementById('modal-editar-empleado');

    // Prellenar el formulario con los datos actuales
    document.getElementById('edit-emp-nombre').value   = nombre;
    document.getElementById('edit-emp-apellido').value = apellido;
    document.getElementById('edit-emp-telefono').value = telefono;
    document.getElementById('edit-emp-correo').value   = correo;
    overlay.classList.add('open');

    document.getElementById('edit-empleado-ok').onclick = function () {
        fetchAuth('http://127.0.0.1:8000/api/admin/empleados/editar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                id_estilista: id,
                nombre:   document.getElementById('edit-emp-nombre').value,
                apellido: document.getElementById('edit-emp-apellido').value,
                telefono: document.getElementById('edit-emp-telefono').value,
                correo:   document.getElementById('edit-emp-correo').value,
                rol:      rol // Conservar el rol original
            })
        })
        .then(res => res.json())
        .then(data => {
            overlay.classList.remove('open');
            if (data.ok) {
                modalExito('Empleado actualizado correctamente.');
                setTimeout(() => cargarEmpleados(), 500);
            } else {
                modalError('Error: ' + data.error);
            }
        });
    };

    document.getElementById('edit-empleado-cancel').onclick = function () {
        overlay.classList.remove('open');
    };
}

/** Pide confirmación antes de eliminar el estilista */
function eliminarEmpleado(id) {
    modalConfirmar('¿Seguro que deseas eliminar este empleado?', function () {
        fetchAuth('http://127.0.0.1:8000/api/admin/empleados/eliminar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ id_estilista: id })
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                modalExito('Empleado eliminado correctamente.');
                setTimeout(() => cargarEmpleados(), 500);
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

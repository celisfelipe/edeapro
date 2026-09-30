/**
 * empleados.js — Panel Administrador / Empleados
 * ===============================================
 * Carga la lista de estilistas y permite agregar, editar y eliminar.
 * Solo accesible con sesión de administrador (ver sesion.js).
 *
 * Conecta con la API de Laravel:
 *   GET  /api/admin/empleados          → cargar estilistas
 *   POST /api/admin/empleados/agregar  → registrar nuevo estilista
 *   POST /api/admin/empleados/editar   → editar datos de un estilista
 *   POST /api/admin/empleados/eliminar → eliminar estilista
 *
 * Depende de: fetchToken.js (fetchAuth), sesion.js (verificarSesionAdmin, cerrarSesion),
 *             modal.js (modalExito, modalError, modalConfirmar).
 */

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;

    cargarEmpleados();
});

/**
 * Trae todos los estilistas desde Laravel y los dibuja en #tabla-empleados
 * con avatar de iniciales, badge de rol, estado y botones Editar/Eliminar.
 *
 * @returns {void}
 */
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

/** Muestra el formulario para agregar un nuevo estilista. */
function mostrarFormulario() {
    document.getElementById('formulario').style.display = 'block';
}

/** Oculta el formulario de agregar, sin guardar. */
function ocultarFormulario() {
    document.getElementById('formulario').style.display = 'none';
}

/**
 * Valida los campos del formulario y envía el nuevo estilista a Laravel.
 * Se crea con estado 'Activo' y disponibilidad 'Disponible' por defecto;
 * la contraseña se guarda con hash en el servidor.
 *
 * @returns {void}
 */
function agregarEmpleado() {
    const nombre     = document.getElementById('inp-nombre').value;
    const apellido   = document.getElementById('inp-apellido').value;
    const telefono   = document.getElementById('inp-telefono').value;
    const correo     = document.getElementById('inp-correo').value;
    const contrasena = document.getElementById('inp-contrasena').value;
    const rol        = document.getElementById('inp-rol').value;

    const vNombre   = validarNombre(nombre, 'El nombre');
    if (!vNombre.ok)   { modalError(vNombre.error);   return; }

    const vApellido = validarNombre(apellido, 'El apellido');
    if (!vApellido.ok) { modalError(vApellido.error); return; }

    const vTel      = validarTelefono(telefono);
    if (!vTel.ok)      { modalError(vTel.error);      return; }

    const vCorreo   = validarCorreo(correo);
    if (!vCorreo.ok)   { modalError(vCorreo.error);   return; }

    const vPass     = validarContrasena(contrasena);
    if (!vPass.ok)     { modalError(vPass.error);     return; }

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
 * El rol no se puede cambiar desde aquí: se reenvía el que ya tenía.
 *
 * @param {number} id       - id_estilista
 * @param {string} nombre
 * @param {string} apellido
 * @param {string} telefono
 * @param {string} correo
 * @param {string} rol      - 'Administrador' | 'Peluquero'
 * @returns {void}
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
        const nombre   = document.getElementById('edit-emp-nombre').value;
        const apellido = document.getElementById('edit-emp-apellido').value;
        const telefono = document.getElementById('edit-emp-telefono').value;
        const correo   = document.getElementById('edit-emp-correo').value;

        const vNombre   = validarNombre(nombre, 'El nombre');
        if (!vNombre.ok)   { modalError(vNombre.error);   return; }

        const vApellido = validarNombre(apellido, 'El apellido');
        if (!vApellido.ok) { modalError(vApellido.error); return; }

        const vTel      = validarTelefono(telefono);
        if (!vTel.ok)      { modalError(vTel.error);      return; }

        const vCorreo   = validarCorreo(correo);
        if (!vCorreo.ok)   { modalError(vCorreo.error);   return; }
        
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

/**
 * Pide confirmación y elimina un estilista. La API lo rechaza si el
 * estilista tiene citas Pendientes o Reagendadas.
 *
 * @param {number} id - id_estilista
 * @returns {void}
 */
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

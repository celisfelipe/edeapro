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

/** Selectores de foto del formulario "Nuevo estilista" y del modal de edición */
let selectorFotoNuevo  = null;
let selectorFotoEditar = null;

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;

    // Se crean una sola vez: los listeners no se acumulan al reabrir el modal
    selectorFotoNuevo  = iniciarSelectorFoto('inp-foto');
    selectorFotoEditar = iniciarSelectorFoto('edit-emp-foto');

    // Botón "Editar" de cada tarjeta: un solo listener en el grid (delegación).
    // Los datos viajan en data-* y se leen con dataset (data-foto-url → fotoUrl).
    document.getElementById('grid-empleados').addEventListener('click', function (e) {
        const btn = e.target.closest('.btn-editar');
        if (!btn) return;
        const d = btn.dataset;
        editarEstilista(Number(d.id), d.nombre, d.apellido, d.telefono, d.correo, d.rol, d.estado, d.fotoUrl);
    });

    cargarEmpleados();
});

/**
 * Conecta un bloque .emp-foto-picker: vista previa, botón "Subir foto"
 * (label del input) y botón "Eliminar foto", visible solo si hay imagen.
 * Usa los ids {prefijo}, {prefijo}-preview y {prefijo}-eliminar.
 *
 * El archivo elegido sigue viviendo en el <input type="file">, así que
 * agregarEmpleado() y editarEstilista() lo leen igual que antes.
 *
 * @param {string} prefijo - id del input de archivo ('inp-foto' | 'edit-emp-foto')
 * @returns {{cargar: function(?string), reset: function(), fotoEliminada: function(): boolean}}
 */
function iniciarSelectorFoto(prefijo) {
    const input      = document.getElementById(prefijo);
    const preview    = document.getElementById(prefijo + '-preview');
    const btnElim    = document.getElementById(prefijo + '-eliminar');
    const textoSubir = document.querySelector(`label[for="${prefijo}"] span`);

    let urlGuardada = null;   // foto que ya tiene el estilista en el servidor
    let urlTemporal = null;   // object URL de la imagen recién elegida
    let eliminada   = false;  // el admin quitó la foto guardada

    // Libera la vista previa anterior para no acumular blobs en memoria
    function liberarUrlTemporal() {
        if (urlTemporal) {
            URL.revokeObjectURL(urlTemporal);
            urlTemporal = null;
        }
    }

    // Pinta la vista previa y ajusta los botones según haya imagen o no
    function mostrar(url) {
        if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Vista previa de la foto';
            preview.replaceChildren(img);
        } else {
            const icono = document.createElement('i');
            icono.className = 'fa-solid fa-user';
            preview.replaceChildren(icono);
        }
        btnElim.hidden = !url;
        textoSubir.textContent = url ? 'Cambiar foto' : 'Subir foto';
    }

    input.addEventListener('change', function () {
        liberarUrlTemporal();
        const archivo = input.files[0];
        if (archivo) {
            urlTemporal = URL.createObjectURL(archivo);
            mostrar(urlTemporal);
        } else {
            // Se canceló el diálogo: volver a lo que había antes
            mostrar(eliminada ? null : urlGuardada);
        }
    });

    btnElim.addEventListener('click', function () {
        input.value = '';
        liberarUrlTemporal();
        if (urlGuardada) eliminada = true;
        mostrar(null);
    });

    function reset() {
        input.value = '';
        liberarUrlTemporal();
        urlGuardada = null;
        eliminada   = false;
        mostrar(null);
    }

    return {
        /** Deja el selector limpio y muestra la foto actual (o ninguna) */
        cargar(url) {
            reset();
            urlGuardada = url || null;
            mostrar(urlGuardada);
        },
        reset,
        /** true si hay que pedir al servidor que borre la foto guardada */
        fotoEliminada() {
            return eliminada && input.files.length === 0;
        }
    };
}

/**
 * Trae todos los estilistas desde Laravel y los dibuja en #tabla-empleados
 * con avatar de iniciales, badge de rol, estado y botones Editar/Eliminar.
 *
 * @returns {void}
 */
function cargarEmpleados() {
    fetchAuth('${API_BASE}/api/admin/empleados')
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;

        const grid = document.getElementById('grid-empleados');

        if (data.empleados.length === 0) {
            grid.innerHTML = '<p class="emp-cargando">No hay estilistas registrados.</p>';
            return;
        }

        grid.innerHTML = '';

        data.empleados.forEach(e => {
            const iniciales = ((e.nombre_estilista || '')[0] || '') +
                              ((e.apellido_estilista || '')[0] || '');

            // foto_url llega ya resuelta desde la API (null si no hay foto o no existe el archivo)
            const avatarHTML = e.foto_url
                ? `<div class="emp-avatar"><img src="${escaparHTML(e.foto_url)}" alt="${escaparHTML(e.nombre_estilista)}"></div>`
                : `<div class="emp-avatar">${escaparHTML(iniciales.toUpperCase())}</div>`;

            const rolClase = e.rol === 'Administrador' ? 'rol-administrador' : 'rol-peluquero';
            const rolIcono = e.rol === 'Administrador' ? 'fa-user-shield' : 'fa-scissors';

            const estadoDot = e.estado === 'Activo' ? 'activo' : 'inactivo';

            const card = `
                <div class="emp-card">
                    <div class="emp-header">
                        ${avatarHTML}
                        <div>
                            <p class="emp-nombre">${escaparHTML(e.nombre_estilista)} ${escaparHTML(e.apellido_estilista)}</p>
                            <span class="badge-rol ${rolClase}">
                                <i class="fa-solid ${rolIcono}"></i> ${escaparHTML(e.rol)}
                            </span>
                        </div>
                    </div>

                    <div class="emp-contacto">
                        <span><i class="fa-solid fa-envelope"></i> ${escaparHTML(e.correo)}</span>
                        <span><i class="fa-solid fa-phone"></i> ${escaparHTML(e.telefono_estilista)}</span>
                    </div>

                    <div class="emp-footer">
                        <span class="badge-estado">
                            <span class="dot ${estadoDot}"></span>
                            ${escaparHTML(e.estado)}
                        </span>
                        <div class="emp-btns">
                            <button class="btn btn-blue btn-editar"
                                data-id="${e.id_estilista}"
                                data-nombre="${escaparHTML(e.nombre_estilista)}"
                                data-apellido="${escaparHTML(e.apellido_estilista)}"
                                data-telefono="${escaparHTML(e.telefono_estilista)}"
                                data-correo="${escaparHTML(e.correo)}"
                                data-rol="${escaparHTML(e.rol)}"
                                data-estado="${escaparHTML(e.estado)}"
                                data-foto-url="${escaparHTML(e.foto_url || '')}">
                                <i class="fa-solid fa-pen"></i> Editar
                            </button>
                            <button class="btn btn-red"
                                onclick="eliminarEmpleado(${e.id_estilista})">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>`;

            grid.innerHTML += card;
        });
    });
}

/** Muestra el formulario para agregar un nuevo estilista. */
function mostrarFormulario() {
    document.getElementById('formulario').style.display = 'block';
}

/** Oculta el formulario de agregar, sin guardar, y descarta la foto elegida. */
function ocultarFormulario() {
    document.getElementById('formulario').style.display = 'none';
    selectorFotoNuevo.reset();
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
    const fotoInput  = document.getElementById('inp-foto');

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

    // FormData puede cargar texto Y archivos al mismo tiempo
    const formData = new FormData();
    formData.append('nombre',     nombre);
    formData.append('apellido',   apellido);
    formData.append('telefono',   telefono);
    formData.append('correo',     correo);
    formData.append('contrasena', contrasena);
    formData.append('rol',        rol);

    // Solo adjunta la foto si el usuario seleccionó una
    if (fotoInput.files.length > 0) {
        formData.append('foto', fotoInput.files[0]);
    }

    // Con FormData NO se pone Content-Type manualmente
    // El navegador lo configura solo con el boundary correcto
    fetchAuth('${API_BASE}/api/admin/empleados/agregar', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            modalExito('Empleado registrado correctamente.');
            ocultarFormulario();
            cargarEmpleados();
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
 * @param {string} estado   - 'Activo' | 'Inactivo'
 * @param {string} fotoUrl  - URL de la foto actual ('' si no tiene)
 * @returns {void}
 */
function editarEstilista(id, nombre, apellido, telefono, correo, rol, estado, fotoUrl) {
    const overlay = document.getElementById('modal-editar-empleado');

    // Limpia lo que quedó de una edición anterior y muestra la foto actual
    selectorFotoEditar.cargar(fotoUrl);

    // Prellenar el formulario con los datos actuales
    document.getElementById('edit-emp-nombre').value   = nombre;
    document.getElementById('edit-emp-apellido').value = apellido;
    document.getElementById('edit-emp-telefono').value = telefono;
    document.getElementById('edit-emp-correo').value   = correo;
    document.getElementById('edit-emp-estado').value   = estado;
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
        
        const editFormData = new FormData();
        editFormData.append('id_estilista', id);
        editFormData.append('nombre',   document.getElementById('edit-emp-nombre').value);
        editFormData.append('apellido', document.getElementById('edit-emp-apellido').value);
        editFormData.append('telefono', document.getElementById('edit-emp-telefono').value);
        editFormData.append('correo',   document.getElementById('edit-emp-correo').value);
        editFormData.append('rol',      rol);
        editFormData.append('estado',   document.getElementById('edit-emp-estado').value); 

        const editFoto = document.getElementById('edit-emp-foto');
        if (editFoto.files.length > 0) {
        editFormData.append('foto', editFoto.files[0]);
        } else if (selectorFotoEditar.fotoEliminada()) {
            // "Eliminar foto": el servidor borra el archivo y deja foto en NULL
            editFormData.append('eliminar_foto', '1');
        }

        fetchAuth('${API_BASE}/api/admin/empleados/editar', {
            method: 'POST',
            body: editFormData
})
        .then(res => res.json())
        .then(data => {
            overlay.classList.remove('open');
            selectorFotoEditar.reset();
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
        selectorFotoEditar.reset();  // descarta la foto elegida o eliminada sin guardar
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
        fetchAuth('${API_BASE}/api/admin/empleados/eliminar', {
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


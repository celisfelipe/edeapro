/**
 * perfil.js — Panel Cliente / Mi Perfil
 * ========================================
 * Carga y gestiona el perfil completo del cliente que inició sesión.
 * Verifica que el usuario tenga rol "cliente" en localStorage.
 *
 * Secciones que maneja:
 *   - Mi Perfil    → carga y actualiza datos del cliente
 *   - Mis Mascotas → muestra las mascotas registradas y permite añadir nuevas
 *   - Citas        → historial con filtro Día/Semana/Mes y cancelar pendientes
 *   - Pagos        → historial de pagos realizados
 *
 * Conecta con la API de Laravel:
 *   GET  /api/cliente/perfil            → datos del cliente
 *   POST /api/cliente/actualizar        → actualizar perfil
 *   GET  /api/cliente/mascotas          → mascotas del cliente
 *   POST /api/cliente/mascotas/agregar  → registrar una mascota nueva
 *   GET  /api/cliente/citas             → citas del cliente
 *   POST /api/cliente/cancelar-cita     → cancelar una cita pendiente
 *   GET  /api/cliente/pagos             → historial de pagos
 */

// Todas las citas del cliente tal como llegaron del servidor (sin filtrar)
let citasCliente = [];

document.addEventListener('DOMContentLoaded', function () {

    const user = JSON.parse(localStorage.getItem('user'));
    const rol  = localStorage.getItem('rol');

    if (!user || rol !== 'cliente') {
        window.location.href = '../paginas/login.html';
        return;
    }

    const id = user.id_cliente;

    // ── Cargar datos del perfil ───────────────────────────────
    fetchAuth(`http://127.0.0.1:8000/api/cliente/perfil?id_cliente=${id}`)
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            // Rellenar los inputs del formulario con los datos actuales
            document.getElementById('nombre').value   = data.cliente.nombre;
            document.getElementById('apellido').value = data.cliente.apellido;
            document.getElementById('telefono').value = data.cliente.telefono;
            document.getElementById('correo').value   = data.cliente.correo;
        }
    });

    cargarMascotas(id);
    cargarCitas(id);

    // ── Cargar historial de pagos ─────────────────────────────
    fetchAuth(`http://127.0.0.1:8000/api/cliente/pagos?id_cliente=${id}`)
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('pagosBody');
        if (!data.ok || data.pagos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="empty-msg"><i class="fa-regular fa-folder-open"></i> Sin registros de pagos</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        data.pagos.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td>${p.fecha_pago}</td>
                    <td>${p.nombre_servicio}</td>
                    <td>$${Number(p.monto).toLocaleString('es-CO')}</td>
                </tr>`;
        });
    });

    // ── Filtro Día/Semana/Mes de la tabla de citas ────────────
    document.querySelectorAll('.tab').forEach(function (boton) {
        boton.addEventListener('click', function () {
            document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
            boton.classList.add('active');
            renderCitasFiltradas();
        });
    });
});

/**
 * Trae las mascotas del cliente y las muestra en el grid.
 * Siempre agrega al final la tarjeta "Añadir mascota", que abre el modal.
 * @param {number} id - id_cliente del usuario logueado
 */
function cargarMascotas(id) {
    fetchAuth(`http://127.0.0.1:8000/api/cliente/mascotas?id_cliente=${id}`)
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;
        const grid = document.getElementById('pets-grid');
        grid.innerHTML = '';
        if (data.mascotas.length === 0) {
            grid.innerHTML = '<p style="color:var(--color-muted); font-size:13px;"><i class="fa-solid fa-paw"></i> No tienes mascotas registradas.</p>';
        } else {
            // Crear una tarjeta por cada mascota
            data.mascotas.forEach(m => {
                grid.innerHTML += `
                    <div class="pet-card">
                        <div class="pet-avatar"><i class="fa-solid fa-paw"></i></div>
                        <div class="pet-name">${m.nombre}</div>
                        <div class="pet-breed">${m.especie} · ${m.edad} años · ${m.genero}</div>
                    </div>`;
            });
        }
        // Tarjeta para añadir una nueva mascota
        grid.innerHTML += `
            <div class="pet-card pet-card-add" onclick="abrirModalAgregarMascota()">
                <div class="pet-avatar pet-avatar-add"><i class="fa-solid fa-plus"></i></div>
                <div class="pet-name">Añadir mascota</div>
            </div>`;
    });
}

/** Abre el modal para registrar una nueva mascota, con los campos vacíos */
function abrirModalAgregarMascota() {
    document.getElementById('mascota-nombre').value  = '';
    document.getElementById('mascota-edad').value    = '';
    document.getElementById('mascota-genero').value  = '';
    document.getElementById('mascota-especie').value = '';
    document.getElementById('modal-agregar-mascota').classList.add('open');
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('modal-agregar-mascota-cancel').addEventListener('click', function () {
        document.getElementById('modal-agregar-mascota').classList.remove('open');
    });

    document.getElementById('modal-agregar-mascota-ok').addEventListener('click', function () {
        const user    = JSON.parse(localStorage.getItem('user'));
        const nombre  = document.getElementById('mascota-nombre').value.trim();
        const edad    = document.getElementById('mascota-edad').value;
        const genero  = document.getElementById('mascota-genero').value;
        const especie = document.getElementById('mascota-especie').value;

        if (!nombre || edad === '' || !genero || !especie) {
            modalError('Completa todos los campos de la mascota.');
            return;
        }

        fetchAuth('http://127.0.0.1:8000/api/cliente/mascotas/agregar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ id_cliente: user.id_cliente, nombre, edad, genero, especie })
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                document.getElementById('modal-agregar-mascota').classList.remove('open');
                modalExito('Mascota registrada correctamente.');
                cargarMascotas(user.id_cliente); // Refrescar el grid sin recargar la página
            } else {
                modalError(data.error || 'Error al registrar la mascota.');
            }
        });
    });
});

/**
 * Trae las citas del cliente desde Laravel y aplica el filtro de fecha activo.
 * @param {number} id - id_cliente del usuario logueado
 */
function cargarCitas(id) {
    fetchAuth(`http://127.0.0.1:8000/api/cliente/citas?id_cliente=${id}`)
    .then(res => res.json())
    .then(data => {
        citasCliente = (data.ok && data.citas) ? data.citas : [];
        renderCitasFiltradas();
    });
}

/** Devuelve 'YYYY-MM-DD' de una fecha en hora local (evita el desfase de toISOString con UTC) */
function formatearFechaLocal(d) {
    const anio = d.getFullYear();
    const mes  = String(d.getMonth() + 1).padStart(2, '0');
    const dia  = String(d.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

/**
 * Filtra citasCliente según el tab activo (Todas/Día/Semana/Mes) y vuelve
 * a dibujar la tabla. "Todas" no recorta nada — es el filtro por defecto
 * para que el cliente vea su historial completo al entrar (incluye citas
 * de meses anteriores, canceladas o completadas). Se llama al cargar la
 * página, al cambiar de tab y después de cancelar una cita.
 */
function renderCitasFiltradas() {
    const tabActivo = document.querySelector('.tab.active');
    const filtro    = tabActivo ? tabActivo.dataset.filter : 'todas';

    const hoy    = new Date();
    const hoyStr = formatearFechaLocal(hoy);

    let citasFiltradas = citasCliente;

    if (filtro === 'dia') {
        citasFiltradas = citasCliente.filter(c => c.fecha === hoyStr);
    } else if (filtro === 'semana') {
        const limite = new Date(hoy);
        limite.setDate(limite.getDate() + 7);
        const limiteStr = formatearFechaLocal(limite);
        citasFiltradas = citasCliente.filter(c => c.fecha >= hoyStr && c.fecha <= limiteStr);
    } else if (filtro === 'mes') {
        const mesActual = hoyStr.slice(0, 7);
        citasFiltradas = citasCliente.filter(c => c.fecha.slice(0, 7) === mesActual);
    }
    // filtro === 'todas' → sin recorte, citasFiltradas ya es citasCliente completa

    renderTablaCitas(citasFiltradas, filtro);
}

/** Dibuja las filas de la tabla de citas a partir de una lista ya filtrada */
function renderTablaCitas(lista, filtro) {
    const tbody = document.getElementById('citasBody');

    if (citasCliente.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg"><i class="fa-regular fa-calendar"></i> No hay citas programadas.</td></tr>';
        return;
    }
    if (lista.length === 0) {
        const mensaje = filtro === 'todas' ? 'No hay citas programadas.' : 'No hay citas en este período.';
        tbody.innerHTML = `<tr><td colspan="5" class="empty-msg"><i class="fa-regular fa-calendar"></i> ${mensaje}</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    lista.forEach(c => {
        // Clase de badge e ícono según el estado de la cita
        const badgeClase = c.estado === 'Completada' ? 'badge-confirm' :
                           c.estado === 'Cancelada'  ? 'badge-cancel'  : 'badge-pending';
        const badgeIcono = c.estado === 'Completada' ? 'fa-check' :
                           c.estado === 'Cancelada'  ? 'fa-xmark'  : 'fa-clock';
        // Solo las citas pendientes tienen botón de cancelar
        const acciones = c.estado === 'Pendiente'
            ? `<button class="btn-red" onclick="cancelarCita(${c.id_cita})"><i class="fa-solid fa-xmark"></i> Cancelar</button>`
            : '';
        tbody.innerHTML += `
            <tr>
                <td>${c.fecha}</td>
                <td>${c.mascota}</td>
                <td>${c.nombre_servicio}</td>
                <td><span class="${badgeClase}"><i class="fa-solid ${badgeIcono}"></i> ${c.estado}</span></td>
                <td>${acciones}</td>
            </tr>`;
    });
}

/**
 * Actualizar perfil — valida que todos los campos estén llenos,
 * envía los nuevos datos a Laravel y actualiza el localStorage
 * para que el navbar refleje el nombre actualizado.
 */
document.getElementById('btnActualizar').addEventListener('click', () => {
    const user     = JSON.parse(localStorage.getItem('user'));
    const nombre   = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo   = document.getElementById('correo').value.trim();

    if (!nombre || !apellido || !telefono || !correo) {
        modalError('Completa todos los campos.');
        return;
    }

    fetchAuth('http://127.0.0.1:8000/api/cliente/actualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id_cliente: user.id_cliente, nombre, apellido, telefono, correo })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            modalExito('Perfil actualizado correctamente.');
            // Actualizar el nombre en localStorage para que el navbar lo refleje
            user.nombre   = nombre;
            user.apellido = apellido;
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            modalError('Error al actualizar.');
        }
    });
});

/**
 * Cancela una cita del cliente previa confirmación.
 * Solo funciona con citas en estado 'Pendiente'.
 * Recarga la tabla de citas después de cancelar.
 */
function cancelarCita(id_cita) {
    modalConfirmar('¿Seguro que deseas cancelar esta cita?', function () {
        const user = JSON.parse(localStorage.getItem('user'));
        fetchAuth('http://127.0.0.1:8000/api/cliente/cancelar-cita', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ id_cita })
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                modalExito('Cita cancelada correctamente.');
                // Refrescar la tabla de citas sin recargar la página
                setTimeout(() => cargarCitas(user.id_cliente), 500);
            } else {
                modalError('Error al cancelar: ' + data.error);
            }
        });
    });
}

/** Elimina la sesión del localStorage y redirige al login */
function cerrarSesion() {
    localStorage.removeItem('user');
    localStorage.removeItem('rol');
    window.location.href = '../paginas/login.html';
}

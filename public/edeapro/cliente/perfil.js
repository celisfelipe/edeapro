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
 *   GET  /api/cliente/mascotas/historial → historial de citas de una mascota
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

            const n = data.cliente.nombre   || '';
            const a = data.cliente.apellido || '';
            const avatarEl = document.getElementById('perfil-avatar');
            const nombreEl = document.getElementById('perfil-nombre-display');
            const correoEl = document.getElementById('perfil-correo-display');
            if (avatarEl) avatarEl.textContent = ((n[0] || '') + (a[0] || '')).toUpperCase();
            if (nombreEl) nombreEl.textContent = n + ' ' + a;
            if (correoEl) correoEl.textContent = data.cliente.correo;
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
                        <button class="btn-blue btn-historial" onclick="verHistorialMascota(${m.id_mascota}, '${m.nombre}')">
                            <i class="fa-solid fa-clock-rotate-left"></i> Ver historial
                        </button>
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

/**
 * Trae y muestra el historial de citas de UNA mascota específica (RF 1.6).
 * @param {number} id_mascota  - id de la mascota
 * @param {string} nombreMascota - nombre de la mascota, solo para el título del modal
 */
function verHistorialMascota(id_mascota, nombreMascota) {
    const user = JSON.parse(localStorage.getItem('user'));
    const tbody = document.getElementById('historialMascotaBody');

    document.getElementById('historial-mascota-nombre').textContent = nombreMascota;
    tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">Cargando...</td></tr>';
    document.getElementById('modal-historial-mascota').classList.add('open');

    fetchAuth(`http://127.0.0.1:8000/api/cliente/mascotas/historial?id_mascota=${id_mascota}&id_cliente=${user.id_cliente}`)
    .then(res => res.json())
    .then(data => {
        if (!data.ok || data.historial.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-msg"><i class="fa-regular fa-folder-open"></i> Esta mascota no tiene servicios registrados aún.</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        data.historial.forEach(h => {
            const badgeClase = h.estado === 'Completada' ? 'badge-confirm' :
                               h.estado === 'Cancelada'  ? 'badge-cancel'  : 'badge-pending';
            const badgeIcono = h.estado === 'Completada' ? 'fa-check' :
                               h.estado === 'Cancelada'  ? 'fa-xmark'  : 'fa-clock';
            tbody.innerHTML += `
                <tr>
                    <td>${h.fecha}</td>
                    <td>${h.nombre_servicio}</td>
                    <td>${h.nombre_estilista}</td>
                    <td><span class="${badgeClase}"><i class="fa-solid ${badgeIcono}"></i> ${h.estado}</span></td>
                </tr>`;
        });
    })
    .catch(() => {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">Error cargando el historial.</td></tr>';
    });
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('modal-agregar-mascota-cancel').addEventListener('click', function () {
        document.getElementById('modal-agregar-mascota').classList.remove('open');
    });

    document.getElementById('modal-historial-mascota-cerrar').addEventListener('click', function () {
        document.getElementById('modal-historial-mascota').classList.remove('open');
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
        const acciones = (c.estado === 'Pendiente' || c.estado === 'Reagendada')
            ? `<div style="display:flex; gap:6px;">
                 <button class="btn-blue" onclick="reagendarCita(${c.id_cita})"><i class="fa-solid fa-calendar-pen"></i> Reagendar</button>
                 <button class="btn-red" onclick="cancelarCita(${c.id_cita})"><i class="fa-solid fa-xmark"></i> Cancelar</button>
               </div>`
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
    // Mostrar campo de motivo en el modal
    document.getElementById('modal-motivo-grupo').style.display = 'block';
    document.getElementById('modal-motivo-input').value = '';

    modalConfirmar('¿Seguro que deseas cancelar esta cita? Indica el motivo:', function () {
        const motivo = document.getElementById('modal-motivo-input').value.trim();
        if (!motivo) {
            modalError('Debes escribir el motivo de cancelación.');
            return;
        }

        const user = JSON.parse(localStorage.getItem('user'));
        fetchAuth('http://127.0.0.1:8000/api/cliente/cancelar-cita', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ id_cita, motivo })
        })
        .then(res => res.json())
        .then(data => {
            document.getElementById('modal-motivo-grupo').style.display = 'none';
            if (data.ok) {
                modalExito('Cita cancelada correctamente.');
                setTimeout(() => cargarCitas(user.id_cliente), 500);
            } else {
                modalError('Error al cancelar: ' + data.error);
            }
        });
    });
}

// ── REAGENDAR CITA ────────────────────────────────────────────
/**
 * Abre el modal para mover una cita a otra fecha y hora con el mismo
 * estilista. Las horas ofrecidas y la validación final las calcula Laravel.
 * @param {number} id_cita
 */
function reagendarCita(id_cita) {
    const overlay = document.getElementById('modal-reagendar');
    const inputFecha = document.getElementById('reagendar-fecha');
    const selectHora = document.getElementById('reagendar-hora');

    // Fecha mínima: mañana (las horas a menos de 24h las descarta el servidor).
    // Se usa la fecha local; toISOString usaría UTC y podría saltar un día.
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    inputFecha.min = formatearFechaLocal(manana);
    inputFecha.value = '';
    selectHora.innerHTML = '<option value="">Selecciona una hora</option>';

    overlay.classList.add('open');

    // Cargar horarios al cambiar fecha. El servidor ya calcula cuáles sirven
    // (mismas reglas que el agendamiento inicial): que la cita completa
    // termine antes de las 5:00 PM, que el estilista esté libre en todo ese
    // rango, que no sea domingo ni día bloqueado y que falten más de 24h.
    inputFecha.onchange = async function () {
        const fecha = inputFecha.value;
        if (!fecha) {
            selectHora.innerHTML = '<option value="">Selecciona una hora</option>';
            return;
        }
        selectHora.innerHTML = '<option value="">Cargando...</option>';

        try {
            const res  = await fetchAuth(
                `http://127.0.0.1:8000/api/cliente/reagendar-horarios?id_cita=${id_cita}&fecha=${fecha}`
            );
            const data = await res.json();

            if (!data.ok) {
                selectHora.innerHTML = `<option value="">${data.error || 'Error al cargar horas'}</option>`;
                return;
            }
            if (data.disponibles.length === 0) {
                selectHora.innerHTML = `<option value="">${data.aviso || 'No hay horas disponibles ese día'}</option>`;
                return;
            }

            selectHora.innerHTML = '<option value="">Selecciona una hora</option>';
            data.disponibles.forEach(slot => {
                const opt = document.createElement('option');
                opt.value = slot;
                opt.textContent = formatoHora12(slot); // se muestra en 12h, el value sigue en 24h
                selectHora.appendChild(opt);
            });
        } catch (e) {
            selectHora.innerHTML = '<option value="">Error al cargar horas</option>';
        }
    };

    // Cancelar
    document.getElementById('reagendar-cancelar').onclick = function () {
        overlay.classList.remove('open');
    };

    // Confirmar
    document.getElementById('reagendar-confirmar').onclick = function () {
        const fecha = inputFecha.value;
        const hora  = selectHora.value;

        if (!fecha || !hora) {
            modalError('Debes seleccionar fecha y hora.');
            return;
        }

        const user = JSON.parse(localStorage.getItem('user'));
        fetchAuth('http://127.0.0.1:8000/api/cliente/reagendar-cita', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ id_cita, fecha, hora })
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                overlay.classList.remove('open');
                modalExito('Cita reagendada correctamente.');
                setTimeout(() => cargarCitas(user.id_cliente), 500);
            } else {
                modalError('Error: ' + data.error);
            }
        });
    };
}

/** Elimina la sesión del localStorage y redirige al login */
function cerrarSesion() {
    localStorage.removeItem('user');
    localStorage.removeItem('rol');
    window.location.href = '../paginas/login.html';
}

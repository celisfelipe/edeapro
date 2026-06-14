/**
 * perfil.js — Panel Cliente / Mi Perfil
 * ========================================
 * Carga y gestiona el perfil completo del cliente que inició sesión.
 * Verifica que el usuario tenga rol "cliente" en localStorage.
 *
 * Secciones que maneja:
 *   - Mi Perfil    → carga y actualiza datos del cliente
 *   - Mis Mascotas → muestra las mascotas registradas
 *   - Citas        → historial con opción de cancelar las pendientes
 *   - Pagos        → historial de pagos realizados
 *
 * Conecta con la API de Laravel:
 *   GET  /api/cliente/perfil         → datos del cliente
 *   POST /api/cliente/actualizar     → actualizar perfil
 *   GET  /api/cliente/mascotas       → mascotas del cliente
 *   GET  /api/cliente/citas          → citas del cliente
 *   POST /api/cliente/cancelar-cita  → cancelar una cita pendiente
 *   GET  /api/cliente/pagos          → historial de pagos
 */

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

    // ── Cargar mascotas ───────────────────────────────────────
    fetchAuth(`http://127.0.0.1:8000/api/cliente/mascotas?id_cliente=${id}`)
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;
        const grid = document.getElementById('pets-grid');
        grid.innerHTML = '';
        if (data.mascotas.length === 0) {
            grid.innerHTML = '<p style="color:#888; font-size:13px;">No tienes mascotas registradas.</p>';
            return;
        }
        // Crear una tarjeta por cada mascota
        data.mascotas.forEach(m => {
            grid.innerHTML += `
                <div class="pet-card">
                    <div class="pet-name">${m.nombre}</div>
                    <div class="pet-breed">${m.especie} · ${m.edad} años · ${m.genero}</div>
                </div>`;
        });
    });

    // Cargar citas del cliente
    cargarCitas(id);

    // ── Cargar historial de pagos ─────────────────────────────
    fetchAuth(`http://127.0.0.1:8000/api/cliente/pagos?id_cliente=${id}`)
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('pagosBody');
        if (!data.ok || data.pagos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" class="empty-msg">Sin registros de pagos</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        data.pagos.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td>${p.fecha_pago}</td>
                    <td>${p.nombre_servicio}</td>
                </tr>`;
        });
    });
});

/**
 * Trae las citas del cliente y las muestra en la tabla.
 * Solo las citas en estado 'Pendiente' tienen botón de cancelar.
 * @param {number} id - id_cliente del usuario logueado
 */
function cargarCitas(id) {
    fetchAuth(`http://127.0.0.1:8000/api/cliente/citas?id_cliente=${id}`)
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('citasBody');
        if (!data.ok || data.citas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No hay citas programadas.</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        data.citas.forEach(c => {
            // Clase de badge según el estado de la cita
            const badgeClase = c.estado === 'Completada' ? 'badge-confirm' :
                               c.estado === 'Cancelada'  ? 'badge-cancel'  : 'badge-pending';
            // Solo las citas pendientes tienen botón de cancelar
            const acciones = c.estado === 'Pendiente'
                ? `<button class="btn-red" onclick="cancelarCita(${c.id_cita})">✕ Cancelar</button>`
                : '';
            tbody.innerHTML += `
                <tr>
                    <td>${c.fecha}</td>
                    <td>${c.mascota}</td>
                    <td>${c.nombre_servicio}</td>
                    <td><span class="${badgeClase}">${c.estado}</span></td>
                    <td>${acciones}</td>
                </tr>`;
        });
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

/**
 * Tabs de filtro (Día / Semana / Mes).
 * Por ahora solo cambian la clase visual activa.
 */
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

/** Elimina la sesión del localStorage y redirige al login */
function cerrarSesion() {
    localStorage.removeItem('user');
    localStorage.removeItem('rol');
    window.location.href = '../paginas/login.html';
}

/**
 * pagos.js — Panel Administrador / Pagos
 * =======================================
 * Muestra el historial de pagos y las citas pendientes de pago.
 * Permite registrar un pago seleccionando el método de pago.
 * Al registrar un pago, la cita pasa automáticamente a "Completada".
 * Verifica que el usuario tenga rol "administrador" en localStorage.
 *
 * Conecta con la API de Laravel:
 *   GET  /api/admin/pagos           → historial de pagos + total recaudado real
 *   GET  /api/admin/citas           → para filtrar las citas pendientes
 *   POST /api/admin/pagos/registrar → registrar nuevo pago (el monto lo calcula el servidor)
 */

document.addEventListener('DOMContentLoaded', function () {

    const user = JSON.parse(localStorage.getItem('user'));
    const rol  = localStorage.getItem('rol');

    if (!user || rol !== 'administrador') {
        window.location.href = '../../paginas/login.html';
        return;
    }

    document.getElementById('nombre-admin').textContent = user.nombre_estilista + ' ' + user.apellido_estilista;

    // Cargar ambas tablas al iniciar
    cargarPagos();
    cargarCitasSinPago();
});

/** Devuelve el ícono de Font Awesome según el método de pago */
function iconoMetodoPago(metodo) {
    if (metodo === 'Efectivo') return 'fa-money-bill-wave';
    if (metodo === 'Transferencia') return 'fa-building-columns';
    return 'fa-credit-card'; // Tarjeta de crédito / por defecto
}

/** Trae el historial completo de pagos registrados, y el total recaudado real */
function cargarPagos() {
    fetchAuth('http://127.0.0.1:8000/api/admin/pagos')
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('tabla-pagos');
        if (!data.ok) return;

        document.getElementById('stat-total-recaudado').textContent = '$' + Number(data.total_recaudado).toLocaleString('es-CO');

        if (data.pagos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No hay pagos registrados</td></tr>';
            document.getElementById('stat-total-pagos').textContent = 0;
            return;
        }
        document.getElementById('stat-total-pagos').textContent = data.pagos.length;
        tbody.innerHTML = '';
        data.pagos.forEach(p => {
            // Pagos antiguos sin monto capturado muestran "—" en vez de "$NaN"
            const montoTexto = p.monto !== null ? '$' + Number(p.monto).toLocaleString('es-CO') : '—';
            tbody.innerHTML += `
                <tr>
                    <td>${p.fecha_pago}</td>
                    <td>${p.nombre_cliente} ${p.apellido_cliente}</td>
                    <td>${p.nombre_servicio}</td>
                    <td>${montoTexto}</td>
                    <td><span class="badge-metodo-pago"><i class="fa-solid ${iconoMetodoPago(p.metodo_pago)}"></i> ${p.metodo_pago}</span></td>
                    <td class="status-green"><i class="fa-solid fa-check"></i> ${p.estado_pago}</td>
                </tr>`;
        });
    });
}

/**
 * Trae todas las citas y filtra solo las que están en estado 'Pendiente'.
 * Estas son las que aún no tienen pago registrado.
 */
function cargarCitasSinPago() {
    fetchAuth('http://127.0.0.1:8000/api/admin/citas')
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('tabla-sin-pago');
        if (!data.ok) return;

        // Filtrar solo citas pendientes (sin pago aún)
        const sinPago = data.citas.filter(c => c.estado === 'Pendiente');
        if (sinPago.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No hay citas pendientes de pago</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        sinPago.forEach(c => {
            tbody.innerHTML += `
                <tr>
                    <td>${c.nombre_cliente} ${c.apellido_cliente}</td>
                    <td>${c.nombre_servicio}</td>
                    <td>${c.fecha}</td>
                    <td>${c.hora}</td>
                    <td>
                        <select id="metodo-${c.id_cita}">
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta de crédito">Tarjeta de crédito</option>
                            <option value="Transferencia">Transferencia</option>
                        </select>
                        <button class="btn btn-green" onclick="registrarPago(${c.id_cita})"><i class="fa-solid fa-check"></i> Registrar pago</button>
                    </td>
                </tr>`;
        });
    });
}

/**
 * Registra el pago de una cita con el método seleccionado.
 * Pide confirmación antes de enviar.
 * Después de registrar, la cita queda como "Completada" en la BD.
 */
function registrarPago(id_cita) {
    const metodo = document.getElementById('metodo-' + id_cita).value;
    modalConfirmar(`¿Registrar pago con método "${metodo}"?`, function () {
        fetchAuth('http://127.0.0.1:8000/api/admin/pagos/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ id_cita, metodo })
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                // Refrescar ambas tablas sin recargar la página
                cargarPagos();
                cargarCitasSinPago();
                const montoMsg = data.monto !== null ? ` por $${Number(data.monto).toLocaleString('es-CO')}` : '';
                modalExito(`Pago registrado correctamente${montoMsg}.`);
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

/**
 * pagos.js — Panel Administrador / Pagos
 * =======================================
 * Muestra el historial de pagos y las citas pendientes de pago.
 * Permite registrar un pago seleccionando el método de pago.
 * Al registrar un pago, la cita pasa automáticamente a "Completada".
 * Solo accesible con sesión de administrador (ver sesion.js).
 *
 * Conecta con la API de Laravel:
 *   GET  /api/admin/pagos           → historial de pagos + total recaudado real
 *   GET  /api/admin/citas           → para filtrar las citas pendientes
 *   POST /api/admin/pagos/registrar → registrar nuevo pago (el monto lo calcula el servidor)
 *
 * Depende de: fetchToken.js (fetchAuth), sesion.js (verificarSesionAdmin, cerrarSesion),
 *             formatoHora.js (formatoHora12), modal.js (modalConfirmar, modalExito, modalError).
 */

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;

    // Cargar ambas tablas al iniciar
    cargarPagos();
    cargarCitasSinPago();
});

/**
 * Devuelve el ícono de Font Awesome que corresponde a un método de pago.
 *
 * @param {string} metodo - 'Efectivo' | 'Transferencia' | 'Tarjeta de crédito'
 * @returns {string} clase del ícono (ej. 'fa-money-bill-wave')
 */
function iconoMetodoPago(metodo) {
    if (metodo === 'Efectivo') return 'fa-money-bill-wave';
    if (metodo === 'Transferencia') return 'fa-building-columns';
    return 'fa-credit-card'; // Tarjeta de crédito / por defecto
}

/**
 * Llena la tabla #tabla-pagos con el historial de pagos y actualiza las
 * tarjetas de "Total recaudado" (suma real de pago.monto) y "Total pagos".
 *
 * @returns {void}
 */
function cargarPagos() {
    fetchAuth('${API_BASE}/api/admin/pagos')
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
                    <td>${escaparHTML(p.fecha_pago)}</td>
                    <td>${escaparHTML(p.nombre_cliente)} ${escaparHTML(p.apellido_cliente)}</td>
                    <td>${escaparHTML(p.nombre_servicio)}</td>
                    <td>${montoTexto}</td>
                    <td><span class="badge-metodo-pago"><i class="fa-solid ${iconoMetodoPago(p.metodo_pago)}"></i> ${escaparHTML(p.metodo_pago)}</span></td>
                    <td class="status-green"><i class="fa-solid fa-check"></i> ${escaparHTML(p.estado_pago)}</td>
                </tr>`;
        });
    });
}

/**
 * Llena la tabla #tabla-sin-pago con las citas en estado 'Pendiente'
 * (las que aún no tienen pago). Cada fila trae un <select> con el método
 * de pago y el botón "Registrar pago". La hora se muestra en 12h.
 *
 * @returns {void}
 */
function cargarCitasSinPago() {
    fetchAuth('${API_BASE}/api/admin/citas')
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
                    <td>${escaparHTML(c.nombre_cliente)} ${escaparHTML(c.apellido_cliente)}</td>
                    <td>${escaparHTML(c.nombre_servicio)}</td>
                    <td>${escaparHTML(c.fecha)}</td>
                    <td>${escaparHTML(formatoHora12(c.hora))}</td>
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
 * Registra el pago de una cita con el método elegido en su fila.
 * Pide confirmación antes de enviar. El monto lo calcula el servidor a
 * partir de la raza y el servicio de la cita. Al terminar, la cita queda
 * como "Completada" y se refrescan ambas tablas.
 *
 * @param {number} id_cita
 * @returns {void}
 */
function registrarPago(id_cita) {
    const metodo = document.getElementById('metodo-' + id_cita).value;
    modalConfirmar(`¿Registrar pago con método "${metodo}"?`, function () {
        fetchAuth('${API_BASE}/api/admin/pagos/registrar', {
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

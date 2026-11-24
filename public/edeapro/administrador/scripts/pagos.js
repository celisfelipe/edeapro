/**
 * pagos.js — Panel Administrador / Pagos
 * =======================================
 * Página de cobro del día. Tiene tres partes:
 *   1. Caja: lo cobrado en efectivo, transferencia y tarjeta, y el total,
 *      de un día o de un mes (reemplaza el cierre de caja en Excel).
 *      Abre en hoy; con "Día/Mes" y la fecha se ve cualquier día o mes.
 *   2. Citas pendientes de pago: una fila por cliente y día, con filtros
 *      "Hoy" / "Atrasadas" y buscador. Al dar "Cobrar" se abre una ventana
 *      con cada mascota, su raza, sus adicionales y el precio de cada cosa,
 *      que el administrador puede cambiar (ej. si al final fueron $55.000).
 *   3. Historial de pagos registrados.
 * Al registrar el cobro, todas las citas del cliente pasan a "Completada".
 * Solo accesible con sesión de administrador (ver sesion.js).
 *
 * Conecta con la API de Laravel:
 *   GET  /api/admin/pagos?periodo=dia|mes&fecha=AAAA-MM-DD
 *                                   → caja, por cobrar, historial y total recaudado
 *   POST /api/admin/pagos/registrar → cobra las citas de un cliente (metodo + cobros)
 *
 * Depende de: fetchToken.js (fetchAuth), sesion.js (verificarSesionAdmin, cerrarSesion),
 *             formatoHora.js (formatoHora12), modal.js (modalExito, modalError),
 *             utils.js (escaparHTML).
 */

/** Cobros pendientes que mandó el servidor (uno por cliente y día) */
let COBROS = [];

/** Filtro activo de la lista: 'hoy' o 'atrasadas' */
let FILTRO = 'hoy';

/** Cobro que está abierto en la ventana */
let COBRO_ACTUAL = null;

/** Nombres de los meses para el título de la caja */
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
               'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;
    // La caja abre en hoy (fecha local, no UTC, para no saltar un día)
    document.getElementById('caja-fecha').value = new Date().toLocaleDateString('en-CA');
    cargarPagos();
});

/**
 * Da formato de pesos colombianos a un número (ej. 55000 → "$55.000").
 * @param {number|string} valor
 * @returns {string}
 */
function formatoPesos(valor) {
    return '$' + Math.round(Number(valor)).toLocaleString('es-CO');
}

/**
 * Lee un precio escrito por el administrador dejando solo los dígitos,
 * así "55.000", "55,000" o "$55000" se leen como 55000.
 * @param {string} texto
 * @returns {number} 0 si está vacío
 */
function leerPrecio(texto) {
    return Number(String(texto).replace(/\D/g, '')) || 0;
}

/**
 * Pasa "AAAA-MM-DD" a "DD/MM/AAAA".
 * @param {string} fecha
 * @returns {string}
 */
function formatoFecha(fecha) {
    const [a, m, d] = fecha.split('-');
    return `${d}/${m}/${a}`;
}

/**
 * Devuelve el ícono de Font Awesome que corresponde a un método de pago.
 * @param {string} metodo - 'Efectivo' | 'Transferencia' | 'Tarjeta de crédito'
 * @returns {string} clase del ícono
 */
function iconoMetodoPago(metodo) {
    if (metodo === 'Efectivo') return 'fa-money-bill-wave';
    if (metodo === 'Transferencia') return 'fa-building-columns';
    return 'fa-credit-card';
}

/**
 * Precio sugerido de una cita: servicio + sus adicionales.
 * Si la cita no tiene precio de catálogo (citas antiguas) cuenta como 0.
 * @param {Object} cita
 * @returns {number}
 */
function totalCita(cita) {
    const adicionales = cita.adicionales.reduce((suma, a) => suma + a.precio, 0);
    return (cita.precio || 0) + adicionales;
}

/**
 * Total sugerido de un cobro (todas las citas del cliente ese día).
 * @param {Object} cobro
 * @returns {number}
 */
function totalCobro(cobro) {
    return cobro.citas.reduce((suma, c) => suma + totalCita(c), 0);
}

// ── CARGAR LA PÁGINA ──────────────────────────────────────────

/**
 * Pide al servidor todo lo de la página y pinta sus tres partes.
 * La caja se pide según el selector "Día/Mes" y la fecha elegida.
 * @returns {void}
 */
function cargarPagos() {
    const periodo = document.getElementById('caja-periodo').value;
    const valor   = document.getElementById('caja-fecha').value;
    // El selector de mes da "AAAA-MM"; se completa con el día 1 para el servidor
    const fecha   = valor.length === 7 ? valor + '-01' : valor;
    const params  = new URLSearchParams({ periodo, fecha });

    fetchAuth(`${API_BASE}/api/admin/pagos?${params}`)
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;
        // El título sale de lo que el servidor realmente consultó, no de lo escrito
        pintarTituloCaja(data.caja_periodo, data.caja_desde, data.hoy);
        pintarCaja(data.caja);
        COBROS = data.por_cobrar;
        pintarPorCobrar();
        pintarHistorial(data.pagos, data.total_recaudado);
    });
}

/**
 * Pone el título de la caja según lo elegido:
 * "Caja de hoy", "Caja del 15/11/2026", "Caja de noviembre 2026".
 * @param {'dia'|'mes'} periodo
 * @param {string} fecha - AAAA-MM-DD elegida
 * @param {string} hoy   - AAAA-MM-DD de hoy (la manda el servidor)
 * @returns {void}
 */
function pintarTituloCaja(periodo, fecha, hoy) {
    let titulo, etiqueta;
    if (periodo === 'mes') {
        const [a, m] = fecha.split('-');
        titulo   = `Caja de ${MESES[Number(m) - 1]} ${a}`;
        etiqueta = 'Total del mes';
    } else {
        titulo   = fecha === hoy ? 'Caja de hoy' : `Caja del ${formatoFecha(fecha)}`;
        etiqueta = 'Total del día';
    }
    document.getElementById('caja-titulo').textContent = titulo;
    document.getElementById('caja-total-label').textContent = etiqueta;
}

/**
 * Llena la caja: dinero y cantidad de servicios por método, y el total.
 * @param {Array<{metodo: string, cantidad: number, total: number}>} caja
 * @returns {void}
 */
function pintarCaja(caja) {
    const ids = { 'Efectivo': 'caja-efectivo', 'Transferencia': 'caja-transferencia', 'Tarjeta de crédito': 'caja-tarjeta' };
    let total = 0, cantidad = 0;

    caja.forEach(m => {
        document.getElementById(ids[m.metodo]).textContent = formatoPesos(m.total);
        document.getElementById(ids[m.metodo] + '-cant').textContent = `${m.cantidad} servicios`;
        total += Number(m.total);
        cantidad += Number(m.cantidad);
    });

    document.getElementById('caja-total').textContent = formatoPesos(total);
    document.getElementById('caja-total-cant').textContent = `${cantidad} servicios`;
}

/**
 * Al cambiar entre "Día" y "Mes", la casilla de fecha cambia de tipo:
 *   Día → calendario para escoger un día (AAAA-MM-DD)
 *   Mes → selector de mes y año (AAAA-MM)
 * Conserva la fecha que ya estaba (ej. del 23/11/2026 pasa a noviembre 2026).
 * @returns {void}
 */
function cambiarPeriodoCaja() {
    const periodo = document.getElementById('caja-periodo').value;
    const casilla = document.getElementById('caja-fecha');
    const actual  = casilla.value || new Date().toLocaleDateString('en-CA');

    if (periodo === 'mes') {
        casilla.type  = 'month';
        casilla.value = actual.slice(0, 7);                      // "2026-11"
    } else {
        casilla.type  = 'date';
        casilla.value = actual.length === 7 ? actual + '-01' : actual;
    }
    cargarPagos();
}

// ── CITAS PENDIENTES DE PAGO ──────────────────────────────────

/**
 * Cambia entre ver los cobros de hoy o los atrasados.
 * @param {'hoy'|'atrasadas'} filtro
 * @returns {void}
 */
function cambiarFiltro(filtro) {
    FILTRO = filtro;
    pintarPorCobrar();
}

/**
 * Pinta la lista de cobros pendientes según el filtro y el buscador.
 * Una fila por cliente y día: nombre, mascotas, fecha, total y botón "Cobrar".
 * También actualiza los botones de filtro con su cantidad y el resumen de abajo.
 * @returns {void}
 */
function pintarPorCobrar() {
    const tbody    = document.getElementById('tabla-por-cobrar');
    const busqueda = document.getElementById('buscar-cobro').value.trim().toLowerCase();

    const deHoy      = COBROS.filter(c => !c.atrasado);
    const atrasados  = COBROS.filter(c => c.atrasado);

    // Botones de filtro: el activo en oscuro, el otro en gris
    const btnHoy = document.getElementById('filtro-hoy');
    const btnAtr = document.getElementById('filtro-atrasadas');
    btnHoy.textContent = `Hoy (${deHoy.length})`;
    btnAtr.textContent = `Atrasadas (${atrasados.length})`;
    btnHoy.className = 'btn ' + (FILTRO === 'hoy' ? 'btn-blue' : 'btn-gray');
    btnAtr.className = 'btn ' + (FILTRO === 'atrasadas' ? 'btn-blue' : 'btn-gray');

    // Filtrar por pestaña y por lo que se escribió en el buscador (cliente o mascota)
    const visibles = (FILTRO === 'hoy' ? deHoy : atrasados).filter(c => {
        if (!busqueda) return true;
        const texto = (c.cliente + ' ' + c.citas.map(x => x.mascota).join(' ')).toLowerCase();
        return texto.includes(busqueda);
    });

    if (visibles.length === 0) {
        const vacio = busqueda ? 'No hay resultados para esa búsqueda'
                    : FILTRO === 'hoy' ? 'No hay citas por cobrar hoy'
                    : 'No hay citas atrasadas sin pagar';
        tbody.innerHTML = `<tr><td colspan="5">${vacio}</td></tr>`;
        document.getElementById('resumen-por-cobrar').textContent = '';
        return;
    }

    tbody.innerHTML = '';
    visibles.forEach(cobro => {
        const indice   = COBROS.indexOf(cobro);
        const mascotas = cobro.citas.map(c => escaparHTML(c.mascota)).join(', ');
        const fecha    = cobro.atrasado
            ? `<span class="status-red"><i class="fa-solid fa-triangle-exclamation"></i> ${formatoFecha(cobro.fecha)}</span>`
            : 'Hoy';
        tbody.innerHTML += `
            <tr>
                <td>${escaparHTML(cobro.cliente)}</td>
                <td>${mascotas}</td>
                <td>${fecha}</td>
                <td><strong>${formatoPesos(totalCobro(cobro))}</strong></td>
                <td><button class="btn btn-green" onclick="abrirCobro(${indice})"><i class="fa-solid fa-cash-register"></i> Cobrar</button></td>
            </tr>`;
    });

    const nMascotas = visibles.reduce((s, c) => s + c.citas.length, 0);
    const nTotal    = visibles.reduce((s, c) => s + totalCobro(c), 0);
    document.getElementById('resumen-por-cobrar').textContent =
        `${visibles.length} clientes · ${nMascotas} servicios · ${formatoPesos(nTotal)} por cobrar`;
}

// ── VENTANA DE COBRO ──────────────────────────────────────────

/**
 * Abre la ventana de cobro de un cliente: una línea por servicio (raza,
 * mascota, clasificación y hora) y una por cada adicional, todas con su
 * precio editable. Cada casilla guarda en data-cita a qué cita pertenece.
 * @param {number} indice - posición del cobro en COBROS
 * @returns {void}
 */
function abrirCobro(indice) {
    COBRO_ACTUAL = COBROS[indice];
    const cobro  = COBRO_ACTUAL;

    document.getElementById('cobro-titulo').textContent = 'Cobrar a ' + cobro.cliente;
    document.getElementById('cobro-sub').textContent = (cobro.atrasado ? `Cita del ${formatoFecha(cobro.fecha)}` : 'Hoy')
        + ' · puedes cambiar cualquier precio';

    let html = '';
    cobro.citas.forEach(cita => {
        // Cita de solo adicionales (ej. solo corte de uñas): no hay servicio que cobrar,
        // se muestra la mascota y debajo sus adicionales con precio
        if (cita.solo_adicionales) {
            html += `
            <div class="cobro-linea">
                <div>
                    Solo adicionales · <strong>${escaparHTML(cita.mascota)}</strong>
                    <small>${formatoHora12(cita.hora)}</small>
                </div>
            </div>`;
        } else {
            const precio = cita.precio !== null ? Math.round(cita.precio).toLocaleString('es-CO') : '';
            html += `
                <div class="cobro-linea">
                    <div>
                        ${escaparHTML(cita.raza)} · <strong>${escaparHTML(cita.mascota)}</strong>
                        <small>${escaparHTML(cita.servicio)} · ${formatoHora12(cita.hora)}</small>
                    </div>
                    <input type="text" inputmode="numeric" class="precio-cobro" data-cita="${cita.id_cita}"
                           value="${precio}" placeholder="Valor" aria-label="Precio de ${escaparHTML(cita.raza)}">
                </div>`;
        }
        cita.adicionales.forEach(ad => {
            html += `
                <div class="cobro-linea cobro-adicional">
                    <div>+ ${escaparHTML(ad.nombre)}</div>
                    <input type="text" inputmode="numeric" class="precio-cobro" data-cita="${cita.id_cita}"
                           value="${Math.round(ad.precio).toLocaleString('es-CO')}" aria-label="Precio de ${escaparHTML(ad.nombre)}">
                </div>`;
        });
    });

    document.getElementById('cobro-detalle').innerHTML = html;
    document.querySelectorAll('.precio-cobro').forEach(input => input.addEventListener('input', recalcularCobro));
    recalcularCobro();

    document.getElementById('modal-cobro').classList.add('open');
}

/**
 * Suma todas las casillas de la ventana y muestra el total a cobrar.
 * @returns {void}
 */
function recalcularCobro() {
    const total = [...document.querySelectorAll('.precio-cobro')].reduce((s, i) => s + leerPrecio(i.value), 0);
    document.getElementById('cobro-total').textContent = formatoPesos(total);
}

/** Cierra la ventana de cobro sin guardar nada. */
function cerrarCobro() {
    document.getElementById('modal-cobro').classList.remove('open');
    COBRO_ACTUAL = null;
}

/**
 * Registra el cobro abierto. Junta por cita lo de sus casillas
 * (servicio + adicionales) y lo manda al servidor con el método elegido.
 * El servidor vuelve a validar todo y guarda un pago por cita.
 * @returns {void}
 */
function registrarCobro() {
    if (!COBRO_ACTUAL) return;

    // Ningún servicio puede quedar sin precio
    const vacia = [...document.querySelectorAll('.precio-cobro')].find(i => leerPrecio(i.value) <= 0);
    if (vacia) {
        vacia.focus();
        modalError('Escribe el precio de cada servicio antes de cobrar.');
        return;
    }

    // Monto de cada cita = suma de sus casillas
    const cobros = COBRO_ACTUAL.citas.map(cita => ({
        id_cita: cita.id_cita,
        monto: [...document.querySelectorAll(`.precio-cobro[data-cita="${cita.id_cita}"]`)]
                   .reduce((s, i) => s + leerPrecio(i.value), 0)
    }));

    const metodo = document.getElementById('cobro-metodo').value;
    const boton  = document.getElementById('cobro-registrar');
    boton.disabled = true;   // evita un doble clic que cobre dos veces

    fetchAuth(`${API_BASE}/api/admin/pagos/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ metodo, cobros: JSON.stringify(cobros) })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            const cliente = COBRO_ACTUAL.cliente;
            cerrarCobro();
            cargarPagos();   // refresca la caja, la lista y el historial
            modalExito(`Pago de ${cliente} registrado por ${formatoPesos(data.total)} (${metodo}).`);
        } else {
            modalError(data.error);
        }
    })
    .catch(() => modalError('No se pudo registrar el pago. Revisa tu conexión.'))
    .finally(() => { boton.disabled = false; });
}

// ── HISTORIAL ─────────────────────────────────────────────────

/**
 * Llena la tabla #tabla-pagos con los pagos ya registrados y el resumen
 * "N pagos · $X recaudado" del título.
 * @param {Array} pagos
 * @param {number|string} totalRecaudado - suma real de pago.monto
 * @returns {void}
 */
function pintarHistorial(pagos, totalRecaudado) {
    const tbody = document.getElementById('tabla-pagos');

    document.getElementById('stat-total-recaudado').textContent = formatoPesos(totalRecaudado);
    document.getElementById('stat-total-pagos').textContent = pagos.length;

    if (pagos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No hay pagos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    pagos.forEach(p => {
        // Pagos antiguos sin monto capturado muestran "—" en vez de "$NaN"
        const montoTexto = p.monto !== null ? formatoPesos(p.monto) : '—';
        const raza = p.nombre_raza || p.nombre_servicio;
        tbody.innerHTML += `
            <tr>
                <td>${escaparHTML(p.fecha_pago)}</td>
                <td>${escaparHTML(p.nombre_cliente)} ${escaparHTML(p.apellido_cliente)}</td>
                <td>${escaparHTML(raza)} · ${escaparHTML(p.nombre_mascota)}</td>
                <td>${montoTexto}</td>
                <td><span class="badge-metodo-pago"><i class="fa-solid ${iconoMetodoPago(p.metodo_pago)}"></i> ${escaparHTML(p.metodo_pago)}</span></td>
                <td><span class="status-green"><i class="fa-solid fa-check"></i> ${escaparHTML(p.estado_pago)}</span></td>
            </tr>`;
    });
}

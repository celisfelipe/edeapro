
/**
 * notificaciones.js — Panel Administrador / Notificaciones
 * =========================================================
 * Carga y muestra las notificaciones del sistema.
 * Permite marcar notificaciones como leídas, una por una o todas a la vez.
 * Solo accesible con sesión de administrador (ver sesion.js).
 *
 * Conecta con la API de Laravel:
 *   GET  /api/admin/notificaciones      → cargar notificaciones
 *   POST /api/admin/notificaciones/leer → marcar como leída
 *
 * Depende de: fetchToken.js (fetchAuth), sesion.js (verificarSesionAdmin, cerrarSesion),
 *             formatoHora.js (formatoHora12).
 */

document.addEventListener('DOMContentLoaded', function () {
    if (!verificarSesionAdmin()) return;

    cargarNotificaciones();
});

// IDs de las notificaciones no leídas de la última carga
// (usado por "Marcar todas como leídas")
let notificacionesNoLeidasIds = [];

/**
 * Trae las notificaciones desde Laravel y las muestra agrupadas por fecha.
 *
 * @returns {void}
 */
function cargarNotificaciones() {
    fetchAuth(`${API_BASE}/api/admin/notificaciones`)
    .then(res => res.json())
    .then(data => {
        const contenedor = document.getElementById('contenedor-notificaciones');
        notificacionesNoLeidasIds = [];

        if (!data.ok || !data.notificaciones || data.notificaciones.length === 0) {
            contenedor.innerHTML = '<p>No hay notificaciones</p>';
            actualizarBotonMarcarTodas();
            return;
        }

        const grupos = new Map();

        data.notificaciones.forEach(n => {
            const tipo = clasificarDia(n.fecha_creacion);
            const fecha = obtenerFechaLocal(n.fecha_creacion);

            let clave = tipo;

            // Los meses anteriores se agrupan por mes y año.
            if (tipo === 'mes-anterior' && fecha) {
                clave = `${tipo}-${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!grupos.has(clave)) {
                grupos.set(clave, {
                    tipo,
                    fecha: n.fecha_creacion,
                    notificaciones: []
                });
            }

            grupos.get(clave).notificaciones.push(n);
        });

        // Ordenar las notificaciones de cada grupo,
        // de la más reciente a la más antigua.
        grupos.forEach(grupo => {
            grupo.notificaciones.sort((a, b) => {
                const fechaA = obtenerFechaLocal(a.fecha_creacion);
                const fechaB = obtenerFechaLocal(b.fecha_creacion);

                if (!fechaA) return 1;
                if (!fechaB) return -1;

                return fechaB - fechaA;
            });
        });

        // Orden cronológico de los grupos.
        const prioridad = {
            hoy: 0,
            ayer: 1,
            anteayer: 2,
            'esta-semana': 3,
            'semana-pasada': 4,
            'este-mes': 5,
            'mes-anterior': 6,
            'sin-fecha': 7
        };

        const gruposOrdenados = Array.from(grupos.values()).sort((a, b) => {
            if (prioridad[a.tipo] !== prioridad[b.tipo]) {
                return prioridad[a.tipo] - prioridad[b.tipo];
            }

            if (a.tipo === 'mes-anterior') {
                return obtenerFechaLocal(b.fecha) - obtenerFechaLocal(a.fecha);
            }

            return 0;
        });

        contenedor.innerHTML = gruposOrdenados.map(grupo => {
            const nuevas = grupo.notificaciones.filter(
                n => n.estado === 'No leída'
            ).length;

            const contador = nuevas > 0
                ? `<span class="notif-grupo-nuevas">${nuevas} nuevas</span>`
                : '';

            return `
                <section class="notif-grupo">
                    <h2 class="notif-grupo-titulo">${escaparHTML(etiquetaGrupo(grupo.tipo, grupo.fecha))}${contador}</h2>
                    ${grupo.notificaciones.map(n => tarjetaNotificacion(n, grupo.tipo)).join('')}
                </section>`;
        }).join('');

        actualizarBotonMarcarTodas();
    });
}

/**
 * Convierte una fecha de MariaDB a una fecha local del navegador.
 * Evita conversiones innecesarias a UTC.
 *
 * @param {string|null} fecha - fecha de creación
 * @returns {Date|null}
 */
function obtenerFechaLocal(fecha) {
    if (!fecha) return null;

    const valor = String(fecha).trim();

    const partes = valor.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
    );

    if (partes) {
        return new Date(
            Number(partes[1]),
            Number(partes[2]) - 1,
            Number(partes[3]),
            Number(partes[4] || 0),
            Number(partes[5] || 0),
            Number(partes[6] || 0)
        );
    }

    const fechaConvertida = new Date(valor);

    return Number.isNaN(fechaConvertida.getTime())
        ? null
        : fechaConvertida;
}

/**
 * Construye la tarjeta de una notificación.
 *
 * @param {Object} n - datos de la notificación
 * @param {string} tipoGrupo - categoría temporal del grupo
 * @returns {string} HTML de la tarjeta
 */
function tarjetaNotificacion(n, tipoGrupo) {
    const noLeida = n.estado === 'No leída';

    if (noLeida) {
        notificacionesNoLeidasIds.push(n.id_notificacion);
    }

    const tipoIcono = (n.tipo || '').toLowerCase().includes('pago')
        ? 'fa-credit-card'
        : 'fa-calendar-check';

    let fechaVisible;

    if (!n.fecha_creacion) {
        fechaVisible = 'Fecha no disponible';
    } else if (tipoGrupo === 'hoy' || tipoGrupo === 'ayer') {
        fechaVisible = horaDe(n.fecha_creacion);
    } else {
        fechaVisible = fechaCorta(n.fecha_creacion);
    }

    return `
        <div class="notif ${noLeida ? 'no-leida' : ''}">
            <h3>
                <i class="fa-solid ${noLeida ? 'fa-bell' : 'fa-bell-slash'}"></i>
                ${escaparHTML(n.titulo)}
                ${noLeida ? '<span class="badge-noleida">Nueva</span>' : ''}
            </h3>
            <p class="notif-fecha"><strong>${escaparHTML(fechaVisible)}</strong></p>
            <p>${escaparHTML(horasA12h(n.mensaje))}</p>
            <small>
                <i class="fa-solid ${tipoIcono}"></i>
                Cliente: ${escaparHTML(n.nombre_cliente)} ${escaparHTML(n.apellido_cliente)}
                · ${escaparHTML(n.tipo)}
            </small>
            ${noLeida ? `<br><button class="btn btn-blue" style="margin-top:8px" onclick="marcarLeida(${n.id_notificacion})"><i class="fa-solid fa-check"></i> Marcar como leída</button>` : ''}
        </div>`;
}

/**
 * Obtiene la fecha en formato AAAA-MM-DD.
 *
 * @param {string} fecha - fecha de la notificación
 * @returns {string|null} clave del día
 */
function claveDia(fecha) {
    const dia = obtenerFechaLocal(fecha);

    if (!dia) return null;

    return `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
}

/**
 * Convierte la fecha de la notificación a hora de 12 horas.
 *
 * @param {string} fecha - fecha de la notificación
 * @returns {string} hora formateada
 */
function horaDe(fecha) {
    const fechaLocal = obtenerFechaLocal(fecha);

    if (!fechaLocal) return 'Hora no disponible';

    const hora = String(fechaLocal.getHours()).padStart(2, '0');
    const minutos = String(fechaLocal.getMinutes()).padStart(2, '0');

    return formatoHora12(`${hora}:${minutos}`);
}

/**
 * Clasifica las notificaciones según su fecha de creación.
 *
 * @param {string|null} fecha - fecha de la notificación
 * @returns {string} categoría temporal
 */
function clasificarDia(fecha) {
    const dia = obtenerFechaLocal(fecha);

    if (!dia) return 'sin-fecha';

    const fechaDia = new Date(
        dia.getFullYear(),
        dia.getMonth(),
        dia.getDate()
    );

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const anteayer = new Date(hoy);
    anteayer.setDate(anteayer.getDate() - 2);

    if (fechaDia.getTime() === hoy.getTime()) return 'hoy';
    if (fechaDia.getTime() === ayer.getTime()) return 'ayer';
    if (fechaDia.getTime() === anteayer.getTime()) return 'anteayer';

    // La semana comienza el lunes.
    const inicioSemana = new Date(hoy);
    const diaSemana = (hoy.getDay() + 6) % 7;
    inicioSemana.setDate(inicioSemana.getDate() - diaSemana);

    const inicioSemanaPasada = new Date(inicioSemana);
    inicioSemanaPasada.setDate(inicioSemanaPasada.getDate() - 7);

    if (fechaDia >= inicioSemana && fechaDia < hoy) {
        return 'esta-semana';
    }

    if (fechaDia >= inicioSemanaPasada && fechaDia < inicioSemana) {
        return 'semana-pasada';
    }

    if (
        dia.getFullYear() === hoy.getFullYear() &&
        dia.getMonth() === hoy.getMonth()
    ) {
        return 'este-mes';
    }

    return 'mes-anterior';
}

/**
 * Devuelve el nombre en español del mes.
 *
 * @param {string} fecha - fecha de la notificación
 * @returns {string} nombre del mes
 */
function nombreMes(fecha) {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril',
        'Mayo', 'Junio', 'Julio', 'Agosto',
        'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const fechaLocal = obtenerFechaLocal(fecha);

    return fechaLocal ? meses[fechaLocal.getMonth()] : '';
}

/**
 * Construye el encabezado de cada grupo.
 *
 * @param {string} tipo - categoría temporal del grupo
 * @param {string} fecha - fecha de referencia del grupo
 * @returns {string} etiqueta del grupo
 */
function etiquetaGrupo(tipo, fecha) {
    const etiquetas = {
        'hoy': 'Hoy',
        'ayer': 'Ayer',
        'anteayer': 'Anteayer',
        'esta-semana': 'Esta semana',
        'semana-pasada': 'Semana pasada',
        'este-mes': 'Este mes',
        'sin-fecha': 'Fecha no disponible'
    };

    if (etiquetas[tipo]) return etiquetas[tipo];

    const fechaLocal = obtenerFechaLocal(fecha);

    if (!fechaLocal) return 'Fecha no disponible';

    const anio = fechaLocal.getFullYear() !== new Date().getFullYear()
        ? ` ${fechaLocal.getFullYear()}`
        : '';

    return `${nombreMes(fecha)}${anio}`;
}

/**
 * Formatea la fecha corta de una notificación.
 *
 * @param {string} fecha - fecha de la notificación
 * @returns {string} día, mes abreviado y hora
 */
function fechaCorta(fecha) {
    const meses = [
        'ene', 'feb', 'mar', 'abr', 'may', 'jun',
        'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
    ];

    const fechaLocal = obtenerFechaLocal(fecha);

    if (!fechaLocal) return 'Fecha no disponible';

    return `${fechaLocal.getDate()} ${meses[fechaLocal.getMonth()]} · ${horaDe(fecha)}`;
}

/**
 * Los mensajes los arman triggers de la BD con la hora en 24h
 * ("... a las 14:30:00"). Esta función cambia cada hora HH:MM:SS
 * del texto a formato 12h ("... a las 2:30 PM").
 *
 * @param {string} texto - mensaje de la notificación
 * @returns {string} el mismo mensaje con las horas en 12h
 */
function horasA12h(texto) {
    return String(texto || '').replace(/\b(\d{2}:\d{2}):\d{2}\b/g, (_, hhmm) => formatoHora12(hhmm));
}

/**
 * Muestra el botón "Marcar todas como leídas" solo si hay notificaciones
 * pendientes.
 *
 * @returns {void}
 */
function actualizarBotonMarcarTodas() {
    const btn = document.getElementById('btnMarcarTodas');
    if (!btn) return;

    btn.style.display = notificacionesNoLeidasIds.length > 0 ? 'inline-flex' : 'none';
}

/**
 * Envía a Laravel la petición para marcar una notificación como leída.
 * La usan marcarLeida() y marcarTodasLeidas().
 *
 * @param {number} id - id_notificacion
 * @returns {Promise<Response>}
 */
function enviarMarcarLeida(id) {
    return fetchAuth(`${API_BASE}/api/admin/notificaciones/leer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id_notificacion: id })
    });
}

/**
 * Marca como leídas todas las notificaciones pendientes (en paralelo)
 * y luego recarga la lista.
 *
 * @returns {void}
 */
function marcarTodasLeidas() {
    if (notificacionesNoLeidasIds.length === 0) return;

    Promise.all(notificacionesNoLeidasIds.map(enviarMarcarLeida))
        .then(() => cargarNotificaciones());
}

/**
 * Marca una notificación como leída y recarga la lista.
 *
 * @param {number} id - id_notificacion
 * @returns {void}
 */
function marcarLeida(id) {
    enviarMarcarLeida(id)
    .then(res => res.json())
    .then(data => {
        if (data.ok) cargarNotificaciones();
    });
}

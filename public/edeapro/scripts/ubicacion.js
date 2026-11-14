/**
 * ubicacion.js — Página de Ubicación
 * =====================================
 * Maneja el carrusel de reseñas en abanico y el formulario para dejar una opinión.
 * Las reseñas se cargan desde Laravel y se muestran en un carrusel: la reseña
 * del centro se ve grande y nítida, y las de los lados más pequeñas, inclinadas
 * y desenfocadas. Avanza solo, se pausa con el cursor encima y respeta la
 * preferencia de "reducir movimiento" del sistema.
 * El formulario solo aparece si hay sesión de cliente activa.
 *
 * Conecta con la API de Laravel:
 *   GET  /api/resenas        → traer las reseñas (las más recientes primero)
 *   POST /api/resenas/crear  → guardar nueva reseña
 */

/* ── Configuración del carrusel (aquí se personaliza) ── */
const CARRUSEL = {
    maxResenas: 15,            // cuántas reseñas recientes se muestran
    segundosPorResena: 5,      // tiempo que cada reseña se queda en el centro
    suavizado: 0.09,           // fluidez del deslizamiento: 0.05 = más lento, 0.15 = más rápido
    visiblesPorLado: 2,        // tarjetas a cada lado de la central (computador)
    visiblesPorLadoMovil: 1,   // ...y en celular
    anchoMovil: 700,           // desde qué ancho (px) se considera celular
    separacion: 0.58,          // distancia entre tarjetas (fracción del ancho de una tarjeta)
    giro: 7,                   // grados de inclinación por posición (el "abanico")
    caida: 16,                 // px que baja cada posición lateral
    escalaLateral: 0.12,       // cuánto se achica cada posición (0.12 = 12 %)
    opacidadLateral: 0.35,     // cuánto se apaga cada posición
    desenfoque: 3,             // px de desenfoque por posición
    maxPuntos: 7               // puntos visibles abajo; con más reseñas se desplazan
};

let resenas                = [];
let tarjetas               = [];   // elementos <article> de cada reseña
let puntos                 = [];   // botones de los puntos de abajo
let posicion               = 0;    // dónde está el carrusel ahora (decimal mientras se mueve)
let objetivo               = 0;    // a dónde va
let anchoTarjeta           = 360;
let pausado                = false;
let temporizador           = null;
let animando               = null;
let ultimoTiempo           = 0;
let puntuacionSeleccionada = 0;

const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)');

// Al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    cargarResenas();
    verificarSesion();
    prepararCarrusel();

    // Estrellas interactivas del formulario
    document.querySelectorAll('.estrella').forEach(estrella => {

        // Al hacer clic selecciona la puntuación
        estrella.addEventListener('click', function () {
            puntuacionSeleccionada = parseInt(this.getAttribute('data-valor'));
            document.getElementById('puntuacion-valor').value = puntuacionSeleccionada;
            actualizarEstrellas(puntuacionSeleccionada);
        });

        // Al pasar el cursor muestra el hover
        estrella.addEventListener('mouseover', function () {
            actualizarEstrellas(parseInt(this.getAttribute('data-valor')));
        });

        // Al salir el cursor vuelve a la selección actual
        estrella.addEventListener('mouseout', function () {
            actualizarEstrellas(puntuacionSeleccionada);
        });
    });
});

/**
 * Verifica si hay sesión de cliente activa.
 * Si hay sesión muestra el formulario, si no muestra el link de login.
 */
function verificarSesion() {
    const user = JSON.parse(localStorage.getItem('user'));
    const rol  = localStorage.getItem('rol');

    if (user && rol === 'cliente') {
        document.getElementById('form-resena').style.display = 'block';
    } else {
        document.getElementById('resena-login-msg').style.display = 'block';
    }
}

/**
 * Trae las reseñas desde Laravel (vienen de la más nueva a la más vieja)
 * y muestra las más recientes en el carrusel.
 * Si no hay conexión muestra reseñas de ejemplo.
 */
function cargarResenas() {
    fetch(`${API_BASE}/api/resenas`)
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;
        resenas = data.resenas.slice(0, CARRUSEL.maxResenas);
        construirCarrusel();
    })
    .catch(() => {
        // Reseñas de ejemplo si no hay conexión con Laravel
        resenas = [
            { nombre_cliente: 'Felipe', apellido_cliente: 'Celis', puntuacion: 5, comentario: '¡El mejor spa canino! Max siempre vuelve tranquilo y con un corte perfecto.', fecha: '2025-01-10' },
            { nombre_cliente: 'Juan G.', apellido_cliente: '', puntuacion: 5, comentario: 'Muy profesionales. La atención y el servicio son geniales.', fecha: '2025-01-08' },
            { nombre_cliente: 'María', apellido_cliente: 'López', puntuacion: 4, comentario: 'Excelente servicio. Mi gato Mishu quedó perfecto después del grooming.', fecha: '2025-01-05' }
        ];
        construirCarrusel();
    });
}

/* =========================================================================
   CARRUSEL EN ABANICO
   ========================================================================= */

/**
 * Conecta los botones y eventos del carrusel. Se llama una sola vez;
 * las tarjetas se crean (y se vuelven a crear) en construirCarrusel().
 */
function prepararCarrusel() {
    const carrusel  = document.getElementById('resenas-carrusel');
    const escenario = document.getElementById('resenas-escenario');

    document.getElementById('resena-prev').addEventListener('click', () => moverResena(-1));
    document.getElementById('resena-next').addEventListener('click', () => moverResena(1));

    // Pausa con el cursor encima (para alcanzar a leer) o al navegar con teclado
    carrusel.addEventListener('mouseenter', () => { pausado = true;  detenerAutoplay(); });
    carrusel.addEventListener('mouseleave', () => { pausado = false; iniciarAutoplay(); });
    carrusel.addEventListener('focusin',    () => { pausado = true;  detenerAutoplay(); });
    carrusel.addEventListener('focusout',   e => {
        if (!carrusel.contains(e.relatedTarget)) { pausado = false; iniciarAutoplay(); }
    });

    // Flechas del teclado con el carrusel enfocado
    carrusel.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); moverResena(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); moverResena(1); }
    });

    // Deslizar con el dedo en celular
    let inicioX = null;
    escenario.addEventListener('pointerdown', e => { inicioX = e.clientX; });
    escenario.addEventListener('pointerup', e => {
        if (inicioX === null) return;
        const dx = e.clientX - inicioX;
        inicioX = null;
        if (Math.abs(dx) > 40) moverResena(dx < 0 ? 1 : -1);
    });

    // No avanzar con la pestaña oculta ni si el usuario pide menos movimiento
    document.addEventListener('visibilitychange', iniciarAutoplay);
    movimientoReducido.addEventListener('change', iniciarAutoplay);

    window.addEventListener('resize', () => { medirCarrusel(); pintarCarrusel(); });
}

/**
 * Crea una tarjeta por reseña y un punto por reseña.
 * Cada tarjeta tiene: arriba un círculo con las iniciales del cliente, su
 * nombre y la fecha; luego las estrellas y el comentario. Las comillas
 * decorativas las pone el CSS.
 */
function construirCarrusel() {
    const escenario = document.getElementById('resenas-escenario');
    const dots      = document.getElementById('resenas-dots');
    posicion = objetivo = 0;

    if (resenas.length === 0) {
        escenario.innerHTML = '<p class="resenas-vacio">Sé el primero en dejar una reseña.</p>';
        dots.innerHTML = '';
        tarjetas = puntos = [];
        escenario.style.height = '';
        return;
    }

    escenario.innerHTML = resenas.map((r, i) => {
        // Estrellas: siempre entre 0 y 5 llenas, el resto vacías
        const estrellasLlenas = Math.max(0, Math.min(5, parseInt(r.puntuacion) || 0));
        const estrellas = '★'.repeat(estrellasLlenas) + '☆'.repeat(5 - estrellasLlenas);

        const fecha = new Date(r.fecha).toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Iniciales para el círculo: "Felipe Celis" → "FC"
        const iniciales = ((r.nombre_cliente || '').charAt(0) + (r.apellido_cliente || '').charAt(0)).toUpperCase();

        // SEGURIDAD: todo texto escrito por usuarios pasa por escaparTextoResena,
        // para que se muestre como texto y nunca se ejecute como código (XSS)
        return `
            <article class="resena-card" data-indice="${i}" aria-roledescription="reseña" aria-label="Reseña ${i + 1} de ${resenas.length}">
                <div class="resena-cabecera">
                    <span class="resena-avatar" aria-hidden="true">${escaparTextoResena(iniciales)}</span>
                    <div>
                        <h4 class="resena-nombre">${escaparTextoResena(r.nombre_cliente)} ${escaparTextoResena(r.apellido_cliente)}</h4>
                        <span class="fecha">${fecha}</span>
                    </div>
                </div>
                <div class="rating" role="img" aria-label="${estrellasLlenas} de 5 estrellas">${estrellas}</div>
                <p class="resena-texto">${escaparTextoResena(r.comentario)}</p>
            </article>`;
    }).join('');

    dots.innerHTML = resenas.map((r, i) =>
        `<button type="button" aria-label="Ver reseña ${i + 1}" data-indice="${i}"></button>`
    ).join('');

    tarjetas = [...escenario.querySelectorAll('.resena-card')];
    puntos   = [...dots.querySelectorAll('button')];

    // Al tocar una tarjeta lateral o un punto, esa reseña pasa al centro
    tarjetas.forEach(t => t.addEventListener('click', () => irAResena(Number(t.dataset.indice))));
    puntos.forEach(p => p.addEventListener('click', () => irAResena(Number(p.dataset.indice))));

    medirCarrusel();
    pintarCarrusel();
    iniciarAutoplay();
    // Las fuentes web pueden cambiar el alto de las tarjetas al terminar de cargar
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { medirCarrusel(); pintarCarrusel(); });
}

/**
 * Distancia más corta (con signo) de una tarjeta al centro, dando la vuelta
 * al final: con 6 reseñas, la 5 está a -1 de la 0 (a su izquierda).
 */
function distanciaCircular(x) {
    const total = resenas.length;
    let d = ((x % total) + total) % total;
    if (d > total / 2) d -= total;
    return d;
}

/** Índice de la reseña que está (o va a quedar) en el centro */
function resenaActual() {
    const total = resenas.length;
    return ((Math.round(objetivo) % total) + total) % total;
}

/** Mide las tarjetas y ajusta el alto del escenario a la más alta */
function medirCarrusel() {
    if (tarjetas.length === 0) return;
    anchoTarjeta = tarjetas[0].offsetWidth;
    const masAlta = Math.max(...tarjetas.map(t => t.offsetHeight));
    // + espacio para la caída y la sombra de las laterales
    document.getElementById('resenas-escenario').style.height = (masAlta + 20 + CARRUSEL.caida * 2 + 70) + 'px';
}

/**
 * Coloca cada tarjeta según su distancia al centro: la central grande y
 * nítida; las demás más pequeñas, inclinadas, más bajas, transparentes y
 * desenfocadas. Se llama en cada cuadro mientras el carrusel se mueve.
 */
function pintarCarrusel() {
    if (tarjetas.length === 0) return;
    const C     = CARRUSEL;
    const total = resenas.length;
    const movil = document.getElementById('resenas-carrusel').clientWidth < C.anchoMovil;
    const lado  = Math.min(movil ? C.visiblesPorLadoMovil : C.visiblesPorLado, Math.floor((total - 1) / 2));
    const sep   = movil ? C.separacion * 0.45 : C.separacion;   // en celular las laterales asoman menos

    tarjetas.forEach((t, i) => {
        const d = distanciaCircular(i - posicion);
        const a = Math.abs(d);
        const desvanecer = Math.max(0, Math.min(1, lado + 1 - a));   // las que pasan del límite se apagan
        const opacidad   = Math.max(0.15, 1 - a * C.opacidadLateral) * desvanecer;

        t.style.transform =
            `translateX(${(d * anchoTarjeta * sep).toFixed(1)}px) ` +
            `translateY(${(a * C.caida).toFixed(1)}px) ` +
            `rotate(${(d * C.giro).toFixed(2)}deg) ` +
            `scale(${Math.max(0.55, 1 - a * C.escalaLateral).toFixed(3)})`;
        t.style.opacity       = opacidad.toFixed(3);
        t.style.filter        = a < 0.02 ? 'none' : `blur(${(a * C.desenfoque).toFixed(2)}px)`;
        t.style.zIndex        = String(100 - Math.round(a * 10));
        t.style.visibility    = opacidad < 0.01 ? 'hidden' : 'visible';
        t.style.pointerEvents = a > lado + 0.2 ? 'none' : 'auto';

        const enCentro = a < 0.5;
        t.classList.toggle('es-centro', enCentro);
        t.setAttribute('aria-hidden', enCentro ? 'false' : 'true');
    });

    // Puntos: con muchas reseñas solo se ven "maxPuntos" alrededor del activo,
    // y los de los extremos salen más pequeños para indicar que hay más
    const activo = resenaActual();
    const max    = Math.min(C.maxPuntos, total);
    const desde  = Math.min(Math.max(activo - Math.floor(max / 2), 0), total - max);
    const hasta  = desde + max - 1;
    puntos.forEach((p, i) => {
        const visible = i >= desde && i <= hasta;
        const hayMas  = (i === desde && desde > 0) || (i === hasta && hasta < total - 1);
        p.hidden = !visible;
        p.classList.toggle('active', i === activo);
        p.classList.toggle('dot-borde', visible && hayMas);
        p.setAttribute('aria-current', i === activo ? 'true' : 'false');
    });
}

/**
 * Un cuadro de la animación: acerca "posicion" a "objetivo" con suavidad
 * y vuelve a pintar. requestAnimationFrame la repite hasta llegar.
 */
function cuadroCarrusel(tiempo) {
    const dt = ultimoTiempo ? Math.min(64, tiempo - ultimoTiempo) : 16.7;
    ultimoTiempo = tiempo;
    // Suavizado independiente de los FPS (igual en pantallas de 60 y 120 Hz)
    const factor = movimientoReducido.matches ? 1 : 1 - Math.pow(1 - CARRUSEL.suavizado, dt / 16.7);
    posicion += (objetivo - posicion) * factor;
    if (Math.abs(objetivo - posicion) < 0.001) posicion = objetivo;
    pintarCarrusel();
    animando = posicion !== objetivo ? requestAnimationFrame(cuadroCarrusel) : null;
    if (!animando) ultimoTiempo = 0;
}

function animarCarrusel() {
    if (!animando) animando = requestAnimationFrame(cuadroCarrusel);
}

/**
 * Flechas del carrusel: -1 anterior, 1 siguiente.
 * Además de mover, reinician el conteo automático, para que no salte
 * justo después de que el usuario tocó una flecha.
 */
function moverResena(direccion) {
    if (resenas.length < 2) return;
    objetivo += direccion;
    animarCarrusel();
    iniciarAutoplay();
}

/** Lleva una reseña al centro por el camino más corto (al tocar un punto o una tarjeta) */
function irAResena(indice) {
    objetivo += distanciaCircular(indice - objetivo);
    animarCarrusel();
    iniciarAutoplay();
}

/**
 * Carrusel automático: cada segundosPorResena pasa a la siguiente.
 * No avanza si hay menos de 2 reseñas, con el cursor encima, con la
 * pestaña oculta o si el usuario pidió "reducir movimiento".
 */
function iniciarAutoplay() {
    detenerAutoplay();   // evita tener dos temporizadores a la vez
    if (pausado || movimientoReducido.matches || resenas.length < 2 || document.hidden) return;
    temporizador = setInterval(() => { objetivo += 1; animarCarrusel(); }, CARRUSEL.segundosPorResena * 1000);
}

/** Detiene el carrusel automático (por ejemplo, con el mouse encima) */
function detenerAutoplay() {
    clearInterval(temporizador);
    temporizador = null;
}

/**
 * Convierte los caracteres especiales de HTML (< > & " ') en texto inofensivo.
 * Así, si alguien escribe <script> en una reseña, se ve literalmente
 * "<script>" en pantalla en vez de ejecutarse.
 * @param {string} texto
 * @returns {string}
 */
function escaparTextoResena(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* =========================================================================
   FORMULARIO DE RESEÑA
   ========================================================================= */

/**
 * Actualiza el color de las estrellas según el valor hover o seleccionado.
 * @param {number} valor - Puntuación a resaltar (1-5)
 */
function actualizarEstrellas(valor) {
    document.querySelectorAll('.estrella').forEach(e => {
        e.classList.toggle('activa', parseInt(e.getAttribute('data-valor')) <= valor);
    });
}

/**
 * Envía la reseña a Laravel.
 * Valida que haya puntuación y comentario antes de enviar.
 * Recarga las reseñas después de guardar.
 */
function enviarResena() {
    const user       = JSON.parse(localStorage.getItem('user'));
    const comentario = document.getElementById('comentario-texto').value.trim();
    const mensaje    = document.getElementById('resena-mensaje');

    if (puntuacionSeleccionada === 0) {
        mensaje.textContent = 'Selecciona una puntuación.';
        mensaje.className   = 'message error';
        return;
    }
    if (!comentario) {
        mensaje.textContent = 'Escribe un comentario.';
        mensaje.className   = 'message error';
        return;
    }

    fetchAuth(`${API_BASE}/api/resenas/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            id_cliente: user.id_cliente,
            puntuacion: puntuacionSeleccionada,
            comentario: comentario
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            mensaje.textContent = '¡Gracias por tu reseña!';
            mensaje.className   = 'message success';
            // Limpiar el formulario
            document.getElementById('comentario-texto').value = '';
            puntuacionSeleccionada = 0;
            actualizarEstrellas(0);
            // Recargar reseñas para mostrar la nueva
            setTimeout(() => cargarResenas(), 1000);
        } else {
            mensaje.textContent = 'Error: ' + data.error;
            mensaje.className   = 'message error';
        }
    });
}
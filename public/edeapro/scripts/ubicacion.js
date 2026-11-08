/**
 * ubicacion.js — Página de Ubicación
 * =====================================
 * Maneja el carrusel de reseñas y el formulario para dejar una opinión.
 * Las reseñas se cargan desde Laravel y se muestran en un carrusel.
 * El formulario solo aparece si hay sesión de cliente activa.
 *
 * Conecta con la API de Laravel:
 *   GET  /api/resenas        → traer todas las reseñas
 *   POST /api/resenas/crear  → guardar nueva reseña
 */

let resenas              = [];
let indiceActual         = 0;   // página del carrusel que se está viendo
let porPagina            = 3;   // reseñas por página (cambia según el ancho)
let puntuacionSeleccionada = 0;

// ── Carrusel automático ──
const SEGUNDOS_POR_PAGINA = 6;  // cada cuánto pasa solo a la siguiente página
let temporizador          = null;

// Al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    porPagina = calcularPorPagina();
    cargarResenas();
    verificarSesion();

    // El carrusel se pausa mientras el usuario tiene el mouse encima
    // (para que alcance a leer) y sigue cuando lo quita.
    const carrusel = document.querySelector('.resenas-carrusel');
    carrusel.addEventListener('mouseenter', detenerAutoplay);
    carrusel.addEventListener('mouseleave', iniciarAutoplay);

    // Si cambia el ancho de la pantalla (girar el celular, achicar la
    // ventana), se recalcula cuántas reseñas caben por página.
    window.addEventListener('resize', function () {
        const nuevo = calcularPorPagina();
        if (nuevo !== porPagina) {
            porPagina    = nuevo;
            indiceActual = 0;
            renderizarResenas();
            renderizarDots();
        }
    });

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
 * Trae las reseñas desde Laravel y las muestra en el carrusel.
 * Si no hay conexión muestra reseñas de ejemplo.
 */
function cargarResenas() {
    fetch(`${API_BASE}/api/resenas`)
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;
        resenas = data.resenas;
        renderizarResenas();
        renderizarDots();
        iniciarAutoplay();
    })
    .catch(() => {
        // Reseñas de ejemplo si no hay conexión con Laravel
        resenas = [
            { nombre_cliente: 'Felipe', apellido_cliente: 'Celis', puntuacion: 5, comentario: '¡El mejor spa canino! Max siempre vuelve tranquilo y con un corte perfecto.', fecha: '2025-01-10' },
            { nombre_cliente: 'Juan G.', apellido_cliente: '', puntuacion: 5, comentario: 'Muy profesionales. La atención y el servicio son geniales.', fecha: '2025-01-08' },
            { nombre_cliente: 'María', apellido_cliente: 'López', puntuacion: 4, comentario: 'Excelente servicio. Mi gato Mishu quedó perfecto después del grooming.', fecha: '2025-01-05' }
        ];
        renderizarResenas();
        renderizarDots();
        iniciarAutoplay();
    });
}

/**
 * Cuántas reseñas caben por página según el ancho de la pantalla:
 * 1 en celular, 2 en tablet y 3 en computador.
 * (Debe coincidir con los anchos de .resena-card en ubicacion.css)
 */
function calcularPorPagina() {
    if (window.innerWidth <= 768)  return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
}

/**
 * Dibuja las reseñas de la página actual del carrusel.
 * Cada tarjeta tiene: comillas decorativas, estrellas, el comentario y,
 * abajo, un círculo con las iniciales del cliente, su nombre y la fecha.
 */
function renderizarResenas() {
    const track = document.getElementById('resenas-track');
    if (resenas.length === 0) {
        track.innerHTML = '<p class="resenas-vacio">Sé el primero en dejar una reseña.</p>';
        return;
    }

    // Qué reseñas tocan en esta página
    const inicio   = indiceActual * porPagina;
    const visibles = resenas.slice(inicio, inicio + porPagina);

    track.innerHTML = visibles.map(r => {
        // Estrellas: siempre entre 0 y 5 llenas, el resto vacías
        const puntos    = Math.max(0, Math.min(5, parseInt(r.puntuacion) || 0));
        const estrellas = '<i class="fa-solid fa-star"></i>'.repeat(puntos)
                        + '<i class="fa-regular fa-star"></i>'.repeat(5 - puntos);

        const fecha = new Date(r.fecha).toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Iniciales para el círculo: "Felipe Celis" → "FC"
        const iniciales = ((r.nombre_cliente || '').charAt(0) + (r.apellido_cliente || '').charAt(0)).toUpperCase();

        // SEGURIDAD: todo texto escrito por usuarios pasa por escaparTextoResena,
        // para que se muestre como texto y nunca se ejecute como código (XSS)
        return `
            <article class="resena-card">
                <i class="fa-solid fa-quote-right resena-comillas" aria-hidden="true"></i>
                <div class="rating" aria-label="${puntos} de 5 estrellas">${estrellas}</div>
                <p class="resena-texto">${escaparTextoResena(r.comentario)}</p>
                <div class="resena-autor">
                    <span class="resena-avatar">${escaparTextoResena(iniciales)}</span>
                    <div>
                        <h4>${escaparTextoResena(r.nombre_cliente)} ${escaparTextoResena(r.apellido_cliente)}</h4>
                        <span class="fecha">${fecha}</span>
                    </div>
                </div>
            </article>`;
    }).join('');

    // Reinicia la animación de entrada en cada cambio de página
    track.classList.remove('resenas-entrando');
    void track.offsetWidth;   // obliga al navegador a "olvidar" la animación anterior
    track.classList.add('resenas-entrando');
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

/**
 * Crea los dots de navegación del carrusel.
 * Un dot por cada página de reseñas.
 */
function renderizarDots() {
    const totalPaginas = Math.ceil(resenas.length / porPagina);
    const dots = document.getElementById('resenas-dots');
    dots.innerHTML = '';
    for (let i = 0; i < totalPaginas; i++) {
        dots.innerHTML += `<span class="${i === 0 ? 'active' : ''}" onclick="irAPagina(${i})"></span>`;
    }
}

/**
 * Flechas del carrusel (el HTML las llama con onclick="moverResena(-1)" o (1)).
 * Además de mover, reinician el conteo del carrusel automático, para que
 * no salte de página justo después de que el usuario tocó una flecha.
 * @param {number} direccion - 1 para siguiente, -1 para anterior
 */
function moverResena(direccion) {
    cambiarPagina(direccion);
    iniciarAutoplay();
}

/**
 * Pasa a la página anterior o siguiente. Al llegar al final vuelve a la
 * primera (y al revés), por eso se usa el residuo (%).
 */
function cambiarPagina(direccion) {
    const totalPaginas = Math.ceil(resenas.length / porPagina);
    if (totalPaginas === 0) return;
    indiceActual = (indiceActual + direccion + totalPaginas) % totalPaginas;
    renderizarResenas();
    actualizarDots();
}

/** Va directamente a una página específica del carrusel (al tocar un punto) */
function irAPagina(indice) {
    indiceActual = indice;
    renderizarResenas();
    actualizarDots();
    iniciarAutoplay();   // vuelve a contar desde cero
}

/**
 * Carrusel automático: cada SEGUNDOS_POR_PAGINA pasa a la siguiente página.
 * Si solo hay una página no hace nada (no hay a dónde pasar).
 */
function iniciarAutoplay() {
    detenerAutoplay();   // evita tener dos temporizadores a la vez
    if (Math.ceil(resenas.length / porPagina) <= 1) return;
    temporizador = setInterval(() => cambiarPagina(1), SEGUNDOS_POR_PAGINA * 1000);
}

/** Detiene el carrusel automático (por ejemplo, con el mouse encima) */
function detenerAutoplay() {
    clearInterval(temporizador);
    temporizador = null;
}

/** Actualiza el dot activo según la página actual */
function actualizarDots() {
    document.querySelectorAll('.resenas-dots span').forEach((dot, i) => {
        dot.classList.toggle('active', i === indiceActual);
    });
}

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
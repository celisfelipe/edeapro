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
let indiceActual         = 0;
const porPagina          = 3;
let puntuacionSeleccionada = 0;

// Al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    cargarResenas();
    verificarSesion();

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
    fetch('http://127.0.0.1:8000/api/resenas')
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;
        resenas = data.resenas;
        renderizarResenas();
        renderizarDots();
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
    });
}

/**
 * Renderiza las reseñas visibles según la página actual del carrusel.
 * Muestra 3 reseñas por página.
 */
function renderizarResenas() {
    const track = document.getElementById('resenas-track');
    if (resenas.length === 0) {
        track.innerHTML = '<p style="color:#888; text-align:center; width:100%;">Sé el primero en dejar una reseña.</p>';
        return;
    }

    // Calcular qué reseñas mostrar según la página actual
    const inicio   = indiceActual * porPagina;
    const visibles = resenas.slice(inicio, inicio + porPagina);

    track.innerHTML = '';
    visibles.forEach(r => {
        // Generar estrellas llenas y vacías según la puntuación
        const estrellas = '★'.repeat(r.puntuacion) + '☆'.repeat(5 - r.puntuacion);
        const fecha = new Date(r.fecha).toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        track.innerHTML += `
            <div class="resena-card">
                <h4>${r.nombre_cliente} ${r.apellido_cliente || ''}</h4>
                <div class="fecha">${fecha}</div>
                <div class="rating">${estrellas}</div>
                <p>"${r.comentario}"</p>
            </div>`;
    });
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
 * Navega entre páginas del carrusel.
 * @param {number} direccion - 1 para siguiente, -1 para anterior
 */
function moverResena(direccion) {
    const totalPaginas = Math.ceil(resenas.length / porPagina);
    indiceActual = (indiceActual + direccion + totalPaginas) % totalPaginas;
    renderizarResenas();
    actualizarDots();
}

/** Va directamente a una página específica del carrusel */
function irAPagina(indice) {
    indiceActual = indice;
    renderizarResenas();
    actualizarDots();
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

    fetch('http://127.0.0.1:8000/api/resenas/crear', {
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
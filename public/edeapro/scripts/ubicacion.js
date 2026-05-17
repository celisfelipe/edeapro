/**
 * ubicacion.js — Página de Ubicación
 * =====================================
 * Maneja el formulario de reseñas de la página de ubicación.
 * No conecta con la API de Laravel.
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.resena-form');
    if (form) {
        form.addEventListener('submit', handleSubmitResena);
    }
});

function handleSubmitResena(event) {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const puntuacion = document.getElementById('puntuacion').value;
    const comentario = document.getElementById('comentario').value.trim();
    const messageDiv = document.getElementById('message');

    // Validaciones
    if (!nombre || nombre.length < 3) {
        showMessage('❌ Por favor ingresa un nombre válido (mínimo 3 caracteres)', 'error', messageDiv);
        return;
    }

    if (!email || !isValidEmail(email)) {
        showMessage('❌ Por favor ingresa un email válido', 'error', messageDiv);
        return;
    }

    if (!puntuacion) {
        showMessage('❌ Por favor selecciona una puntuación', 'error', messageDiv);
        return;
    }

    if (!comentario || comentario.length < 10) {
        showMessage('❌ Por favor escribe un comentario más detallado (mínimo 10 caracteres)', 'error', messageDiv);
        return;
    }

    // Simular envío (aquí irá tu backend)
    console.log({
        nombre,
        email,
        puntuacion,
        comentario,
        fecha: new Date().toLocaleDateString('es-CO')
    });

    showMessage('✅ ¡Gracias por tu reseña! Nos alegra que hayas disfrutado de nuestro servicio.', 'success', messageDiv);

    // Limpiar formulario
    document.querySelector('.resena-form').reset();

    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showMessage(text, type, messageDiv) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
}
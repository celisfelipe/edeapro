/**
 * modal.js — Panel Administrador
 * ================================
 * Sistema de modales reutilizable para todo el panel admin.
 * Reemplaza los alert(), confirm() y prompt() del navegador
 * por ventanas personalizadas con el estilo del proyecto.
 *
 * Requiere en el HTML de cada página los 3 modales base:
 *   #modal-confirmar → para preguntas antes de acciones (cancelar, eliminar)
 *   #modal-exito     → para mensajes de operación exitosa
 *   #modal-error     → para mensajes de error
 *
 * Uso desde cualquier JS del admin:
 *   modalConfirmar('¿Estás seguro?', () => { ... acción ... });
 *   modalExito('Guardado correctamente.');
 *   modalError('Ocurrió un error.');
 */

/**
 * Muestra el modal de confirmación con un mensaje personalizado.
 * Si el usuario acepta, ejecuta la función callback onAceptar.
 * @param {string}   mensaje   - Texto de la pregunta
 * @param {function} onAceptar - Función que se ejecuta si confirma
 */
function modalConfirmar(mensaje, onAceptar) {
    const overlay = document.getElementById('modal-confirmar');
    document.getElementById('modal-confirmar-msg').textContent = mensaje;
    overlay.classList.add('open');

    // Al confirmar: cerrar el modal y ejecutar la acción
    document.getElementById('modal-confirmar-ok').onclick = function () {
        overlay.classList.remove('open');
        onAceptar();
    };

    // Al cancelar: solo cerrar el modal sin hacer nada
    document.getElementById('modal-confirmar-cancel').onclick = function () {
        overlay.classList.remove('open');
    };
}

/**
 * Muestra el modal de éxito con un mensaje personalizado.
 * @param {string} mensaje - Texto del mensaje de éxito
 */
function modalExito(mensaje) {
    const overlay = document.getElementById('modal-exito');
    document.getElementById('modal-exito-msg').textContent = mensaje;
    overlay.classList.add('open');

    document.getElementById('modal-exito-ok').onclick = function () {
        overlay.classList.remove('open');
    };
}

/**
 * Muestra el modal de error con un mensaje personalizado.
 * @param {string} mensaje - Texto del mensaje de error
 */
function modalError(mensaje) {
    const overlay = document.getElementById('modal-error');
    document.getElementById('modal-error-msg').textContent = mensaje;
    overlay.classList.add('open');

    document.getElementById('modal-error-ok').onclick = function () {
        overlay.classList.remove('open');
    };
}

// Cerrar cualquier modal al hacer clic fuera de él (clic en el fondo oscuro)
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
    }
});

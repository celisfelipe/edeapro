/**
 * modal.js — Panel Cliente
 * ========================
 * Sistema de modales para la página de perfil del cliente.
 * Igual al del panel admin pero independiente porque vive en cliente/.
 *
 * Requiere en el HTML los 3 modales:
 *   #modal-confirmar → confirmación antes de acciones destructivas
 *   #modal-exito     → mensaje de operación exitosa
 *   #modal-error     → mensaje de error
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

// Cerrar cualquier modal al hacer clic fuera de él
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
    }
});

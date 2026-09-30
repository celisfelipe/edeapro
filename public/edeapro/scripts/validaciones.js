/**
 * validaciones.js — Utilidades de validación de formularios
 * ==========================================================
 * Centraliza los regex y funciones de validación para reutilizarlos
 * en todos los formularios del proyecto (login, registro, empleados,
 * clientes, nueva contraseña, etc.).
 *
 * Cada función devuelve un objeto { ok: true/false, error: 'mensaje' }.
 * Si ok es true, el valor es válido; si no, error contiene el mensaje
 * para mostrarle al usuario.
 */

// ── Regex centralizados ────────────────────────────────────────────────────
const REGEX = {
    /** Solo letras (incluyendo tildes y ñ) y espacios, mínimo 2 caracteres */
    nombre:    /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/,

    /** Exactamente 10 dígitos numéricos */
    telefono:  /^\d{10}$/,

    /** Formato de correo electrónico estándar */
    correo:    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    /** Mínimo 8 caracteres, al menos una mayúscula y al menos un número */
    contrasena: /^(?=.*[A-Z])(?=.*\d).{8,}$/
};

// ── Funciones de validación ────────────────────────────────────────────────

/**
 * Valida un nombre o apellido.
 * Regla: solo letras (con tildes/ñ) y espacios, mínimo 2 caracteres.
 * @param {string} valor
 * @param {string} [etiqueta='Nombre'] - Etiqueta para el mensaje de error
 * @returns {{ ok: boolean, error: string }}
 */
function validarNombre(valor, etiqueta = 'Nombre') {
    if (!valor || !valor.trim()) return { ok: false, error: `${etiqueta} es obligatorio.` };
    if (!REGEX.nombre.test(valor.trim())) {
        return { ok: false, error: `${etiqueta} solo puede contener letras y espacios (mínimo 2 caracteres).` };
    }
    return { ok: true, error: '' };
}

/**
 * Valida un número de teléfono colombiano.
 * Regla: exactamente 10 dígitos numéricos.
 * @param {string} valor
 * @returns {{ ok: boolean, error: string }}
 */
function validarTelefono(valor) {
    if (!valor || !valor.trim()) return { ok: false, error: 'El teléfono es obligatorio.' };
    if (!REGEX.telefono.test(valor.trim())) {
        return { ok: false, error: 'El teléfono debe tener exactamente 10 dígitos numéricos.' };
    }
    return { ok: true, error: '' };
}

/**
 * Valida un correo electrónico.
 * @param {string} valor
 * @returns {{ ok: boolean, error: string }}
 */
function validarCorreo(valor) {
    if (!valor || !valor.trim()) return { ok: false, error: 'El correo es obligatorio.' };
    if (!REGEX.correo.test(valor.trim())) {
        return { ok: false, error: 'Ingresa un correo electrónico válido.' };
    }
    return { ok: true, error: '' };
}

/**
 * Valida una contraseña.
 * Regla: mínimo 8 caracteres, al menos una mayúscula y al menos un número.
 * @param {string} valor
 * @returns {{ ok: boolean, error: string }}
 */
function validarContrasena(valor) {
    if (!valor) return { ok: false, error: 'La contraseña es obligatoria.' };
    if (!REGEX.contrasena.test(valor)) {
        return { ok: false, error: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número.' };
    }
    return { ok: true, error: '' };
}

/**
 * Valida que dos contraseñas coincidan.
 * @param {string} contrasena
 * @param {string} confirmar
 * @returns {{ ok: boolean, error: string }}
 */
function validarConfirmarContrasena(contrasena, confirmar) {
    if (!confirmar) return { ok: false, error: 'Confirma la contraseña.' };
    if (contrasena !== confirmar) {
        return { ok: false, error: 'Las contraseñas no coinciden.' };
    }
    return { ok: true, error: '' };
}
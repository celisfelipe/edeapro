/**
 * Convierte caracteres peligrosos en texto inofensivo.
 * Usar siempre que se meta dato del usuario en innerHTML.
 */
function escaparHTML(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

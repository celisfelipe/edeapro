/**
 * darkmode.js — Modo Oscuro del Sitio Público
 * =============================================
 * Gestiona el modo oscuro usando localStorage.
 * Key: "darkMode" | Valores: "enabled" / "disabled"
 *
 * Aplica la clase "dark-mode" al <html> para activar las
 * variables CSS oscuras definidas en darkmode.css.
 *
 * Se carga en todas las páginas públicas que tienen el toggle.
 */

document.addEventListener('DOMContentLoaded', () => {

    const toggle     = document.getElementById('darkModeToggle');
    const toggleBall = document.querySelector('.toggle .ball');

    // Aplicar preferencia guardada al cargar la página
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.documentElement.classList.add('dark-mode');
        if (toggleBall) toggleBall.style.transform = 'translateX(26px)';
    }

    // Escuchar el clic en el toggle para cambiar el modo
    if (toggle) {
        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                document.documentElement.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'enabled');
            } else {
                document.documentElement.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'disabled');
            }
        });
    }
});

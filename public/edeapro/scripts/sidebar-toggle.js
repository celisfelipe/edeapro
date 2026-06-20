/* ================================================
   sidebar-toggle.js — Colapso/aperture del sidebar
   ================================================
   Controla el botón hamburguesa de los paneles de
   administrador y empleado:
     - En escritorio (>900px): colapsa el sidebar a una
       franja solo con íconos (clase body.sidebar-collapsed),
       estado persistido en localStorage.
     - En móvil/tablet (<=900px): despliega el sidebar como
       panel deslizante con overlay (clase body.sidebar-open),
       sin persistencia (siempre arranca cerrado).

   El estado guardado se restaura ANTES de este script (ver el
   <script> inline justo después de <body> en cada página) para
   evitar el parpadeo de pintar expandido y luego colapsar. Este
   archivo solo gestiona los clics, no la restauración inicial.

   No depende de ningún otro script de la página ni modifica
   funciones existentes.
================================================ */
(function () {
    var MOBILE_BREAKPOINT = 900;
    var STORAGE_KEY = 'sidebarCollapsed';
    var body = document.body;
    var btn = document.getElementById('sidebarToggle');
    var overlay = document.querySelector('.sidebar-overlay');

    function toggleSidebar() {
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            body.classList.toggle('sidebar-open');
        } else {
            body.classList.toggle('sidebar-collapsed');
            localStorage.setItem(STORAGE_KEY, body.classList.contains('sidebar-collapsed') ? '1' : '0');
        }
    }

    if (btn) {
        btn.addEventListener('click', toggleSidebar);
    }
    if (overlay) {
        overlay.addEventListener('click', function () {
            body.classList.remove('sidebar-open');
        });
    }
})();

/**
 * servicios.js — Página de Servicios
 * =====================================
 * Maneja los filtros de la página de servicios (botones de categoría).
 * Filtra las tarjetas de servicios visualmente sin petición a la API.
 * Es puramente visual — no conecta con Laravel.
 */

const botones = document.querySelectorAll(".btn-filtro");

botones.forEach(boton => {

    boton.addEventListener("click", () => {

        botones.forEach(b => b.classList.remove("active"));

        boton.classList.add("active");

    });

});

/* ── Fade-up al scroll para las cards de servicios ── */
document.addEventListener('DOMContentLoaded', () => {
    const fadeObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                fadeObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up').forEach(el => fadeObs.observe(el));
});

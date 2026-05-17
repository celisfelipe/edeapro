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

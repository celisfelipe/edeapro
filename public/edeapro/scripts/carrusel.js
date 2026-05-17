/**
 * carrusel.js — Carrusel Alternativo
 * =====================================
 * Carrusel para páginas de servicios.
 * No conecta con la API de Laravel.
 */

let currentSlide = 0;
const slides = document.querySelectorAll(".carrusel-item");

function showSlide(index) {
    slides.forEach(slide => slide.classList.remove("active"));
    slides[index].classList.add("active");
}

function nextSlide() {
    currentSlide++;
    if (currentSlide >= slides.length) {
        currentSlide = 0;
    }
    showSlide(currentSlide);
}

function prevSlide() {
    currentSlide--;
    if (currentSlide < 0) {
        currentSlide = slides.length - 1;
    }
    showSlide(currentSlide);
}

document.querySelector(".next").addEventListener("click", nextSlide);
document.querySelector(".prev").addEventListener("click", prevSlide);

// Cambio automático cada 5 segundos
setInterval(nextSlide, 5000);
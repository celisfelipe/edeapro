/**
 * inicio.js — Página Principal del Sitio
 * =========================================
 * Maneja el carrusel, animaciones y scroll de la página de inicio.
 * No conecta con la API de Laravel — es puramente visual.
 */

/**
 * EDEA PRO - Carrusel y Animaciones
 * Script mejorado sin bugs para galería de imágenes y efectos
 */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ============================================
    // CARRUSEL - Sistema robusto
    // ============================================
    class Carousel {
        constructor() {
            this.slides = document.querySelectorAll('.carrusel-item');
            this.dots = document.querySelectorAll('.dot');
            this.prevBtn = document.querySelector('.carrusel-control.prev');
            this.nextBtn = document.querySelector('.carrusel-control.next');
            this.currentIndex = 0;
            this.autoPlayInterval = null;
            this.isTransitioning = false;

            if (this.slides.length === 0) return;

            this.init();
        }

        init() {
            this.setupEventListeners();
            // Si el HTML ya tiene un slide activo, respetarlo para no
            // interrumpir las animaciones CSS que ya empezaron.
            const activeIdx = Array.from(this.slides).findIndex(s => s.classList.contains('active'));
            if (activeIdx >= 0) {
                this.currentIndex = activeIdx;
            } else {
                this.showSlide(0);
            }
            this.startAutoPlay();
        }

        setupEventListeners() {
            // Botones de navegación
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', () => this.previousSlide());
            }
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', () => this.nextSlide());
            }

            // Dots (indicadores)
            this.dots.forEach((dot, index) => {
                dot.addEventListener('click', () => this.goToSlide(index));
            });

            // Pausar auto-play en hover
            const heroSection = document.getElementById('carrusel-hero');
            if (heroSection) {
                heroSection.addEventListener('mouseenter', () => this.pauseAutoPlay());
                heroSection.addEventListener('mouseleave', () => this.startAutoPlay());
            }

            // Detectar cambio de visibilidad (tab change)
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.pauseAutoPlay();
                } else {
                    this.showSlide(this.currentIndex);
                    this.startAutoPlay();
                }
            });
        }

        showSlide(index) {
            if (this.slides.length === 0) return;

            // Validar índice
            if (index >= this.slides.length) {
                this.currentIndex = 0;
            } else if (index < 0) {
                this.currentIndex = this.slides.length - 1;
            } else {
                this.currentIndex = index;
            }

            // Remover clase active de todos
            this.slides.forEach(slide => slide.classList.remove('active'));
            this.dots.forEach(dot => dot.classList.remove('active'));

            // Agregar clase active al actual
            this.slides[this.currentIndex].classList.add('active');
            if (this.dots[this.currentIndex]) {
                this.dots[this.currentIndex].classList.add('active');
            }
        }

        nextSlide() {
            if (this.isTransitioning) return;
            this.isTransitioning = true;
            this.showSlide(this.currentIndex + 1);
            this.resetAutoPlay();
            setTimeout(() => { this.isTransitioning = false; }, 300);
        }

        previousSlide() {
            if (this.isTransitioning) return;
            this.isTransitioning = true;
            this.showSlide(this.currentIndex - 1);
            this.resetAutoPlay();
            setTimeout(() => { this.isTransitioning = false; }, 300);
        }

        goToSlide(index) {
            if (this.isTransitioning) return;
            this.isTransitioning = true;
            this.showSlide(index);
            this.resetAutoPlay();
            setTimeout(() => { this.isTransitioning = false; }, 300);
        }

        startAutoPlay() {
            if (this.autoPlayInterval) return;
            this.autoPlayInterval = setInterval(() => {
                this.nextSlide();
            }, 5000);
        }

        pauseAutoPlay() {
            if (this.autoPlayInterval) {
                clearInterval(this.autoPlayInterval);
                this.autoPlayInterval = null;
            }
        }

        resetAutoPlay() {
            this.pauseAutoPlay();
            this.startAutoPlay();
        }
    }

    // Instanciar carrusel
    const carousel = new Carousel();

    // ============================================
    // KEYBOARD NAVIGATION PARA CARRUSEL
    // ============================================
    document.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowLeft') {
            carousel.previousSlide();
        } else if (event.key === 'ArrowRight') {
            carousel.nextSlide();
        }
    });

    // ============================================
    // PRELOAD IMÁGENES DEL CARRUSEL
    // ============================================
    const images = document.querySelectorAll('.carrusel-item img');
    let loadedImages = 0;

    images.forEach(img => {
        const tempImg = new Image();
        tempImg.onload = () => {
            loadedImages++;
            if (loadedImages === images.length) {
                console.log('✓ Todas las imágenes del carrusel cargadas');
            }
        };
        tempImg.onerror = () => {
            console.warn('⚠ Error al cargar imagen:', img.src);
        };
        tempImg.src = img.src;
    });

    // ============================================
    // PERFORMANCE: Reduce animaciones si el dispositivo es lento
    // ============================================
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.style.setProperty('--transition-smooth', 'all 0.05s linear');
        document.documentElement.style.setProperty('--transition-fast', 'all 0.03s linear');
    }

    // ============================================
    // LOG INICIALIZACIÓN
    // ============================================
    console.log('✓ EDEA PRO - Carrusel e interactividad inicializados correctamente');
    console.log('✓ Dispositivo:', window.innerWidth > 768 ? 'Desktop' : 'Mobile');
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================
window.addEventListener('error', function(e) {
    console.error('⚠ Error no capturado:', e.message);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('⚠ Promise rechazada:', e.reason);
});



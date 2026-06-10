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
        // Delay de 100ms para que el CSS detecte el cambio de clase
        // y active el zoom Ken Burns desde el primer slide
        setTimeout(() => {
            this.showSlide(0);
            this.startAutoPlay();
        }, 100);
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

        destroy() {
            this.pauseAutoPlay();
        }
    }

    // Instanciar carrusel
    const carousel = new Carousel();

    // ============================================
    // SCROLL ANIMATIONS - Aparición de elementos
    // ============================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`;
        observer.observe(card);
    });

    // ============================================
    // SMOOTH SCROLL PARA LINKS INTERNOS
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '') return;

            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();
            const offsetTop = target.offsetTop - 80;

            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        });
    });

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
    // RIPPLE EFFECT EN BOTONES
    // ============================================
    const buttons = document.querySelectorAll('.cta-carrusel-primary, .cta-card, .cta-login a, .social-links a');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.width = '0';
            ripple.style.height = '0';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.5)';
            ripple.style.pointerEvents = 'none';
            ripple.style.transform = 'translate(-50%, -50%)';
            ripple.style.animation = 'ripple-animation 0.6s ease-out';

            if (this.style.position === 'static') {
                this.style.position = 'relative';
            }

            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Agregar estilos de animación si no existen
    if (!document.querySelector('style[data-ripple]')) {
        const style = document.createElement('style');
        style.setAttribute('data-ripple', 'true');
        style.textContent = `
            @keyframes ripple-animation {
                to {
                    width: 300px;
                    height: 300px;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

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
    // DETECTAR NAVEGADOR Y APLICAR COMPATIBILIDAD
    // ============================================
    const ua = navigator.userAgent;
    if (ua.includes('MSIE') || ua.includes('Trident')) {
        document.body.classList.add('is-ie');
        console.warn('⚠ Navegador legacy detectado');
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



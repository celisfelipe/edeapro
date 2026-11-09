# ==========================================================================
# Dockerfile — EDEA PRO (Laravel 12 + PHP 8.2)
# --------------------------------------------------------------------------
# "Receta" para construir la caja que Railway pone en internet.
# Cada instrucción es un paso; Docker los ejecuta de arriba hacia abajo.
# El servidor es el mismo de desarrollo: php artisan serve.
# ==========================================================================

# 1. Punto de partida: un Linux que ya trae PHP 8.2
FROM php:8.2-cli

# 2. Programas del sistema que necesitan las extensiones de PHP
#    (imágenes para los PDF y archivos .zip para los Excel)
RUN apt-get update && apt-get install -y \
        libpng-dev libjpeg62-turbo-dev libfreetype6-dev libzip-dev unzip \
    && rm -rf /var/lib/apt/lists/*

# 3. Extensiones de PHP: conexión a MySQL, imágenes (gd) y zip
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql gd zip

# 4. Composer (el instalador de librerías de PHP), copiado de su imagen oficial
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 5. Copiar el código del proyecto dentro de la caja
WORKDIR /app
COPY . .

# 6. Instalar las librerías (Laravel, PDF, Excel), sin las de desarrollo
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 7. Carpetas donde Laravel escribe (logs, caché) y donde van las fotos
RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions \
             storage/framework/views bootstrap/cache public/uploads/fotos

# 8. Atender hasta 4 visitas al mismo tiempo (el servidor de PHP, por
#    defecto, atiende una sola a la vez)
ENV PHP_CLI_SERVER_WORKERS=4

# 9. Al encender la caja (no al construirla):
#    - guardar la configuración en caché (aquí ya existen las variables)
#    - encender el servidor en el puerto que asigna Railway (PORT)
CMD php artisan config:cache \
    && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}

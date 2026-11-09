# ==========================================================================
# Dockerfile — EDEA PRO (Laravel 12 + PHP 8.2 + Apache)
# --------------------------------------------------------------------------
# "Receta" para construir la caja que Railway pone en internet.
# Cada instrucción es un paso; Docker los ejecuta de arriba hacia abajo.
# ==========================================================================

# 1. Punto de partida: un Linux que ya trae PHP 8.2 y el servidor web Apache
FROM php:8.2-apache

# 2. Programas del sistema que necesitan las extensiones de PHP
#    (imágenes para los PDF y archivos .zip para los Excel)
RUN apt-get update && apt-get install -y \
        libpng-dev libjpeg62-turbo-dev libfreetype6-dev libzip-dev unzip \
    && rm -rf /var/lib/apt/lists/*

# 3. Extensiones de PHP: conexión a MySQL, imágenes (gd) y zip
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql gd zip

# 4. Apache: la página pública de Laravel está en /public, y se permite
#    que el .htaccess de Laravel maneje las rutas (/api/...)
RUN sed -i 's!DocumentRoot /var/www/html!DocumentRoot /var/www/html/public!' \
        /etc/apache2/sites-available/000-default.conf \
    && printf '<Directory /var/www/html/public>\n    AllowOverride All\n</Directory>\n' \
        > /etc/apache2/conf-available/laravel.conf \
    && a2enconf laravel \
    && a2enmod rewrite

# 5. Composer (el instalador de librerías de PHP), copiado de su imagen oficial
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 6. Copiar el código del proyecto dentro de la caja
WORKDIR /var/www/html
COPY . .

# 7. Instalar las librerías (Laravel, PDF, Excel), sin las de desarrollo
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 8. Carpetas donde Laravel escribe (logs, caché, fotos) y permiso para
#    que Apache (usuario www-data) pueda escribir en ellas
RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions \
             storage/framework/views bootstrap/cache public/uploads/fotos \
    && chown -R www-data:www-data storage bootstrap/cache public/uploads

# 9. Al encender la caja (no al construirla):
#    - usar el puerto que asigna Railway (variable PORT; 80 si no hay)
#    - dar permiso de escritura a la carpeta de fotos
#    - guardar la configuración en caché (aquí ya existen las variables)
#    - encender Apache
CMD sed -i "s/Listen 80/Listen ${PORT:-80}/" /etc/apache2/ports.conf \
    && sed -i "s/:80>/:${PORT:-80}>/" /etc/apache2/sites-available/000-default.conf \
    && chown -R www-data:www-data public/uploads \
    && php artisan config:cache \
    && apache2-foreground
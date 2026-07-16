# The Core Engine
FROM php:8.3-cli

# Install system dependencies and PostgreSQL drivers
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip

# Inject Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set the working directory
WORKDIR /app

# Copy the codebase into the container
COPY . .

# Install production dependencies
RUN composer install --optimize-autoloader --no-dev

# Unlock internal memory folders
RUN chmod -R 777 storage bootstrap/cache

# BYPASS PRE-DEPLOY & NUKE CACHE: Clear config, run migration, then boot the server
# The definitive wipe-and-run command
CMD php artisan config:clear && php artisan cache:clear && php artisan route:clear && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT
# Despliegue a producción

Guía paso a paso para poner Family Budget en un servidor real. La app son **dos piezas**: API Laravel (PHP+MySQL) y SPA React (estáticos servidos por nginx/apache). Ambas deben quedar en **dominios hermanos** para que las cookies Sanctum funcionen.

> Ejemplos asumen Ubuntu 22.04 + nginx + PHP-FPM 8.3 + MySQL 8 + Let's Encrypt. Adapta a tu hosting.

---

## 0. Decisión previa: dominios

Necesitas elegir antes de empezar. Dos opciones válidas:

- **Recomendado** — dominios hermanos:
  - `api.familybudget.tudominio.com` → Laravel
  - `app.familybudget.tudominio.com` → SPA React
  - `SESSION_DOMAIN=.familybudget.tudominio.com` (con punto inicial, así la cookie cruza ambos subdominios).

- **Alternativa más simple** — un solo dominio con nginx haciendo de proxy:
  - `familybudget.tudominio.com/` → sirve la SPA (estáticos del `dist/`).
  - `familybudget.tudominio.com/api/*` y `/sanctum/*` → proxy_pass al backend Laravel.
  - `SESSION_DOMAIN=familybudget.tudominio.com` (sin punto).

El resto de la guía usa la opción A (`api.*` + `app.*`).

---

## 1. Pre-requisitos en el servidor

```bash
# Sistema
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git unzip curl

# PHP 8.3 + extensiones que pide Laravel
sudo apt install -y php8.3-fpm php8.3-cli php8.3-mysql php8.3-mbstring \
  php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath php8.3-intl

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Node + npm (para compilar el frontend en el servidor; alternativa: subir el dist/ ya compilado)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

---

## 2. Base de datos

Conectar como root y crear BD + usuario dedicado:

```sql
CREATE DATABASE family_budget CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'family_budget'@'localhost' IDENTIFIED BY 'PON_AQUI_UN_PASSWORD_FUERTE';
GRANT ALL PRIVILEGES ON family_budget.* TO 'family_budget'@'localhost';
FLUSH PRIVILEGES;
```

Apunta el password en un gestor seguro — irá al `.env` del backend.

---

## 3. Subir el código

Opción git (recomendada — facilita updates):

```bash
sudo mkdir -p /var/www/family-budget
sudo chown -R $USER:www-data /var/www/family-budget
cd /var/www/family-budget
git clone https://github.com/rscosca/family-budget.git .
```

Estructura resultante:

```
/var/www/family-budget/
├── backend/   ← Laravel
├── frontend/  ← React + Vite
└── docs/
```

> Si prefieres no tener `.git` en producción, haz `git archive` o `rsync` solo de `backend/` y `frontend/` (sin `node_modules`, sin `vendor`, sin `.env`).

---

## 4. Backend Laravel

### 4.1. Instalar dependencias

```bash
cd /var/www/family-budget/backend
composer install --no-dev --optimize-autoloader
```

### 4.2. Crear `.env` de producción

```bash
cp .env.example .env
php artisan key:generate
```

Editar `.env` con los valores reales. Variables críticas:

```env
APP_NAME="Family Budget"
APP_ENV=production
APP_KEY=base64:...                         # generada por key:generate, no tocar
APP_DEBUG=false
APP_URL=https://api.familybudget.tudominio.com
FRONTEND_URL=https://app.familybudget.tudominio.com

LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306                                # puerto real, no el 8889 de MAMP
DB_DATABASE=family_budget
DB_USERNAME=family_budget
DB_PASSWORD=el_password_que_pusiste_en_paso_2
# DB_SOCKET=                                 ← borrar/dejar vacío, era de MAMP

# Sanctum + sesión cross-domain
SANCTUM_STATEFUL_DOMAINS=app.familybudget.tudominio.com
SESSION_DOMAIN=.familybudget.tudominio.com   # con punto inicial
SESSION_SECURE_COOKIE=true                   # obligatorio con HTTPS
SESSION_SAME_SITE=lax

# Locale
APP_LOCALE=es
APP_FALLBACK_LOCALE=es
```

> Si el frontend va en el **mismo dominio** que el backend (opción B del paso 0), pon `SESSION_DOMAIN=familybudget.tudominio.com` (sin punto) y `SANCTUM_STATEFUL_DOMAINS=familybudget.tudominio.com`.

### 4.3. Permisos

```bash
sudo chown -R www-data:www-data /var/www/family-budget/backend/storage \
  /var/www/family-budget/backend/bootstrap/cache
sudo chmod -R 775 /var/www/family-budget/backend/storage \
  /var/www/family-budget/backend/bootstrap/cache
```

### 4.4. Migrar y sembrar datos por defecto

**Solo migrar (sin datos):**

```bash
php artisan migrate --force                  # --force evita el prompt en producción
```

**Sembrar usuarios + miembros + categorías por defecto** (recomendado para primer arranque — son los datos del briefing):

```bash
php artisan db:seed --class=UserSeeder --force
php artisan db:seed --class=FamilyMemberSeeder --force
php artisan db:seed --class=CategorySeeder --force
```

> Esto crea los 2 usuarios `papa` / `mama` con las contraseñas literales del seeder (`P1234_apa` / `M1234_ama`). **Cámbialas inmediatamente** desde la app (Ajustes → Cambiar contraseña) o editando el seeder antes de ejecutarlo.

**NO ejecutes** `RecurringExpenseSeeder` ni `ExpenseSeeder` en producción — son datos demo de desarrollo (8 recurrentes fake + ~115 gastos de prueba). El `DatabaseSeeder.php` los incluye, por eso conviene llamar a los seeders uno por uno como arriba en lugar de `php artisan db:seed`.

### 4.5. Optimización Laravel

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

> Cada vez que cambies `.env` o despliegues código nuevo, ejecuta `php artisan optimize:clear` y vuelve a cachear.

---

## 5. Frontend React

### 5.1. Variables de entorno

Crea `/var/www/family-budget/frontend/.env.production`:

```env
VITE_API_URL=https://api.familybudget.tudominio.com
```

### 5.2. Build

```bash
cd /var/www/family-budget/frontend
npm ci
npm run build
```

Resultado: `frontend/dist/` con `index.html` y assets hasheados. Esto es lo que servirá nginx para `app.familybudget.tudominio.com`.

> Alternativa: compila en tu máquina local y sube solo `dist/` por rsync. Así no necesitas Node en el servidor.

---

## 6. Nginx — dos vhosts

### 6.1. Backend `api.familybudget.tudominio.com`

`/etc/nginx/sites-available/family-budget-api`:

```nginx
server {
    listen 80;
    server_name api.familybudget.tudominio.com;
    root /var/www/family-budget/backend/public;

    index index.php;
    charset utf-8;

    client_max_body_size 10M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    error_log /var/log/nginx/family-budget-api.error.log;
    access_log /var/log/nginx/family-budget-api.access.log;
}
```

### 6.2. Frontend `app.familybudget.tudominio.com`

`/etc/nginx/sites-available/family-budget-app`:

```nginx
server {
    listen 80;
    server_name app.familybudget.tudominio.com;
    root /var/www/family-budget/frontend/dist;

    index index.html;

    # SPA fallback: cualquier ruta a index.html (React Router se encarga)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache largo para assets hasheados
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    error_log /var/log/nginx/family-budget-app.error.log;
    access_log /var/log/nginx/family-budget-app.access.log;
}
```

Activar y recargar:

```bash
sudo ln -s /etc/nginx/sites-available/family-budget-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/family-budget-app /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. HTTPS con Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx \
  -d api.familybudget.tudominio.com \
  -d app.familybudget.tudominio.com
```

Certbot reescribe los vhosts añadiendo `listen 443 ssl` + redirect HTTP→HTTPS. Renovación automática vía systemd timer.

Una vez con HTTPS, asegúrate de que en `backend/.env` está `SESSION_SECURE_COOKIE=true` y refresca cachés:

```bash
cd /var/www/family-budget/backend && php artisan optimize:clear && php artisan config:cache
```

---

## 8. Verificación post-deploy

1. `curl -I https://api.familybudget.tudominio.com/` → 200 (Laravel welcome o redirect).
2. Visita `https://app.familybudget.tudominio.com/` → debe cargar la SPA.
3. Login con `papa` / `P1234_apa` → debería entrar.
4. **Cambia inmediatamente** las dos contraseñas desde Ajustes → "Cambiar contraseña".
5. Crea un gasto desde `/nuevo-gasto`, mira que aparece en Dashboard e Historial.
6. (Si eres admin) Entra en `/admin/categorias` y `/admin/miembros`, verifica CRUD.

Si algo falla, mira los logs:

```bash
tail -f /var/www/family-budget/backend/storage/logs/laravel.log
tail -f /var/log/nginx/family-budget-api.error.log
tail -f /var/log/nginx/family-budget-app.error.log
```

---

## 9. Actualizar la app (despliegues posteriores)

```bash
cd /var/www/family-budget
git pull

# Backend
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache && php artisan route:cache && php artisan view:cache

# Frontend
cd ../frontend
npm ci
npm run build
```

No suele hacer falta reiniciar nginx ni PHP-FPM salvo que cambie config.

---

## 10. Lo que NO está cubierto (futuro)

- **Gastos recurrentes automáticos** — el modelo y servicio existen pero no hay scheduler. Si en el futuro quieres que se generen solos cada mes, registra `RecurringExpenseGenerator` en `routes/console.php` o `app/Console/Kernel.php` y añade un cron del sistema: `* * * * * cd /var/www/family-budget/backend && php artisan schedule:run >> /dev/null 2>&1`.
- **Backups MySQL** — añade un cron con `mysqldump`:
  ```cron
  0 3 * * * mysqldump -u family_budget -p'PASSWORD' family_budget | gzip > /backups/family_budget_$(date +\%F).sql.gz
  ```
- **Monitorización de errores** — considera Sentry, Bugsnag o similar. Hoy solo está `storage/logs/laravel.log` rotando.
- **Tests** — el proyecto tiene solo `ExampleTest`. Cuando crezca, añade Pest/PHPUnit para `ExpenseController` y `AuthController`.

---

## Resumen ultra-corto

```bash
# 1. servidor con PHP 8.3 + MySQL 8 + nginx + Node 20
# 2. CREATE DATABASE family_budget; CREATE USER family_budget;
# 3. git clone ... /var/www/family-budget
# 4. backend: composer install --no-dev, .env con APP_ENV=production +
#    DB_* + SANCTUM_STATEFUL_DOMAINS + SESSION_DOMAIN=.tudominio.com +
#    SESSION_SECURE_COOKIE=true + APP_KEY generada
# 5. php artisan migrate --force
# 6. php artisan db:seed --class=UserSeeder --force (idem FamilyMember y Category)
# 7. frontend: VITE_API_URL=https://api.tudominio.com + npm ci + npm run build
# 8. nginx: vhost api (FastCGI a Laravel public/) + vhost app (SPA con try_files /index.html)
# 9. certbot --nginx -d api.* -d app.*
# 10. cambiar contraseñas papa/mama desde Ajustes
```

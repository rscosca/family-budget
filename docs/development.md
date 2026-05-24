# Desarrollo local

Guía para arrancar Family Budget en local con MAMP + Laravel `artisan serve` + Vite.

## Prerequisitos

- **MAMP** instalado y arrancado (solo se usa para MySQL).
- **PHP ≥ 8.2** disponible en el sistema (`php -v`). Si lo tienes con Homebrew y falla por `libvmaf`, ejecuta `brew reinstall aom`.
- **Composer ≥ 2** (`composer --version`).
- **Node ≥ 20** y **npm ≥ 10**.

## Arquitectura local

```
┌────────────────────────────────────────────────────────────┐
│  MAMP MySQL  ──────────────────────────► family_budget DB  │
│  127.0.0.1:8889                         /Applications/MAMP │
└────────────────────────────────────────────────────────────┘
                  ▲
                  │ DB_SOCKET / DB_HOST+PORT
                  │
┌─────────────────┴──────────────────┐         ┌─────────────────────────────┐
│  Laravel API                       │ ◄─XHR── │  React + Vite               │
│  php artisan serve                 │         │  npm run dev                │
│  http://localhost:8000             │         │  http://localhost:5173      │
└────────────────────────────────────┘         └─────────────────────────────┘
```

Auth: cookies httpOnly emitidas por Laravel y enviadas por el navegador con `credentials: 'include'`. CORS y Sanctum están configurados para permitir `localhost:5173`.

## Primer arranque (one-time setup)

### 1. Arrancar MAMP

- Abrir MAMP, click en **Start Servers**.
- Verificar que MySQL escucha en el puerto **8889** (Preferences → Ports).
- Credenciales por defecto: `root / root`.

### 2. Crear la base de datos

```bash
/Applications/MAMP/Library/bin/mysql80/bin/mysql \
  --socket=/Applications/MAMP/tmp/mysql/mysql.sock \
  -uroot -proot \
  -e "CREATE DATABASE IF NOT EXISTS family_budget CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

> Atajo equivalente: phpMyAdmin desde el WebStart de MAMP → New → `family_budget`.

### 3. Backend (Laravel)

```bash
cd backend
cp .env.example .env          # primera vez
php artisan key:generate
php artisan migrate
```

> Las variables relevantes ya están en `.env`:
> ```
> DB_CONNECTION=mysql
> DB_HOST=127.0.0.1
> DB_PORT=8889
> DB_DATABASE=family_budget
> DB_USERNAME=root
> DB_PASSWORD=root
> DB_SOCKET=/Applications/MAMP/tmp/mysql/mysql.sock
> SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
> FRONTEND_URL=http://localhost:5173
> ```

### 4. Frontend (React + Vite)

```bash
cd frontend
npm install
```

## Día a día

Necesitas 3 cosas levantadas a la vez:

| # | Servicio | Cómo se arranca |
| --- | --- | --- |
| 1 | MAMP MySQL | Botón Start en la app de MAMP |
| 2 | Laravel API | `cd backend && php artisan serve` → http://localhost:8000 |
| 3 | Frontend Vite | `cd frontend && npm run dev` → http://localhost:5173 |

> En desarrollo, accede siempre por **http://localhost:5173** (no por el `:8000` de Laravel). Vite sirve la UI y la API se consume vía CORS desde la SPA.

## Comandos útiles

### Laravel (`cd backend`)

```bash
php artisan serve                  # arranca API en :8000
php artisan migrate                # aplica migraciones pendientes
php artisan migrate:fresh --seed   # borra todo y reseedea (cuidado)
php artisan route:list             # lista de rutas
php artisan tinker                 # REPL para inspeccionar modelos
php artisan db                     # CLI MySQL conectada a family_budget
```

### Vite (`cd frontend`)

```bash
npm run dev                        # arranca en :5173 con HMR
npm run build                      # build producción a dist/
npm run preview                    # sirve el build localmente
```

### MySQL directo

```bash
# Atajo: añade un alias a tu .zshrc
alias fbmysql='/Applications/MAMP/Library/bin/mysql80/bin/mysql --socket=/Applications/MAMP/tmp/mysql/mysql.sock -uroot -proot family_budget'

# Uso:
fbmysql
> SHOW TABLES;
```

## Flujo de autenticación Sanctum (SPA)

Una vez tengamos `/login` implementado, el flujo desde el frontend será:

1. **Inicializar CSRF cookie** (una vez):
   ```ts
   await fetch('http://localhost:8000/sanctum/csrf-cookie', { credentials: 'include' });
   ```
2. **Login**:
   ```ts
   await fetch('http://localhost:8000/login', {
     method: 'POST',
     credentials: 'include',
     headers: {
       'Content-Type': 'application/json',
       'Accept': 'application/json',
       'X-XSRF-TOKEN': /* leer cookie XSRF-TOKEN y URL-decodificar */,
     },
     body: JSON.stringify({ email, password }),
   });
   ```
3. **Peticiones autenticadas**: cualquier `fetch` con `credentials: 'include'` lleva la cookie de sesión automáticamente.

> El cliente HTTP del proyecto (en `frontend/src/lib/api.ts`, todavía por crear) encapsulará este flujo.

## Resolución de problemas

| Síntoma | Probable causa | Fix |
| --- | --- | --- |
| `php -v` da error de `libvmaf` | aom Homebrew enlazado contra libvmaf vieja | `brew reinstall aom` |
| `SQLSTATE[HY000] [2002]` al migrar | MAMP MySQL no está arrancado | Abrir MAMP y pulsar Start |
| Vite carga pero peticiones a API dan CORS | `FRONTEND_URL` en `.env` mal o falta reiniciar `php artisan serve` | Comprobar `.env`, reiniciar serve |
| `419 PAGE EXPIRED` en `POST /login` | Falta `X-XSRF-TOKEN` o no se llamó antes a `/sanctum/csrf-cookie` | Mandar el header con la cookie URL-decoded |
| `401 Unauthenticated` cuando deberías estar logueado | Cookie de sesión no se está enviando | `credentials: 'include'` en el fetch |

## Notas de despliegue (futuro, no urgente)

- En producción, frontend y backend irán en dominios hermanos (`api.familia.com` y `app.familia.com`) para que las cookies funcionen.
- `SANCTUM_STATEFUL_DOMAINS` debe incluir el dominio del frontend.
- `SESSION_DOMAIN` debe ser `.familia.com` (con punto inicial) para que la cookie cruce subdominios.
- `APP_URL` y `FRONTEND_URL` apuntan a producción.
- `APP_DEBUG=false`, `APP_ENV=production`.

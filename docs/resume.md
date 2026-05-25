# Resume técnico — Family Budget

Visión panorámica de cómo funciona la app, separada en backend y frontend. Para detalle: `data-model.md`, `api.md`, `development.md`, `README.md`.

## En una frase

App familiar (2 usuarios) de control de gastos: API Laravel + SPA React conectadas por cookies Sanctum. Cada gasto se atribuye a un **miembro de familia** (etiqueta), distinto del **usuario** que lo registra.

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│  React SPA (Vite build)                                  │
│  app.tudominio.com                                       │
│                                                          │
│  - React Router 7                                        │
│  - AuthContext con hidratación inicial vía /api/user     │
│  - fetch a la API con credentials: 'include' + CSRF      │
└──────────────────────┬───────────────────────────────────┘
                       │ XHR + cookies Sanctum (httpOnly)
                       ▼
┌──────────────────────────────────────────────────────────┐
│  Laravel 12 API                                          │
│  api.tudominio.com                                       │
│                                                          │
│  - Sanctum SPA (cookies, no tokens)                      │
│  - Gate admin via App\Concerns\EnsuresAdmin              │
│  - laravel-lang/common para mensajes en español          │
│  - Soft delete vía is_active=false                       │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
                  MySQL 8 (family_budget)
```

**Pieza clave**: las cookies Sanctum son httpOnly y `same-site`. Por eso frontend y backend deben estar en el mismo dominio o subdominios hermanos (`SESSION_DOMAIN=.tudominio.com`).

---

## Backend (Laravel 12)

### Stack y librerías

- **Framework**: Laravel 12 (PHP 8.2+).
- **Auth**: Laravel Sanctum modo SPA (cookies, no tokens).
- **i18n**: `laravel-lang/common` con `lang/es/*.php` para mensajes en español + `lang/es.json` para frases custom.
- **BD**: MySQL 8.

### Estructura

```
backend/
├── app/
│   ├── Concerns/EnsuresAdmin.php          ← trait con assertAdmin() para gates
│   ├── Http/Controllers/Api/
│   │   ├── AuthController.php             ← login, logout, updatePassword
│   │   ├── CategoryController.php         ← CRUD categories + soft delete
│   │   ├── FamilyMemberController.php     ← CRUD miembros + soft delete
│   │   └── ExpenseController.php          ← CRUD gastos + filtros
│   ├── Http/Requests/                     ← Form Requests para validación
│   ├── Http/Resources/                    ← API Resources (ExpenseResource, etc.)
│   ├── Models/
│   │   ├── User.php                       ← username + role + avatar_initials
│   │   ├── FamilyMember.php               ← color, icon, is_active, display_order
│   │   ├── Category.php                   ← color, icon, is_active
│   │   ├── Expense.php                    ← amount_cents, occurred_on, FKs
│   │   └── RecurringExpense.php           ← plantilla (modelo + migración existen, sin scheduler)
│   └── Services/
│       └── RecurringExpenseGenerator.php  ← genera fechas mensuales con clamp al último día
├── database/
│   ├── migrations/                        ← 8 archivos (users extendida + 4 tablas dominio + Sanctum/jobs/cache)
│   └── seeders/                           ← UserSeeder, FamilyMemberSeeder, CategorySeeder, RecurringExpenseSeeder, ExpenseSeeder
├── lang/
│   ├── es.json                            ← frases sueltas en español
│   └── es/                                ← validation.php, auth.php, http-statuses.php, actions.php, pagination.php, passwords.php
└── routes/api.php                         ← todas las rutas dentro de /api/*
```

### Modelo de datos

5 tablas de dominio:

- **`users`** — quien hace login. `username` (no email), `role` (`admin` | `collaborator`), `avatar_initials`.
- **`family_members`** — a quién se atribuye un gasto (Papá, Mamá, Claudia, Pablo, Familia). Campos: `name`, `color`, `icon`, `display_order`, `is_active`.
- **`categories`** — tipos de gasto (Comida, Casa, Ocio, Familia). Mismos campos que members.
- **`expenses`** — gasto puntual. `amount_cents` (int), `occurred_on` (date), `description`, FKs a `user_id` (quien registra), `family_member_id`, `category_id`, opcional `recurring_expense_id`.
- **`recurring_expenses`** — plantilla mensual. `day_of_month`, `starts_on`, `ends_on`, importe, FKs. **No hay scheduler**: al crear se materializan todas las instancias hasta `ends_on` directamente en `expenses`.

Detalle de columnas en `data-model.md`.

### Endpoints

Todas las rutas autenticadas requieren cookie de sesión + header `X-XSRF-TOKEN`.

```
POST   /api/auth/login            público — username + password
POST   /api/auth/logout           auth   — invalida sesión, regenera CSRF
PATCH  /api/auth/password        auth   — current_password + password + confirmation
GET    /api/user                  auth   — datos del usuario logueado

GET    /api/categories            auth   — activas (?include_inactive=true para admin)
POST   /api/categories            admin
PATCH  /api/categories/{id}       admin
DELETE /api/categories/{id}       admin  — soft delete (is_active=false)

GET    /api/family-members        auth
POST   /api/family-members        admin
PATCH  /api/family-members/{id}   admin
DELETE /api/family-members/{id}   admin  — soft delete

GET    /api/expenses              auth   — filtros: from, to, category_id, family_member_id, search, per_page
GET    /api/expenses/{id}         auth
POST   /api/expenses              auth   — toggle is_recurring + interval + ends_on materializa instancias
PATCH  /api/expenses/{id}         auth
DELETE /api/expenses/{id}         auth   — hard delete

GET    /sanctum/csrf-cookie       público — setea XSRF-TOKEN
```

Detalle completo en `api.md`.

### Decisiones de diseño relevantes

- **Importes en céntimos**: la API devuelve y acepta `amount_cents` (int). El frontend convierte con `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`. Evita errores de coma flotante.
- **Auth por username, no email**: el email queda como informativo.
- **Permisos**: cualquier auth puede CRUD gastos. Solo admin gestiona categorías, miembros, usuarios y recurrentes (gate vía `EnsuresAdmin::assertAdmin()`).
- **Soft delete** en categorías y miembros con `is_active=false` para no romper FK de gastos históricos. Reactivar = `PATCH { is_active: true }`.
- **Recurrentes materializados**: el toggle "Repetir cada mes" en el form de gasto genera todas las instancias futuras en una transacción. Cada instancia se trata como gasto suelto a partir de ahí (editar una no afecta a la serie). Clamp al último día del mes si `day_of_month` no existe (febrero, etc.).
- **Sin endpoints `/stats/*`**: los agregados (donut por categoría, comparativa mes anterior, etc.) se calculan en cliente con los gastos ya cargados. A mover a backend cuando crezca el volumen.
- **Validaciones en español**: vía `laravel-lang/common` + atributos custom (`amount_cents` → "importe", etc.) en `lang/es/validation.php`.

---

## Frontend (React 19 + Vite + TypeScript)

### Stack

- **React 19** + **TypeScript** + **Vite 8**.
- **Tailwind CSS v4** con directiva `@theme` en CSS (no hay `tailwind.config`).
- **React Router v7** (`react-router-dom`).
- **Lucide React** para iconografía.

### Estructura

```
frontend/src/
├── App.tsx                      ← BrowserRouter + AuthProvider + rutas + RequireAuth
├── main.tsx                     ← bootstrap
├── index.css                    ← @theme con tokens de color + radios + import Google Fonts
├── lib/
│   ├── api.ts                   ← apiFetch + ensureCsrf + ApiError, credentials: 'include'
│   ├── auth.ts                  ← changePassword
│   ├── expenses.ts              ← listExpenses, createExpense, updateExpense, deleteExpense,
│   │                              getExpense, listCategories, listFamilyMembers,
│   │                              createCategory, updateCategory, deleteCategory,
│   │                              createFamilyMember, updateFamilyMember, deleteFamilyMember
│   ├── types.ts                 ← Category, FamilyMember, Expense, Paginated<T>, ExpenseFilters
│   ├── format.ts                ← formatEur, formatMonth, formatDayLabel, isoDate, startOfMonth, endOfMonth
│   └── icons.ts                 ← getIcon(name) → Lucide component (con fallback)
├── context/
│   └── AuthContext.tsx          ← AuthProvider + useAuth, hidrata con GET /api/user
├── components/
│   ├── Layout.tsx               ← sidebar lg+, bottom-nav móvil, FAB amarillo (oculto en /nuevo-gasto)
│   ├── PageHeader.tsx           ← título + subtítulo + slot trailing
│   ├── RequireAuth.tsx          ← guard de rutas que redirige a /login
│   ├── ExpenseRow.tsx           ← fila clicable de gasto (Link a /gasto/:id)
│   ├── CategoryDonut.tsx        ← donut SVG nativo con leyenda
│   ├── ExpenseForm.tsx          ← form compartido crear/editar gasto (con toggle recurrente)
│   ├── FilterSheet.tsx          ← bottom sheet con multi-select categorías y miembros
│   └── EntityFormSheet.tsx      ← sheet crear/editar categoría o miembro (nombre, color, icono, activo)
└── pages/
    ├── Login.tsx                ← /login (fuera de Layout)
    ├── Dashboard.tsx            ← / pills día/semana/mes, donut, lista últimos
    ├── Historial.tsx            ← /historial KPIs + búsqueda + filtros multi + grouped by day
    ├── Familia.tsx              ← /familia nav meses + total + tarjeta/miembro expandible
    ├── Ajustes.tsx              ← /ajustes sesión + cambio password + admin links
    ├── NuevoGasto.tsx           ← /nuevo-gasto wrapper de ExpenseForm
    ├── EditarGasto.tsx          ← /gasto/:id carga, edita, borra
    ├── AdminCategorias.tsx      ← /admin/categorias CRUD + soft delete (solo admin)
    └── AdminMiembros.tsx        ← /admin/miembros CRUD + soft delete (solo admin)
```

### Routing

```
/login         → Login            (fuera de RequireAuth/Layout)
/              → Dashboard        (RequireAuth + Layout)
/historial     → Historial         ↑
/familia       → Familia           ↑
/ajustes       → Ajustes           ↑
/nuevo-gasto   → NuevoGasto        ↑
/gasto/:id     → EditarGasto       ↑
/admin/categorias → AdminCategorias (solo admin)
/admin/miembros   → AdminMiembros   (solo admin)
```

`AuthProvider` envuelve todo; las rutas admin además comprueban `user.role === 'admin'` y redirigen a `/ajustes` si no.

### Flujo de auth

1. Al montar, `AuthProvider` llama `GET /api/user` (ignora 401 silencioso).
2. Login: `apiFetch('/api/auth/login', { method: 'POST', json })`.
3. `apiFetch` se encarga internamente de:
   - Llamar a `/sanctum/csrf-cookie` la primera vez (cachea el flag).
   - Leer la cookie `XSRF-TOKEN`, URL-decoded.
   - Añadir `X-XSRF-TOKEN` y `credentials: 'include'` a las mutaciones.
4. Logout: `POST /api/auth/logout` + `resetCsrfCache()` para forzar nuevo CSRF.
5. Cambio de password: `PATCH /api/auth/password`. La sesión sigue activa.

### Diseño y tokens

Dark mode con acento amarillo, mobile-first. Tokens en `src/index.css` vía `@theme`:

```
Colores:  --color-bg #121212, --color-surface #1E1E1E, --color-border #2C2C2C,
          --color-accent #FACC15, --color-accent-fg #171717,
          --color-fg #F9FAFB, --color-muted #9CA3AF,
          --color-cat-comida #F97316, --color-cat-casa #3B82F6,
          --color-cat-ocio #A855F7, --color-cat-familia #34D399

Fuentes:  font-display Lato, font-sans Roboto, font-mono Roboto Mono

Radios:   --radius-card 16px, --radius-pill 999px, --radius-btn 12px
          (uso: rounded-[var(--radius-card)] — Tailwind v4 no genera utilidades automáticas para custom radii)
```

### Layout responsive

- **`< lg` (móvil)**: bottom-nav fijo (Inicio · Historial · Familia · Ajustes) + FAB amarillo `+` flotante bottom-right (oculto en `/nuevo-gasto`). `main` lleva `pb-44` para no quedar tapado por FAB/nav (subido desde `pb-32` el 2026-05-25 tras auditoría UX).
- **`>= lg` (desktop)**: sidebar 240px a la izquierda con logo, botón "Nuevo gasto", nav y bloque user+logout abajo. Sidebar es esqueleto inicial — desktop sin pulir por decisión "mobile-first".

### Variables de entorno

- `frontend/.env` → `VITE_API_URL=http://localhost:8000` (dev).
- `frontend/.env.production` → `VITE_API_URL=https://api.familybudget.tudominio.com`.

---

## Funcionalidades por pantalla

| Ruta | Qué hace |
|---|---|
| `/login` | Login por username + password. |
| `/` (Dashboard) | Pills día/semana/mes (filtro temporal), donut de gastos por categoría, lista de últimos 4 movimientos. |
| `/historial` | Nav de meses con botón "Hoy", KPIs (total mes + media diaria + comparativa vs mes anterior), buscador, FilterSheet (multi cat./miembro), lista agrupada por día. |
| `/familia` | Nav de meses, total mensual, tarjeta por miembro con % del total y expandible para ver sus gastos (top 10). |
| `/ajustes` | Sesión actual, cambio de contraseña, atajos a `/admin/categorias` y `/admin/miembros` si admin, logout. |
| `/nuevo-gasto` | Form completo: importe → categoría → miembro → fecha → descripción → toggle "Repetir cada mes" (admin). |
| `/gasto/:id` | Mismo form precargado + botón borrar. |
| `/admin/categorias` | CRUD con soft delete. Tarjetas con chevron de affordance y botón Power para desactivar (no Trash2, ya que no es delete real). |
| `/admin/miembros` | Idéntico a categorías. |

---

## Comandos de desarrollo

```bash
make up        # backend (:8000) + frontend (:5173) en paralelo
make stop      # mata ambos
make seed      # migrate:fresh + DatabaseSeeder
make routes    # listar rutas API
make tinker    # REPL Eloquent
make test      # phpunit/pest (placeholder hoy)
make lint      # eslint frontend
make fe-build  # build Vite a dist/
```

Credenciales seed: `papa` / `P1234_apa` (admin), `mama` / `M1234_ama` (collaborator).

---

## Lo que NO está implementado (intencionalmente o pendiente)

| Tema | Estado | Decisión |
|---|---|---|
| **Scheduler de recurrentes** | Modelo y servicio existen, pero no hay `php artisan schedule` ni cron. | Toggle "Repetir cada mes" materializa N gastos al crear (atajo). Si crece el uso, registrar el generator en `routes/console.php`. |
| **CRUD admin de usuarios** | No implementado. | Descartado 2026-05-25: solo 2 usuarios reales. Solo queda "Cambiar contraseña" en Ajustes. |
| **UI de gestión de series recurrentes** | No implementado. | Descartado 2026-05-24: cada instancia se trata como gasto suelto desde la creación. |
| **Endpoints `/api/stats/*`** | No implementado. | Los agregados se calculan en cliente. Mover a backend cuando el volumen crezca. |
| **Tests automáticos** | Solo `ExampleTest` por defecto. | Sin red de seguridad — añadir Pest cuando haya tiempo. |
| **Desktop pulido** | Sidebar mínimo funcionando. | Decisión "mobile-first": no invertir en desktop hasta tener todo el resto cerrado. |
| **PWA / offline** | No. | Decisión 2026-05-20: web normal por ahora. Posible mejora futura. |

---

## Documentación relacionada

- `README.md` — briefing producto + paleta + estado.
- `data-model.md` — esquema de BD completo (columnas, tipos, FKs).
- `api.md` — endpoints REST detallados con bodies de request/response.
- `development.md` — arrancar el proyecto en local.
- `production.md` — desplegar a producción.
- `pending.md` — verificaciones pendientes + lista de mejoras futuras.
- `CLAUDE.md` — guía persistente para sesiones con Claude Code.

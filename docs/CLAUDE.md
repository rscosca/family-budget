# CLAUDE.md — Guía para futuras sesiones

Este archivo es contexto persistente para Claude Code. Léelo al empezar cada sesión nueva en este repo.

## Sobre el proyecto

**Family Budget** — App familiar de control de gastos. Briefing completo en [`README.md`](./README.md).

Sintetizando:
- **Usuario ≠ miembro de familia.** 2 usuarios (yo + mujer, hacen login). 5 miembros de familia editables (Papá, Mamá, Claudia, Pablo, Familia — son las "personas" a las que se atribuye un gasto).
- Gastos puntuales + gastos recurrentes con periodicidad.
- Dashboard con gráficos por categoría y filtros por día/semana/mes.
- Historial con buscador, filtros y agrupación por día.
- Mobile-first **y responsive a desktop**, dark mode con acento amarillo.

## Stack acordado

- **Backend**: Laravel (API REST)
- **Frontend**: React (SPA, mobile-first). Web normal, sin PWA por ahora.
- **BD**: MySQL
- **Importes**: enteros en céntimos (`int unsigned`). Formateo a "12,47 €" en el frontend
- **Auth**: Laravel Sanctum modo SPA (cookies httpOnly). React y Laravel en dominios hermanos

> No proponer alternativas tipo Next.js full-stack o un solo-frontend con localStorage. El usuario quiere Laravel + React explícitamente y la app necesita servidor (multi-usuario, scheduler para recurrentes).

## Forma de trabajar

- **Idioma**: español. Tutear.
- **Memoria persistente**: actualizar memoria al cerrar iteraciones con decisiones nuevas. Memorias en `~/.claude/projects/-Users-rsaenz-Sites-rscosca-family-budget/memory/`.
- **No adelantar trabajo**: pregunta antes de implementar módulos grandes; el usuario va paso a paso.
- **Briefing como fuente de verdad visual**: cuando haya dudas de UI, mirar primero `briefing/html/*.html` (tokens, espaciados, componentes) y `briefing/screenshots/*.jpg`.

## Sistema de diseño (referencia rápida)

### Tokens

```
--bg: #121212;          --surface: #1E1E1E;     --border: #2C2C2C;
--accent: #FACC15;      --accent-text: #171717;
--text-primary: #F9FAFB;
--text-secondary: #9CA3AF;

--cat-comida: #F97316;
--cat-casa:   #3B82F6;
--cat-ocio:   #A855F7;
--cat-familia:#34D399;

--radius-card: 16px;  --radius-pill: 999px;  --radius-btn: 12px;
--space: xs 4, sm 8, md 16, lg 24, xl 32, 2xl 48
```

### Tipografías
- Lato (display, 600/700)
- Roboto (body, 400/500)
- Roboto Mono (importes y números)

### Iconografía
- Lucide (`utensils`, `house`, `circle-play`, `users`, `plus`, `clock`, `settings`, `message-square`, `sliders-horizontal`).

### Layout
- Frame mobile 390px. En desktop se mantiene 390 centrado.
- Bottom nav: Inicio · Historial · [FAB+ amarillo] · Familia · Ajustes.

## Modelo de datos preliminar

> Borrador para discutir, no implementado todavía.

Detalle completo en [`data-model.md`](./data-model.md). Resumen:

- **users**: quienes hacen login (admin/collaborator).
- **family_members**: a quién se atribuye un gasto (Papá, Mamá, Claudia, Pablo, Familia…).
- **categories**: tipos de gasto (Comida, Casa, Ocio, Familia…).
- **expenses**: gastos puntuales — referencian categoría, miembro de familia y usuario registrador.
- **recurring_expenses**: plantilla mensual/semanal/anual; el scheduler genera filas reales en `expenses`.

## Decisiones abiertas

(ninguna por el momento.)

## Decisiones cerradas

- 2026-05-20: BD → MySQL.
- 2026-05-20: Importes → enteros en céntimos (`int unsigned`).
- 2026-05-20: Sin PWA por ahora; web normal. Revisable cuando el producto esté maduro.
- 2026-05-20: Auth → Sanctum modo SPA (cookies httpOnly). React y Laravel desplegados en dominios hermanos.
- 2026-05-20: Usuario (login) ≠ miembro de familia. Tabla `family_members` independiente, gestionable desde la página Familia (solo admin). Seed: Papá, Mamá, Claudia, Pablo, Familia.
- 2026-05-20: Permisos de gastos puntuales → cualquier usuario autenticado puede crear/editar/borrar (uso interno familiar, no se necesita trazabilidad fina).
- 2026-05-20: La API devuelve importes solo en céntimos (`amount_cents`). El frontend formatea con `Intl.NumberFormat`.
- 2026-05-20: Patrón responsive desktop → sidebar lateral en `>=lg` (mismos items que el bottom nav móvil) + contenido fluido con max-width cómodo.
- 2026-05-20: La hora del gasto no se guarda ni se muestra; solo la fecha (`occurred_on date`).
- 2026-05-20: No habrá endpoint específico para "últimos N movimientos"; se resuelve con `GET /api/expenses?per_page=4`.
- 2026-05-20: No habrá i18n. UI 100% en español hardcodeado.
- 2026-05-20: No habrá gestión de avatar de cabecera. Se renderizan iniciales calculadas del nombre del usuario logueado.
- 2026-05-20: Login por `username` (columna unique en `users`), no por email. Usuarios seedeados: `papa` (admin) y `mama` (collaborator). Passwords generadas con md5 y bcrypteadas.

## Estructura del repo (ya creada)

```
family-budget/
├── backend/          ← Laravel 12 + Sanctum SPA + MySQL
├── frontend/         ← React + Vite + TypeScript
├── briefing/         ← screenshots + HTML estáticos
└── docs/             ← README.md, CLAUDE.md, data-model.md, api.md, development.md
```

Para arrancar local: ver `docs/development.md`. Resumen:
- MAMP arrancado (MySQL :8889)
- Backend: `cd backend && php artisan serve` → http://localhost:8000
- Frontend: `cd frontend && npm run dev` → http://localhost:5173

## Estado del scaffold (último avance: 2026-05-20)

### Backend
- Laravel 12 en `backend/`, `php artisan install:api` ejecutado (Sanctum + `routes/api.php`).
- `bootstrap/app.php` con `statefulApi()` + `shouldRenderJsonWhen()` → `/api/*` siempre devuelve JSON.
- `.env` apuntando a MySQL de MAMP (`:8889` + socket `/Applications/MAMP/tmp/mysql/mysql.sock`).
- `SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173`.
- `config/cors.php` con credentials + origin `http://localhost:5173`.

### Modelo de datos (5 tablas + base Laravel)
- Migraciones: `users` (con `username` unique, `role`, `avatar_initials`), `family_members`, `categories`, `recurring_expenses`, `expenses`.
- Modelos Eloquent en `app/Models/` con relaciones y `$casts`. `User::isAdmin()` disponible.
- Seeders ejecutados con `php artisan migrate:fresh --seed`:
  - **Users**: `papa` (admin) y `mama` (collaborator). Login por `username`. Passwords md5 bcrypteadas — el `UserSeeder` imprime las contraseñas en consola.
  - **FamilyMembers**: Papá, Mamá, Claudia, Pablo, Familia (con colores).
  - **Categories**: Comida, Casa, Ocio, Familia (con iconos Lucide del briefing).

### Frontend
- React + Vite + TypeScript en `frontend/`.
- **Tailwind v4** (via `@tailwindcss/vite`) con tokens del briefing en `src/index.css` (`@theme`).
- **React Router** v7 con rutas: `/`, `/historial`, `/familia`, `/ajustes`, `/nuevo-gasto`, `/login`.
- **Lucide React** para iconografía.
- Estructura:
  - `src/components/Layout.tsx` — shell con sidebar (lg+) y bottom-nav (móvil), FAB amarillo
  - `src/components/PageHeader.tsx` — cabecera reutilizable (título + subtítulo + trailing)
  - `src/pages/*.tsx` — 6 páginas stub con placeholders
- Fuentes cargadas: Lato (display), Roboto (body), Roboto Mono (importes).
- Tokens disponibles como utilidades Tailwind: `bg-surface`, `text-fg`, `text-muted`, `bg-accent`, `text-accent-fg`, `border-border`, `bg-cat-comida/casa/ocio/familia`, `font-display/sans/mono`.

### Smoke tests OK (2026-05-20)
- `GET /api/user` → 401 JSON ✓
- `GET /sanctum/csrf-cookie` → 204 ✓
- `GET /` (Laravel welcome) → 200 ✓
- Vite en :5173 → 200 ✓
- BD MySQL: 2 users, 5 family_members, 4 categories ✓
- `Hash::check(md5_papa, papa->password)` → true ✓

## Prioridad de trabajo: MOBILE-FIRST

> Decisión 2026-05-20 (sesión 2): construimos toda la UI optimizada para móvil. **No invertir tiempo en pulir la versión desktop** — el usuario adaptará los detalles cuando todo lo demás esté funcionando.
>
> El sidebar de desktop actual (`Layout.tsx`) queda como esqueleto inicial; no añadir más componentes desktop-only ni pulir paddings/anchos hasta nuevo aviso.

## Por dónde seguir en la próxima sesión

**Primero (acordado)**: poblar la BD con datos de muestra para poder ver gastos en pantalla.

1. **Seed de gastos**: crear `ExpenseSeeder` con ~30 gastos puntuales distribuidos en mayo 2026 — variando categoría, miembro de familia, importe y descripción (imitar los del briefing: Supermercado Lidl, Factura electricidad, Netflix, Material escolar, Restaurante La Huerta, Seguro hogar, Panadería López, Clase de natación…). Quizá 1-2 recurrentes activos también.
2. Verificar que en BD aparecen y vienen con relaciones cargables.

Después, retomar la cola priorizada:

3. **Auth real + pantalla de login funcional**: endpoints `POST /login`, `POST /logout`, `GET /api/me` en Laravel + formulario en React. Login por `username` (custom — no es el default de Sanctum). Cliente HTTP en `frontend/src/lib/api.ts` que gestione la cookie CSRF.
4. **CRUD de `family-members` y `categories`**: endpoints + UI mínima en la página Familia/Ajustes.
5. **Dashboard con datos reales**: `GET /api/stats/summary` + `GET /api/stats/by-category` + donut/bar chart. Ya tendremos expenses seedeados para que renderice algo de verdad.

## Cómo arrancar el proyecto

Ver `docs/development.md`. Resumen rápido:

```bash
# 1. MAMP arrancado (MySQL :8889)
# 2. Backend
cd backend && php artisan serve              # :8000
# 3. Frontend
cd frontend && npm run dev                   # :5173 ← navegador aquí
```

Credenciales de login (cuando esté implementado):
- `papa` / `9d55c25f6306bc61fcd58350e7f16b3d`
- `mama` / `eff9e8c58b0b1f3211fabb4b697d2716`

## Reglas de oro

1. **Antes de empezar a programar un módulo grande, recapitular el plan con el usuario y esperar confirmación.**
2. **No inventar features** que no estén en `README.md`. Si surge una idea nueva, proponerla en una frase y dejar que el usuario decida.
3. **Mantener `docs/README.md` y este `CLAUDE.md` actualizados** cuando cambien decisiones de producto o stack.
4. **No commitear hasta que el usuario lo pida explícitamente.**

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

## Modelo de datos (implementado)

Detalle completo en [`data-model.md`](./data-model.md). Resumen:

- **users**: quienes hacen login (admin/collaborator).
- **family_members**: a quién se atribuye un gasto (Papá, Mamá, Claudia, Pablo, Familia).
- **categories**: tipos de gasto (Comida, Casa, Ocio, Familia).
- **expenses**: gastos puntuales — referencian categoría, miembro de familia y usuario registrador.
- **recurring_expenses**: plantilla mensual. **NO hay scheduler** — al crear la serie se materializan todas las instancias futuras hasta `ends_on` en `expenses` con `recurring_expense_id` apuntando a la plantilla.

## Decisiones abiertas

(ninguna por el momento.)

## Decisiones cerradas

- 2026-05-20: BD → MySQL.
- 2026-05-20: Importes → enteros en céntimos (`int unsigned`).
- 2026-05-20: Sin PWA por ahora; web normal.
- 2026-05-20: Auth → Sanctum modo SPA (cookies httpOnly).
- 2026-05-20: Usuario (login) ≠ miembro de familia. `family_members` independiente, gestionable solo por admin.
- 2026-05-20: Permisos de gastos puntuales → cualquier usuario autenticado puede crear/editar/borrar.
- 2026-05-20: API devuelve importes solo en céntimos (`amount_cents`).
- 2026-05-20: Responsive desktop → sidebar lateral en `>=lg`. Mobile-first prioritario, desktop al final.
- 2026-05-20: `occurred_on` solo fecha, sin hora.
- 2026-05-20: No endpoint específico para "últimos N movimientos" — se resuelve con `GET /api/expenses?per_page=4`.
- 2026-05-20: Sin i18n. UI 100% en español hardcodeado.
- 2026-05-20: Avatar = iniciales calculadas del nombre.
- 2026-05-20: Login por `username` (columna unique).
- 2026-05-21: Auth SPA implementada con `POST /api/auth/login` (custom, no usa rutas Sanctum/Fortify por defecto). Cliente HTTP en `frontend/src/lib/api.ts`.
- 2026-05-21: Recurrentes → **materializados al crear**, no scheduler. Toggle en `/nuevo-gasto` genera todas las instancias futuras hasta `ends_on` en una transacción. Frecuencia única: `monthly`. Clamp al último día si el `day_of_month` no existe en un mes.
- 2026-05-21: Editar/borrar una instancia recurrente afecta **solo a esa instancia**, no se propaga.
- 2026-05-21: Validación: `occurred_on` `before_or_equal:today`. No se aceptan gastos en el futuro (excepto materializados por una serie).
- 2026-05-24: NO habrá UI de gestión de "series recurrentes" (sin pantalla `/recurrentes`, sin endpoints para listar/cortar). Cada instancia se trata como un gasto suelto. Ver `feedback-keep-minimal` en auto-memory.
- 2026-05-25: CRUD admin de `categories` y `family-members` con soft delete (`is_active=false`). Endpoint `DELETE` es soft. Para reactivar: `PATCH` con `{ "is_active": true }`.
- 2026-05-25: Validaciones del backend en español vía `laravel-lang/common` + atributos custom en `lang/es/validation.php` (`amount_cents=importe`, etc.).
- 2026-05-25: Cambio de contraseña expuesto en Ajustes para cualquier usuario (`PATCH /api/auth/password`). La sesión NO se invalida tras el cambio.
- 2026-05-25: NO habrá CRUD admin de usuarios (solo 2 reales). Solo el form "Cambiar contraseña".
- 2026-05-25: Passwords del seeder cambiadas a literales reconocibles: `papa` / `P1234_apa`, `mama` / `M1234_ama`.

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

## Estado del scaffold (último avance: 2026-05-25)

### Backend
- Laravel 12 + Sanctum SPA + MySQL (MAMP `:8889`).
- 5 migraciones (`users` extendida con `username`/`role`/`avatar_initials`, `family_members`, `categories`, `recurring_expenses`, `expenses`).
- Seeders: `User` (papa/mama), `FamilyMember` (5), `Category` (4 con iconos Lucide), `RecurringExpense` (8: hipoteca, luz, internet, gas, Netflix, Spotify, gimnasio, seguro hogar), `Expense` (~115 gastos en mar/abr/may 2026).
- API completa bajo `/api/*` con `auth:sanctum`:
  - `AuthController` (login/logout/updatePassword)
  - `apiResource('categories')`, `apiResource('family-members')` con soft delete y `?include_inactive=true` para admin
  - `apiResource('expenses')` con filtros `from`/`to`/`category_id`/`family_member_id`/`search`/`per_page`
- `App\Concerns\EnsuresAdmin` (gate para mutaciones admin), `App\Services\RecurringExpenseGenerator` (genera fechas mensuales con clamp).
- Validaciones en español (`laravel-lang/common` + atributos custom en `lang/es/validation.php`).

### Frontend
- React 19 + Vite 8 + TypeScript + Tailwind v4 + React Router 7 + Lucide.
- Estructura completa (no stubs):
  - `lib/`: `api.ts`, `auth.ts`, `expenses.ts`, `types.ts`, `format.ts`, `icons.ts`
  - `context/AuthContext.tsx` (hidratación con `/api/user`)
  - `components/`: `Layout`, `PageHeader`, `RequireAuth`, `ExpenseRow`, `CategoryDonut`, `ExpenseForm`, `FilterSheet`, `EntityFormSheet`
  - `pages/`: `Dashboard`, `Historial` (con nav meses y filtros multi), `Familia` (tarjetas expandibles), `Ajustes` (sesión + cambio password + admin links), `NuevoGasto`, `EditarGasto`, `AdminCategorias`, `AdminMiembros`, `Login`
- Shell responsive: sidebar (`>=lg`), bottom-nav + FAB amarillo (`<lg`). FAB oculto en `/nuevo-gasto`. Padding `pb-32` en móvil para el bottom-nav.

### Tooling raíz
- `.gitignore` cubriendo `.DS_Store`, editores, `.claude/settings.local.json`.
- `Makefile` con targets: `up`, `api`, `web`, `stop`, `seed`/`fresh`, `migrate`, `tinker`, `routes`, `test`, `lint`, `fe-build`, `help`.

### Repo
- Primer push 2026-05-25 a github.com/rscosca/family-budget (commit `53afc93`).
- Fix aplicado: `git config http.postBuffer 104857600` para evitar `HTTP 400 RPC failed`.

## Prioridad de trabajo: MOBILE-FIRST

> Decisión 2026-05-20 (sesión 2): construimos toda la UI optimizada para móvil. **No invertir tiempo en pulir la versión desktop** — el usuario adaptará los detalles cuando todo lo demás esté funcionando.
>
> El sidebar de desktop actual (`Layout.tsx`) queda como esqueleto inicial; no añadir más componentes desktop-only ni pulir paddings/anchos hasta nuevo aviso.

## Por dónde seguir en la próxima sesión

1. **Pulir UX móvil (EN CURSO)** — auditoría hecha 2026-05-25 con 7 fricciones priorizadas y alcance acordado 1-7, sin ningún fix aplicado todavía. Detalles en `~/.claude/projects/-Users-rsaenz-Sites-rscosca-family-budget/memory/project_ux_audit.md`. Resumen: padding `/nuevo-gasto`, FAB tapando última fila, mes inicial Familia, icono soft delete, affordance tarjetas admin, aria-labels grid iconos, focus visible.
2. **Tests backend** — sin Pest/PHPUnit todavía. Empezar por feature tests de `ExpenseController` y `AuthController`.
3. **Deploy/producción** — variables, build de Vite, servidor PHP+MySQL, dominio.
4. **Pulir desktop** — diferido por decisión 2026-05-20.

## Cómo arrancar el proyecto

Ver `docs/development.md`. Resumen rápido:

```bash
# Con MAMP arrancado (MySQL :8889):
make up                                      # backend (:8000) + frontend (:5173) en paralelo
# Acceso siempre por http://localhost:5173
```

Credenciales por defecto del seeder:
- `papa` (admin) / `P1234_apa`
- `mama` (collaborator) / `M1234_ama`

Para resetear la BD desde cero (regenera gastos y resetea passwords al literal del seeder): `make seed`.

## Reglas de oro

1. **Antes de empezar a programar un módulo grande, recapitular el plan con el usuario y esperar confirmación.**
2. **No inventar features** que no estén en `README.md`. Si surge una idea nueva, proponerla en una frase y dejar que el usuario decida.
3. **Mantener `docs/README.md` y este `CLAUDE.md` actualizados** cuando cambien decisiones de producto o stack.
4. **No commitear hasta que el usuario lo pida explícitamente.**

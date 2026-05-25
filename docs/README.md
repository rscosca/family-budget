# Family Budget

App familiar para registrar y visualizar gastos compartidos en casa.

## Objetivo

Tener un sitio único donde mi mujer y yo registremos los gastos del día a día, los podamos consultar por categoría y periodo, y los gastos recurrentes (alquiler, suscripciones, facturas) se generen solos cada mes.

## Conceptos clave

> Importante: en esta app **"usuario" y "persona del gasto" son cosas distintas**.

- **Usuario** = quien hace login en la app. Solo 2: yo y mi mujer. Tienen email, contraseña y rol.
- **Miembro de familia** = a quién se atribuye el gasto. Son 5 (Papá, Mamá, Claudia, Pablo, Familia), gestionables desde la pantalla **Familia** (solo admin). NO tienen login; son simples etiquetas con (opcionalmente) avatar/color.

Cuando se crea un gasto, el formulario pide **miembro de familia**. El **usuario que lo registra** se guarda en background a partir de la sesión.

## Usuarios y permisos

| Acción | Admin (yo) | Colaborador (mi mujer) |
| --- | :---: | :---: |
| Registrar gastos puntuales | ✅ | ✅ |
| Ver gastos / historial / dashboard | ✅ | ✅ |
| Filtrar y buscar | ✅ | ✅ |
| Crear y editar **categorías** | ✅ | ❌ |
| Crear y editar **miembros de familia** | ✅ | ❌ |
| Crear y editar **gastos recurrentes** | ✅ | ❌ |
| Gestionar **usuarios** (login) | ✅ | ❌ |

## Miembros de familia (seed inicial)

Papá · Mamá · Claudia · Pablo · Familia

Editables desde la pantalla **Familia** (solo admin).

## Funcionalidades

### Gastos puntuales
Cada gasto tiene:
- **Importe** (€) — almacenado en céntimos
- **Categoría** (Comida, Casa, Ocio, Familia… ampliables)
- **Miembro de familia** al que se atribuye (Papá, Mamá, Claudia, Pablo, Familia…)
- **Fecha**
- **Descripción** (opcional)
- **Registrado por** (usuario logueado, se guarda automáticamente)

### Gastos recurrentes (solo admin)
Igual que un gasto puntual, pero en lugar de una fecha concreta se define:
- **Periodicidad** (mensual por defecto; posible: semanal, anual)
- **Fecha de inicio**
- **Fecha de fin** (opcional — si no se pone, recurre indefinidamente)

El backend se encarga de generar el gasto real cada periodo (job programado).

### Dashboard
- Saludo y mes actual.
- Selector de rango: **Día / Semana / Mes**.
- Gráfico de gastos por categoría (donut con toggle a barras).
- Total del periodo.
- Lista de últimos movimientos.

### Historial
- Total del mes y promedio diario, con comparativa vs mes anterior (`+8% vs Abril`).
- Buscador de movimientos.
- Lista agrupada por día (con subtotal por día).
- Filtros avanzados (por categoría, usuario, rango personalizado).

### Otras vistas (planificadas)
- **Familia**: ajustes de pareja, presupuestos compartidos (a definir).
- **Ajustes**: gestión de categorías, usuarios y recurrentes (solo admin).

## Stack técnico

- **Backend**: Laravel (API REST). Lleva auth, roles, scheduler para recurrentes y persistencia.
- **Frontend**: React (SPA, mobile-first). Consume la API. Web normal — sin capa PWA por ahora (queda como posible mejora futura).
- **BD**: MySQL.
- **Importes**: almacenados como enteros en céntimos (`int unsigned`). Ej. `12,47 €` → `1247`. Evita los errores de redondeo de coma flotante en cálculos y se formatea en el frontend.
- **Auth**: Laravel Sanctum en modo SPA (cookies httpOnly). Login en `POST /login` desde React; las peticiones siguientes llevan la cookie de sesión automáticamente. Requiere desplegar React y Laravel en dominios hermanos.

> Decisión: Sí necesitamos backend. La app es multi-usuario con permisos diferenciados, los datos se comparten en tiempo real entre dispositivos y los recurrentes deben generarse de forma programada — un solo-frontend con `localStorage` no cubre esto.

## Diseño

Dark mode con acento amarillo. **Mobile-first y responsive a desktop**: los HTML del briefing están maquetados en un frame de 390px, pero la app se accede desde navegador y debe adaptarse — no se quedará en una tarjeta de móvil centrada. Toda la guía visual (tokens de color, tipografías, iconografía Lucide, espaciados) está extraída de los HTML del briefing.

- Material de referencia:
  - `briefing/screenshots/` — `dashboard.jpg`, `historial.jpg`, `nuevo-gasto.jpg`
  - `briefing/html/` — maquetación estática navegable (`dashboard.html`, `historial.html`, `nuevo-gasto.html`)

### Paleta resumida

| Token | Color |
| --- | --- |
| Fondo | `#121212` |
| Superficie | `#1E1E1E` |
| Acento | `#FACC15` |
| Texto primario | `#F9FAFB` |
| Texto secundario | `#9CA3AF` |
| Categoría Comida | `#F97316` |
| Categoría Casa | `#3B82F6` |
| Categoría Ocio | `#A855F7` |
| Categoría Familia | `#34D399` |

### Tipografías

- **Lato** (display)
- **Roboto** (body)
- **Roboto Mono** (importes y números)

## Estado del proyecto

### Hecho

- [x] Briefing, maquetación HTML, documentación inicial
- [x] Decisión BD (MySQL) e importes en céntimos
- [x] Distinción usuario ↔ miembro de familia
- [x] Modelo de datos (5 tablas) + modelos Eloquent — ver `docs/data-model.md`
- [x] Scaffold backend Laravel 12 + Sanctum SPA + MySQL
- [x] Scaffold frontend React 19 + Vite + TypeScript + Tailwind v4 + Lucide
- [x] Seeders: 2 usuarios (`papa`/`mama`), 5 miembros, 4 categorías, 8 recurrentes, ~115 gastos seedeados
- [x] Auth SPA real: `POST /api/auth/login` (por `username`), `POST /api/auth/logout`, `GET /api/user`, `PATCH /api/auth/password`
- [x] CRUD `expenses` (cualquier usuario), CRUD admin `categories` y `family-members` (soft delete con `is_active`)
- [x] Frontend: Dashboard (donut + KPIs + pills día/semana/mes), Historial (nav meses + KPIs + búsqueda + filtros multi cat./miembro), Familia (tarjetas por miembro expandibles), CRUD gastos, CRUD admin, Ajustes (sesión + cambio password + admin links)
- [x] Gastos recurrentes mensuales — **materializados al crear** (sin scheduler): toggle "Repetir cada mes" en /nuevo-gasto genera todas las instancias futuras hasta `ends_on`. Cada instancia se trata como gasto suelto. Clamp al último día si el `day_of_month` no existe en un mes
- [x] Validaciones del backend en español (`laravel-lang/common` + atributos custom)
- [x] Tooling raíz: `.gitignore`, `Makefile` (`make up`, `make seed`, `make api`, …)
- [x] Repo en github.com/rscosca/family-budget — primer push 2026-05-25

### En curso

- [ ] **Pulir UX móvil** — auditoría hecha 2026-05-25 con 7 fricciones priorizadas (padding bottom-nav, FAB tapando filas, mes inicial Familia, icono soft delete, affordance tarjetas admin, aria-labels grid iconos, focus visible). Ver `~/.claude/projects/-Users-rsaenz-Sites-rscosca-family-budget/memory/project_ux_audit.md`

### Pendiente

- [ ] Tests backend (Pest/PHPUnit) — empezar por feature tests de `ExpenseController` y `AuthController`
- [ ] Deploy/producción (variables, build de Vite, servidor PHP+MySQL, dominio)
- [ ] Pulir desktop (decisión 2026-05-20: priorizar mobile-first, desktop al final)

### Descartado / no se hará

- ~~UI de gestión de "series recurrentes"~~ — descartado 2026-05-24. Se tratan como gastos sueltos a partir de la creación.
- ~~CRUD admin de usuarios~~ — descartado 2026-05-25 (solo 2 usuarios reales). Solo queda el form "Cambiar contraseña" en Ajustes.
- ~~Endpoints `/api/stats/*`~~ — los agregados (donut, comparativa mes, promedio diario) se calculan en el cliente con los gastos ya cargados. Mover a backend cuando crezca el volumen.

## Estructura del repositorio

```
family-budget/
├── briefing/
│   ├── screenshots/     ← capturas de referencia
│   └── html/            ← maquetación estática navegable
├── docs/
│   ├── README.md        ← este documento
│   ├── CLAUDE.md        ← guía para Claude
│   ├── data-model.md    ← modelo de BD
│   ├── api.md           ← endpoints REST
│   └── development.md   ← cómo arrancar local
├── backend/             ← Laravel 12 API + Sanctum
└── frontend/            ← React + Vite + TypeScript
```

> Para arrancar local: ver [`docs/development.md`](./development.md).

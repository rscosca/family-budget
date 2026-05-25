# API · Endpoints

REST sobre Laravel 12 + Sanctum modo SPA. Las rutas autenticadas requieren cookie de sesión válida + token CSRF (`X-XSRF-TOKEN`).

**Convenciones**:
- Errores estándar Laravel: `{ "message": "...", "errors": { "campo": ["..."] } }`. Mensajes en español (`laravel-lang/common` + atributos custom para los campos del proyecto).
- Paginación Eloquent: `?per_page=50&page=1` → `{ data: [...], links, meta }`.
- Fechas: ISO 8601 (`2026-05-25` para `date`).
- Importes: **siempre céntimos** como `int` (`amount_cents`). El frontend formatea con `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`.

---

## Auth — `/api/auth/*` + Sanctum

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| GET | `/sanctum/csrf-cookie` | Setea cookie `XSRF-TOKEN` (el cliente la lee y la manda en `X-XSRF-TOKEN`) | Público |
| POST | `/api/auth/login` | Login con `username` + `password` (no email) | Público |
| POST | `/api/auth/logout` | Cierra sesión, invalida y regenera CSRF | Auth |
| PATCH | `/api/auth/password` | Cambia contraseña del usuario actual | Auth |
| GET | `/api/user` | Devuelve usuario autenticado (campos del modelo + `role`, `avatar_initials`) | Auth |

**Login body**
```json
{ "username": "papa", "password": "P1234_apa" }
```
Respuesta: `{ "data": { id, name, username, email, role, avatar_initials, ... } }`.

**Cambio de contraseña body**
```json
{
  "current_password": "P1234_apa",
  "password": "nuevoSecreto123",
  "password_confirmation": "nuevoSecreto123"
}
```
Validación: `current_password` (regla nativa), `password` `min:8` + `confirmed`. Devuelve `204 No Content`. La sesión sigue activa tras el cambio.

---

## Miembros de familia — `/api/family-members`

Lectura: cualquiera autenticado. Mutación: solo admin (gate vía `App\Concerns\EnsuresAdmin`).

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| GET | `/api/family-members` | Lista los activos (orden por `display_order`) | Auth |
| GET | `/api/family-members?include_inactive=true` | Incluye también los inactivos | Admin |
| POST | `/api/family-members` | Crea | Admin |
| PATCH | `/api/family-members/{familyMember}` | Actualiza | Admin |
| DELETE | `/api/family-members/{familyMember}` | **Soft delete** (`is_active=false`). Para reactivar: `PATCH` con `{ "is_active": true }` | Admin |

**POST/PATCH body**
```json
{ "name": "Pablo", "color": "#F97316", "icon": "user", "is_active": true, "display_order": 4 }
```
Reglas: `name` `required|string|max:60|unique:family_members,name`; `color` regex `^#[0-9A-Fa-f]{6}$`; `icon` `required|string|max:40`; `display_order` `nullable|integer|0..999`. En PATCH todos los campos son `sometimes`.

---

## Categorías — `/api/categories`

Mismas reglas y endpoints que `family-members` (excepto el nombre del parámetro).

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| GET | `/api/categories` | Lista activas | Auth |
| GET | `/api/categories?include_inactive=true` | Incluye inactivas | Admin |
| POST | `/api/categories` | Crea | Admin |
| PATCH | `/api/categories/{category}` | Actualiza | Admin |
| DELETE | `/api/categories/{category}` | Soft delete | Admin |

---

## Gastos — `/api/expenses`

Cualquier usuario autenticado puede crear, editar y borrar **cualquier** gasto (decisión 2026-05-20 — uso interno familiar).

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| GET | `/api/expenses` | Lista paginada con filtros | Auth |
| POST | `/api/expenses` | Crea gasto (opcional: con serie recurrente) | Auth |
| GET | `/api/expenses/{expense}` | Detalle | Auth |
| PATCH | `/api/expenses/{expense}` | Actualiza | Auth |
| DELETE | `/api/expenses/{expense}` | Hard delete | Auth |

### GET `/api/expenses` — query params

| Param | Tipo | Descripción |
| --- | --- | --- |
| `from`, `to` | date | Rango de `occurred_on` |
| `category_id` | int | |
| `family_member_id` | int | |
| `search` | string | LIKE en `description` |
| `per_page` | int | Default 50, max 200 |
| `page` | int | Paginación estándar Laravel |

Eager-load: `category`, `familyMember`, `registeredBy`. La paginación arrastra los filtros vía `appends($request->query())`.

### POST `/api/expenses` body

```json
{
  "amount_cents": 6742,
  "category_id": 1,
  "family_member_id": 2,
  "description": "Supermercado Lidl",
  "occurred_on": "2026-05-20",
  "recurring": {                         // OPCIONAL — convierte el gasto en serie
    "day_of_month": 20,                  // 1-31; se hace clamp al último día del mes si no existe
    "ends_on": "2027-05-31"              // fecha límite inclusive
  }
}
```

Reglas:
- `amount_cents` `required|integer|min:1|max:99999999`
- `category_id` `required|integer|exists:categories,id`
- `family_member_id` `required|integer|exists:family_members,id`
- `description` `nullable|string|max:160`
- `occurred_on` `required|date|before_or_equal:today`
- `recurring.day_of_month` `required_with:recurring|integer|between:1,31`
- `recurring.ends_on` `required_with:recurring|date|after_or_equal:occurred_on`

`registered_by_user_id` se rellena con `auth()->user()->id` (no se acepta del cliente).

Si llega `recurring`, en una transacción se crea un `RecurringExpense` (frecuencia mensual) y **se materializan todas las instancias futuras** vinculadas con `recurring_expense_id`. Después se crea la instancia del propio `occurred_on`.

### Respuesta de un gasto (`ExpenseResource`)

```json
{
  "id": 12,
  "amount_cents": 6742,
  "description": "Supermercado Lidl",
  "occurred_on": "2026-05-20",
  "recurring_expense_id": null,
  "category":      { "id": 1, "name": "Comida", "color": "#F97316", "icon": "utensils" },
  "family_member": { "id": 2, "name": "Mamá",   "color": "#F472B6", "icon": "user" },
  "registered_by": { "id": 1, "name": "Papá",   "username": "papa" }
}
```

### PATCH `/api/expenses/{id}` body

Mismos campos que POST pero todos con `sometimes`. **Editar una instancia de serie afecta solo a esa instancia** — no se propaga a la plantilla ni al resto.

---

## NO hay endpoints para…

- ~~`/api/users`~~ — no hay CRUD admin de usuarios (solo 2 reales). Cambio de password vía `PATCH /api/auth/password`.
- ~~`/api/recurring-expenses`~~ — sin endpoints propios. Las series se crean al `POST /api/expenses` con `recurring: {...}` y desde ahí cada instancia es un gasto suelto editable individualmente.
- ~~`/api/stats/*`~~ — los agregados (donut por categoría, comparativa vs mes anterior, promedio diario) se calculan en el cliente. Mover a backend cuando crezca el volumen.
- ~~`/reorder`~~ — no hay reorden de categorías/miembros vía API (`display_order` se setea al crear/editar).

---

## Resumen de rutas (output real de `php artisan route:list`)

```
GET    sanctum/csrf-cookie
POST   api/auth/login
POST   api/auth/logout                   auth:sanctum
PATCH  api/auth/password                 auth:sanctum
GET    api/user                          auth:sanctum

GET    api/categories                    auth:sanctum
POST   api/categories                    auth:sanctum (admin)
PATCH  api/categories/{category}         auth:sanctum (admin)
DELETE api/categories/{category}         auth:sanctum (admin)

GET    api/family-members                auth:sanctum
POST   api/family-members                auth:sanctum (admin)
PATCH  api/family-members/{familyMember} auth:sanctum (admin)
DELETE api/family-members/{familyMember} auth:sanctum (admin)

GET    api/expenses                      auth:sanctum
POST   api/expenses                      auth:sanctum
GET    api/expenses/{expense}            auth:sanctum
PATCH  api/expenses/{expense}            auth:sanctum
DELETE api/expenses/{expense}            auth:sanctum
```

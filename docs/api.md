# API · Endpoints

REST sobre Laravel. Prefijo `/api`. Autenticación con Sanctum (cookies httpOnly), por lo que las rutas autenticadas requieren cookie de sesión válida + token CSRF (`X-XSRF-TOKEN`).

Formato de errores estándar Laravel: `{ "message": "...", "errors": { "campo": ["..."] } }`.

Convención de paginación: `?page=1&per_page=50` → `{ data: [...], meta: { total, current_page, last_page } }`.

Convención de fechas: ISO 8601 (`2026-05-20` para `date`, `2026-05-20T14:32:00Z` para `datetime`).

---

## Auth (Sanctum SPA)

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| GET | `/sanctum/csrf-cookie` | Inicializa la cookie CSRF (lo llama React antes del login) | Público |
| POST | `/login` | Login con `email` + `password` | Público |
| POST | `/logout` | Cierra sesión | Auth |
| GET | `/api/me` | Devuelve usuario autenticado + rol | Auth |

> Nota: `/login` y `/logout` los expone el propio Sanctum/Fortify fuera de `/api`. No son endpoints "REST" propiamente, así que viven en `web.php`.

---

## Usuarios — `/api/users`

Solo admin para escritura. Lectura: admin lista todos, colaborador solo se ve a sí mismo.

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| GET | `/api/users` | Lista usuarios | Auth (admin ve todos; colab. solo el suyo) |
| POST | `/api/users` | Crea usuario | Admin |
| GET | `/api/users/{id}` | Detalle | Auth (admin o propio) |
| PATCH | `/api/users/{id}` | Actualiza nombre, email, rol, avatar | Admin |
| PATCH | `/api/users/{id}/password` | Cambia contraseña | Admin o propio (con contraseña actual) |
| DELETE | `/api/users/{id}` | Elimina | Admin (bloquea si es el último admin) |

**POST body**
```json
{
  "name": "Sara",
  "email": "sara@example.com",
  "password": "secreto",
  "role": "collaborator",
  "avatar_initials": "SR"
}
```

---

## Miembros de familia — `/api/family-members`

Lectura: cualquiera autenticado. Escritura: admin.

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| GET | `/api/family-members` | Lista (orden por `display_order`) | Auth |
| POST | `/api/family-members` | Crea | Admin |
| GET | `/api/family-members/{id}` | Detalle | Auth |
| PATCH | `/api/family-members/{id}` | Actualiza | Admin |
| PATCH | `/api/family-members/reorder` | Reordena la lista | Admin |
| DELETE | `/api/family-members/{id}` | Archiva (`is_active = false`); borra duro si no tiene gastos | Admin |

**POST body**
```json
{
  "name": "Pablo",
  "color": "#A855F7",
  "icon": "user",
  "display_order": 4
}
```

**PATCH /reorder body**
```json
{ "ids": [3, 1, 2, 5, 4] }
```

---

## Categorías — `/api/categories`

Mismas reglas que `family_members`.

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| GET | `/api/categories` | Lista | Auth |
| POST | `/api/categories` | Crea | Admin |
| GET | `/api/categories/{id}` | Detalle | Auth |
| PATCH | `/api/categories/{id}` | Actualiza | Admin |
| PATCH | `/api/categories/reorder` | Reordena | Admin |
| DELETE | `/api/categories/{id}` | Archiva o borra duro | Admin |

---

## Gastos — `/api/expenses`

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| GET | `/api/expenses` | Lista con filtros + paginación | Auth |
| POST | `/api/expenses` | Crea gasto puntual | Auth |
| GET | `/api/expenses/{id}` | Detalle | Auth |
| PATCH | `/api/expenses/{id}` | Actualiza | Auth (cualquiera) |
| DELETE | `/api/expenses/{id}` | Elimina | Auth (cualquiera) |

### GET `/api/expenses` — query params

| Param | Tipo | Descripción |
| --- | --- | --- |
| `period` | `day` \| `week` \| `month` | Atajo para las pills del dashboard |
| `from`, `to` | date | Rango personalizado (anula `period`) |
| `category_id` | int | |
| `family_member_id` | int | |
| `user_id` | int | Quién lo registró |
| `q` | string | Busca en `description` |
| `group_by_day` | boolean | Si true, devuelve agrupado por día con subtotal (historial) |
| `page`, `per_page` | int | Paginación |

> **Convención de importes**: la API devuelve **siempre** céntimos como `int` (`amount_cents`, `subtotal_cents`, `total_cents`). El frontend formatea con `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`.

**Ejemplo respuesta (lista plana)**
```json
{
  "data": [
    {
      "id": 12,
      "amount_cents": 6742,
      "category": { "id": 1, "name": "Comida", "color": "#F97316", "icon": "utensils" },
      "family_member": { "id": 2, "name": "Mamá" },
      "registered_by": { "id": 1, "name": "Sergio" },
      "description": "Supermercado Lidl",
      "occurred_on": "2026-05-20",
      "recurring_expense_id": null
    }
  ],
  "meta": { "total": 32, "current_page": 1, "last_page": 1 }
}
```

**Ejemplo respuesta `group_by_day=true`**
```json
{
  "data": [
    {
      "date": "2026-05-20",
      "subtotal_cents": 14357,
      "expenses": [ /* mismos objetos que arriba */ ]
    }
  ]
}
```

### POST `/api/expenses` body

```json
{
  "amount_cents": 6742,
  "category_id": 1,
  "family_member_id": 2,
  "description": "Supermercado Lidl",
  "occurred_on": "2026-05-20"
}
```

`registered_by_user_id` se rellena automáticamente con el usuario autenticado.

---

## Gastos recurrentes — `/api/recurring-expenses`

Solo admin.

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| GET | `/api/recurring-expenses` | Lista | Admin |
| POST | `/api/recurring-expenses` | Crea plantilla | Admin |
| GET | `/api/recurring-expenses/{id}` | Detalle | Admin |
| PATCH | `/api/recurring-expenses/{id}` | Actualiza | Admin |
| PATCH | `/api/recurring-expenses/{id}/toggle` | Activa/pausa (`is_active`) | Admin |
| DELETE | `/api/recurring-expenses/{id}` | Elimina | Admin |

**POST body**
```json
{
  "amount_cents": 1799,
  "category_id": 3,
  "family_member_id": 5,
  "description": "Netflix",
  "frequency": "monthly",
  "day_of_month": 1,
  "starts_on": "2026-05-01",
  "ends_on": null
}
```

---

## Estadísticas — `/api/stats`

Endpoints específicos para el dashboard y la cabecera del historial. Reduce viajes y cálculos en el frontend.

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| GET | `/api/stats/summary` | KPIs del periodo | Auth |
| GET | `/api/stats/by-category` | Gastos agrupados por categoría (donut/barras) | Auth |
| GET | `/api/stats/by-family-member` | Gastos agrupados por persona | Auth |

### `/api/stats/summary?period=month&date=2026-05-15`

```json
{
  "period": "month",
  "from": "2026-05-01",
  "to": "2026-05-31",
  "total_cents": 281430,
  "count": 32,
  "daily_average_cents": 14072,
  "vs_previous": {
    "delta_pct": 8,
    "previous_total_cents": 260583
  }
}
```

### `/api/stats/by-category?period=week`

```json
{
  "total_cents": 124750,
  "breakdown": [
    { "category": { "id": 1, "name": "Comida", "color": "#F97316" }, "amount_cents": 52410, "share_pct": 42 },
    { "category": { "id": 2, "name": "Casa", "color": "#3B82F6" }, "amount_cents": 34930, "share_pct": 28 },
    { "category": { "id": 3, "name": "Ocio", "color": "#A855F7" }, "amount_cents": 22460, "share_pct": 18 },
    { "category": { "id": 4, "name": "Familia", "color": "#34D399" }, "amount_cents": 14950, "share_pct": 12 }
  ]
}
```

`/api/stats/by-family-member` devuelve la misma estructura pero agrupando por `family_member`.

---

## Resumen de rutas

```
/sanctum/csrf-cookie          GET    público
/login                        POST   público
/logout                       POST   auth
/api/me                       GET    auth

/api/users                    GET POST
/api/users/{id}               GET PATCH DELETE
/api/users/{id}/password      PATCH

/api/family-members           GET POST
/api/family-members/{id}      GET PATCH DELETE
/api/family-members/reorder   PATCH

/api/categories               GET POST
/api/categories/{id}          GET PATCH DELETE
/api/categories/reorder       PATCH

/api/expenses                 GET POST
/api/expenses/{id}            GET PATCH DELETE

/api/recurring-expenses       GET POST
/api/recurring-expenses/{id}  GET PATCH DELETE
/api/recurring-expenses/{id}/toggle  PATCH

/api/stats/summary            GET
/api/stats/by-category        GET
/api/stats/by-family-member   GET
```

## Pendientes / a confirmar

(ninguno por ahora — los "últimos N movimientos" del dashboard se resuelven con `GET /api/expenses?per_page=4`).

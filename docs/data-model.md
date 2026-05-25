# Modelo de datos

Esquema relacional (MySQL) para Family Budget.

## Resumen

```
users            ─┐
                  ├──< expenses >── categories
family_members  ──┤                    │
                  └──< recurring_expenses
```

5 tablas + las habituales de Laravel (`personal_access_tokens` para Sanctum, `password_reset_tokens`, `sessions` si usamos sesiones).

---

## `users` — quienes hacen login

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | bigint PK | |
| `username` | varchar(40) unique | Login: `papa`, `mama` |
| `name` | varchar(80) | Nombre visible |
| `email` | varchar(160) unique | |
| `password` | varchar(255) | hash bcrypt |
| `role` | enum('admin', 'collaborator') | Default `collaborator` |
| `avatar_initials` | varchar(3) nullable | Para el header tipo "PA"/"MA" |
| `remember_token` | varchar(100) nullable | |
| `created_at`, `updated_at` | timestamps | |

**Reglas**
- Siempre debe existir al menos 1 admin.
- Solo admin puede crear/editar/borrar otros usuarios.
- Login por `username` (no por email). El email es informativo.

**Seed inicial** (`UserSeeder.php`)
```
papa  admin         email: papa@family.local  password: P1234_apa
mama  collaborator  email: mama@family.local  password: M1234_ama
```
Las contraseñas son literales (definidas en el seeder) y se almacenan con `Hash::make()` (bcrypt). El seeder usa `updateOrCreate`, así que `db:seed --class=UserSeeder` actualiza los hashes sin tocar gastos. Cambiar la contraseña desde la app vía `PATCH /api/auth/password` no afecta al seeder.

---

## `family_members` — a quién se atribuye el gasto

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | bigint PK | |
| `name` | varchar(60) unique | "Papá", "Mamá", "Claudia"… |
| `color` | varchar(7) nullable | Hex tipo `#3B82F6`. Opcional, para avatar |
| `icon` | varchar(40) nullable | Nombre Lucide. Opcional |
| `display_order` | smallint unsigned | Para ordenar en el selector |
| `is_active` | boolean | Default `true`. Permite "archivar" sin perder histórico |
| `created_at`, `updated_at` | timestamps | |

**Seed inicial** (`FamilyMemberSeeder.php`)
```
1 · Papá     #3B82F6  (azul)
2 · Mamá     #F472B6  (rosa)
3 · Claudia  #A855F7  (morado)
4 · Pablo    #F97316  (naranja)
5 · Familia  #34D399  (verde)
```

**Reglas**
- Solo admin gestiona esta tabla desde la pantalla **Familia**.
- No se borran "duros" si hay gastos asociados → `is_active = false` (soft archive). Las filas históricas mantienen su `family_member_id`.

---

## `categories` — tipos de gasto

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | bigint PK | |
| `name` | varchar(60) unique | "Comida", "Casa"… |
| `color` | varchar(7) | Hex, ej. `#F97316` |
| `icon` | varchar(40) | Nombre Lucide, ej. `utensils` |
| `display_order` | smallint unsigned | |
| `is_active` | boolean | |
| `created_by_user_id` | bigint FK → users | |
| `created_at`, `updated_at` | timestamps | |

**Seed inicial** (basado en briefing)
```
Comida   #F97316  utensils
Casa     #3B82F6  house
Ocio     #A855F7  circle-play
Familia  #34D399  users
```

**Reglas**
- Solo admin la modifica.
- Misma política de soft archive que `family_members`.

---

## `expenses` — gastos puntuales

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | bigint PK | |
| `amount_cents` | int unsigned | Importe en céntimos |
| `category_id` | bigint FK → categories | |
| `family_member_id` | bigint FK → family_members | A quién se atribuye |
| `registered_by_user_id` | bigint FK → users | Quién lo creó |
| `description` | varchar(160) nullable | "Supermercado Lidl" |
| `occurred_on` | date | Fecha del gasto (sin hora) |
| `recurring_expense_id` | bigint FK → recurring_expenses, nullable | Si vino de un recurrente |
| `created_at`, `updated_at` | timestamps | |

**Índices**
- `(occurred_on)` — historial
- `(category_id, occurred_on)` — gráficos por categoría
- `(family_member_id, occurred_on)` — filtrar por persona
- `(registered_by_user_id)` — filtrar por usuario

**Reglas**
- Crear: cualquier usuario autenticado.
- Editar: cualquier usuario autenticado (uso interno familiar, no se requiere trazabilidad fina).
- Borrar: cualquier usuario autenticado.

---

## `recurring_expenses` — plantilla de gastos recurrentes

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | bigint PK | |
| `amount_cents` | int unsigned | |
| `category_id` | bigint FK → categories | |
| `family_member_id` | bigint FK → family_members | |
| `created_by_user_id` | bigint FK → users | Siempre admin |
| `description` | varchar(160) | "Netflix", "Hipoteca" |
| `frequency` | enum('monthly', 'weekly', 'yearly') | |
| `day_of_month` | tinyint unsigned nullable | Solo si `monthly` (1–31) |
| `day_of_week` | tinyint unsigned nullable | Solo si `weekly` (0=domingo) |
| `month_of_year` | tinyint unsigned nullable | Solo si `yearly` (1–12) |
| `starts_on` | date | Primera ocurrencia |
| `ends_on` | date nullable | Si null → indefinido |
| `last_generated_on` | date nullable | Última vez que el scheduler generó un `expense` |
| `is_active` | boolean | Pausar sin borrar |
| `created_at`, `updated_at` | timestamps | |

**Reglas (decisión 2026-05-21)**
- Solo admin crea series desde el formulario "Nuevo gasto" activando el toggle "Repetir cada mes".
- **NO hay scheduler**. Al crear la serie se materializan **todas** las instancias futuras hasta `ends_on` en una transacción (`App\Services\RecurringExpenseGenerator`). Cada instancia queda con `expenses.recurring_expense_id` apuntando a la plantilla.
- Frecuencia única implementada: `monthly`. Si el `day_of_month` no existe en un mes (ej. 31 en febrero), se hace **clamp al último día del mes**.
- Editar/borrar una instancia afecta **solo** a esa instancia (no se propaga a la plantilla ni al resto). No hay UI de gestión de series — cada instancia es un gasto suelto a efectos prácticos.
- `last_generated_on` queda como vestigio del esquema original; no se usa en el flujo actual.

---

## Decisiones implícitas

- **Soft archive vs borrado duro**: usamos `is_active` para `family_members`, `categories` y `recurring_expenses`. Nunca borramos en duro si hay registros históricos referenciando.
- **Fechas**: `occurred_on` es la fecha "de negocio" (cuándo ocurrió el gasto). `created_at` es la fecha de inserción. NO mezclamos.
- **Importes**: siempre en céntimos como `int unsigned`. El frontend formatea (`Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`).

## Migraciones (orden)

1. `users` (Laravel ya viene con la base; añadir `role`, `avatar_initials`)
2. `family_members`
3. `categories`
4. `recurring_expenses`
5. `expenses` (referencia a las anteriores)

## Pendientes / a confirmar

1. Tabla `audit_log` para rastrear cambios. Diferida — no urgente.

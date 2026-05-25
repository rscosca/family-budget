# Pendiente

Apuntes vivos de lo que queda por hacer/verificar. Última actualización: 2026-05-25.

## Verificar tras desplegar a producción

Cambios UX hechos el 2026-05-25 (auditoría 1-7), sin verificar todavía en móvil real. Probar en 390×844 (DevTools o teléfono):

- [ ] **`/nuevo-gasto`** — scroll hasta el fondo: el botón "Guardar Gasto" tiene que quedar visible sobre el bottom-nav. Activar "Repetir cada mes" y comprobar que "Hasta el mes" también se ve.
- [ ] **Listas (Dashboard, Historial, Familia, Ajustes, Categorías, Miembros)** — la última fila no debe quedar tapada por el FAB amarillo `+`.
- [ ] **`/admin/categorias` y `/admin/miembros`** — cada tarjeta lleva un `>` a la derecha como pista de "tap to edit". El icono de desactivar es ahora `Power` gris (no papelera roja).
- [ ] **Sheet "Nueva/editar categoría o miembro"** — en desktop, hover sobre cada icono del grid debe mostrar tooltip con el nombre (en móvil es para lectores de pantalla).
- [ ] **Tab nav (desktop)** — debe aparecer anillo amarillo de foco en pills de miembros (form gasto), chips de filtros y tarjetas admin.

Archivos modificados (no commiteados aún):

- `frontend/src/components/Layout.tsx` — `pb-32` → `pb-44`
- `frontend/src/components/ExpenseForm.tsx` — pills miembros con focus-visible + aria-pressed
- `frontend/src/components/FilterSheet.tsx` — chips con focus-visible
- `frontend/src/components/EntityFormSheet.tsx` — grid iconos con aria-label/title + focus-visible
- `frontend/src/pages/AdminCategorias.tsx` — Power en vez de Trash2, chevron, focus-visible
- `frontend/src/pages/AdminMiembros.tsx` — igual que AdminCategorias

## Pendiente funcional (vs briefing)

- [ ] **Gastos recurrentes reales** — existe `RecurringExpense` (modelo + migración) y `RecurringExpenseGenerator` (servicio), pero falta:
  - Comando Artisan que ejecute el generador.
  - Registro en `routes/console.php` o `app/Console/Kernel.php` para que corra cada mes.
  - Endpoints API para que admin gestione recurrentes.
  - UI admin (pantalla en `/admin/recurrentes` o similar).
  - Hoy el toggle "Repetir cada mes" en el form materializa N gastos al crear como atajo.
- [ ] **Gestión de usuarios admin** — el briefing lista "gestión de usuarios" como permiso admin, pero solo hay 2 usuarios sembrados (`papa`, `mama`). No hay pantalla ni endpoints CRUD. Para uso interno familiar probablemente no haga falta nunca.

## Pendiente operacional para producción

- [ ] **`backend/.env`** — pasar `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` al dominio real, regenerar `APP_KEY`, credenciales MySQL de prod, ajustar `SESSION_DOMAIN` y `SANCTUM_STATEFUL_DOMAINS`.
- [ ] **`frontend/.env`** — `VITE_API_URL` al backend de prod. Hacer `npm run build` y servir `dist/`.
- [ ] **HTTPS + Sanctum** — con dominio real, `SESSION_SECURE_COOKIE=true` y el frontend en el mismo dominio (o subdominio) que el backend para que las cookies funcionen.
- [ ] **Tests** — solo hay `ExampleTest` por defecto. No bloqueante pero sin red de seguridad ante cambios.

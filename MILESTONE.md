# Cierre de Milestone — Plataforma Cashback

**Fecha:** 2026-04-06
**Estado:** Funcional para uso interno

---

## 1. Estado final del sistema

### Verificación operativa ejecutada

| Actor    | Login | Perfil | Flujo principal                                                      | Resultado |
| -------- | ----- | ------ | -------------------------------------------------------------------- | --------- |
| ADMIN    | OK    | OK     | Listar users, merchants, stores, campaigns, causes                   | OK        |
| MERCHANT | OK    | OK     | Ver compras pendientes, aprobar compras                              | OK        |
| CONSUMER | OK    | OK     | Ver tiendas, registrar compra con causa, ver historial, ver cashback | OK        |

### Flujo end-to-end verificado via API

1. Consumer crea compra de $150 en Store 1 con Causa "Club Deportivo Barrial" → status `PENDING`
2. Merchant ve la compra pendiente → la aprueba → status `APPROVED`
3. Cashback generado automáticamente: $7.50 (5% de $150) → transaction status `PENDING`

---

## 2. Docker — Comandos ejecutados

```bash
# Desde la raíz del proyecto: d:\escritorio\platcashback\cashback

# Levantar todo (postgres + api + web)
docker compose -f infra/docker-compose.yml up --build -d

# Verificar estado
docker compose -f infra/docker-compose.yml ps

# Ver logs
docker compose -f infra/docker-compose.yml logs -f

# Bajar todo (con volúmenes para reset limpio)
docker compose -f infra/docker-compose.yml down -v
```

**Resultado:** Los 3 contenedores levantan correctamente:

- `infra-db-1` — PostgreSQL 16 (healthy)
- `infra-api-1` — Django 6.0.3 en `:8000`
- `infra-web-1` — Vite dev server en `:5173`

Migrations se aplican automáticamente al iniciar.
Seeds se ejecutan automáticamente (`LOAD_SEEDS=true` por defecto).

---

## 3. Errores encontrados y corregidos

| #   | Tipo        | Descripción                                                                                    | Fix aplicado                                                         |
| --- | ----------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | BUG         | Seed ordering: `commerce` se ejecutaba antes que `causes`, dejando stores sin causas asignadas | Reordenado en `runseeds.py`: accounts → causes → commerce → cashback |
| 2   | DOCKER      | `@rollup/rollup-win32-x64-msvc` en `dependencies` rompía build en Docker (Linux)               | Movido a `optionalDependencies` + `--omit=optional` en Dockerfile    |
| 3   | DEPRECATION | `version: '3.9'` en docker-compose.yml generaba warning                                        | Removido (obsoleto en compose v2)                                    |

_(Bugs de sesiones anteriores ya corregidos: código muerto en AdminUserView, atomicidad user+merchant, validación de owner role, manejo de DoesNotExist, errores silenciados en formularios)_

---

## 4. Auditoría por rol

### ADMIN puede:

- Ver lista de todos los usuarios (filtrar por rol)
- Crear usuario MERCHANT + merchant entity (atómico, un solo API call)
- Ver todos los merchants con owner y CUIT
- Ver todas las tiendas (incluyendo inactivas)
- Crear tiendas asignadas a un merchant
- Gestionar causas soportadas por cada tienda (agregar/eliminar)
- Ver todas las campañas de cashback
- Crear campañas (tienda, porcentaje, rango de fechas, activo/inactivo)
- Aprobar compras pendientes (misma vista que merchant)

### MERCHANT puede:

- Ver su perfil y editarlo
- Ver compras asociadas a sus tiendas
- Aprobar compras pendientes (genera cashback automáticamente)
- Ver tiendas, causas y campañas (read-only via API)

### CONSUMER puede:

- Registrarse y loguearse
- Ver tiendas con filtros por categoría
- Ver detalle de tienda con causas soportadas
- Registrar compra (con QR/link/recibo) y elegir causa
- Ver historial de compras con estados
- Ver sus donaciones y total donado por causa
- Ver balance de cashback generado

---

## 5. Pantallas existentes

### Públicas (sin auth)

| Ruta             | Pantalla          |
| ---------------- | ----------------- |
| `/`              | Landing page      |
| `/login`         | Login             |
| `/signup`        | Registro          |
| `/how-it-works`  | Cómo funciona     |
| `/for-consumers` | Para consumidores |
| `/for-business`  | Para comercios    |
| `/for-teams`     | Para equipos      |
| `/causas`        | Listado de causas |
| `/causas/:slug`  | Detalle de causa  |

### Autenticadas (requiere login)

| Ruta                      | Pantalla                   | Rol      |
| ------------------------- | -------------------------- | -------- |
| `/app/home`               | Dashboard con causas       | Todos    |
| `/app/profile`            | Perfil + métricas          | Todos    |
| `/app/stores`             | Listado de tiendas         | Todos    |
| `/app/stores/:id`         | Detalle + registrar compra | Todos    |
| `/app/purchases`          | Mis compras                | CONSUMER |
| `/app/merchant/purchases` | Aprobación de compras      | MERCHANT |
| `/app/causes`             | Mis causas/impacto         | Todos    |
| `/app/settings`           | Placeholder (próximamente) | Todos    |

### Admin (requiere rol ADMIN)

| Ruta                           | Pantalla                   |
| ------------------------------ | -------------------------- |
| `/app/admin/merchants`         | Listado de merchants       |
| `/app/admin/merchants/new`     | Crear merchant + usuario   |
| `/app/admin/stores`            | Listado de tiendas         |
| `/app/admin/stores/new`        | Crear tienda               |
| `/app/admin/stores/:id/causes` | Gestionar causas de tienda |
| `/app/admin/campaigns`         | Listado de campañas        |
| `/app/admin/campaigns/new`     | Crear campaña              |

---

## 6. Pendientes (no implementados)

| Área                   | Detalle                                                                                                     | Prioridad |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- | --------- |
| Settings               | Pantalla `/app/settings` es un placeholder                                                                  | Media     |
| Paginación             | No hay paginación en listados (stores, merchants, etc.)                                                     | Media     |
| Edición/eliminación    | No hay CRUD completo (solo Create + Read, no Update/Delete)                                                 | Media     |
| Upload de recibos      | Modelo `ReceiptUpload` existe pero sin endpoint/UI                                                          | Baja      |
| OCR de recibos         | `ocr_status` en modelo pero sin procesamiento                                                               | Baja      |
| Notificaciones         | No hay sistema de notificaciones                                                                            | Baja      |
| WebSockets/Realtime    | Channels configurado pero comentado en requirements                                                         | Baja      |
| Guard de ruta merchant | Consumer puede navegar manualmente a `/app/merchant/purchases` (backend filtra, pero no hay guard frontend) | Baja      |
| AuthLayout             | Archivo vacío, no se usa                                                                                    | Trivial   |
| ADMIN CRUD para causas | Admin no puede crear/editar causas desde el frontend                                                        | Media     |
| Export/reportes        | No hay exportación de datos                                                                                 | Baja      |
| Password recovery      | No hay flujo de recuperación de contraseña                                                                  | Alta      |

---

## 7. Checklist de producción interna

### Variables de entorno

| Variable               | Default                 | Descripción                          |
| ---------------------- | ----------------------- | ------------------------------------ |
| `DJANGO_SECRET_KEY`    | `insecure-secret`       | **Cambiar en producción**            |
| `DJANGO_DEBUG`         | `1`                     | Poner `0` en producción              |
| `POSTGRES_USER`        | `cashback`              | Usuario de PostgreSQL                |
| `POSTGRES_PASSWORD`    | `cashback`              | **Cambiar en producción**            |
| `POSTGRES_DB`          | `cashback`              | Nombre de la base de datos           |
| `ALLOWED_HOSTS`        | `localhost,127.0.0.1`   | Agregar dominio real                 |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Agregar URL real del frontend        |
| `VITE_API_URL`         | `http://localhost:8000` | URL del backend para el frontend     |
| `LOAD_SEEDS`           | `true`                  | Poner `false` después del primer run |

### Comandos para levantar

```bash
# Clonar y posicionarse
cd cashback

# Opción 1: Docker (recomendado)
docker compose -f infra/docker-compose.yml up --build -d

# Opción 2: Local (desarrollo)
# Backend
cd apps/api
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows
pip install -r requirements.txt
# Si usa SQLite local:
USE_SQLITE=1 python manage.py migrate
USE_SQLITE=1 python manage.py runseeds
USE_SQLITE=1 python manage.py runserver

# Frontend
cd apps/web
npm install
npm run dev
```

### Usuarios seed

| Email                  | Password        | Rol      |
| ---------------------- | --------------- | -------- |
| `admin@example.com`    | `Admin1234!`    | ADMIN    |
| `merchant@example.com` | `Merchant1234!` | MERCHANT |
| `consumer@example.com` | `Consumer1234!` | CONSUMER |

### Rutas de API principales

| Método | Ruta                                    | Descripción               |
| ------ | --------------------------------------- | ------------------------- |
| POST   | `/api/auth/login`                       | Login (JWT)               |
| POST   | `/api/auth/register`                    | Registro                  |
| POST   | `/api/auth/refresh`                     | Refresh token             |
| GET    | `/api/profile/`                         | Perfil del usuario        |
| GET    | `/api/profile/donations/`               | Donaciones del usuario    |
| GET    | `/api/admin/users/`                     | Listar usuarios (ADMIN)   |
| POST   | `/api/admin/users/`                     | Crear usuario (ADMIN)     |
| GET    | `/api/commerce/merchants/`              | Listar merchants          |
| POST   | `/api/commerce/merchants/`              | Crear merchant            |
| GET    | `/api/commerce/stores/`                 | Listar tiendas            |
| POST   | `/api/commerce/stores/`                 | Crear tienda              |
| GET    | `/api/commerce/stores/{id}/causes/`     | Causas de tienda          |
| POST   | `/api/commerce/stores/{id}/causes/`     | Agregar causa a tienda    |
| DELETE | `/api/commerce/stores/{id}/causes/{c}/` | Quitar causa de tienda    |
| GET    | `/api/commerce/categories/`             | Listar categorías         |
| GET    | `/api/cashback/campaigns/`              | Listar campañas           |
| POST   | `/api/cashback/campaigns/`              | Crear campaña             |
| GET    | `/api/cashback/purchases/`              | Listar compras            |
| POST   | `/api/cashback/purchases/`              | Registrar compra          |
| POST   | `/api/cashback/purchases/{id}/approve/` | Aprobar compra            |
| GET    | `/api/cashback/transactions/`           | Transacciones de cashback |
| GET    | `/api/causes/`                          | Listar causas             |
| GET    | `/api/causes/{slug}/`                   | Detalle de causa          |

### Pasos para probar punta a punta

1. `docker compose -f infra/docker-compose.yml up --build -d`
2. Esperar ~15 segundos para que se apliquen migrations y seeds
3. Abrir `http://localhost:5173`
4. Login como `admin@example.com` / `Admin1234!` → verificar sección Admin en nav
5. Ir a Admin → Merchants → verificar "Tienda Demo" con owner merchant@example.com
6. Ir a Admin → Stores → verificar 2 sucursales activas
7. Ir a Admin → Campaigns → verificar campaña activa al 5%
8. Cerrar sesión → Login como `consumer@example.com` / `Consumer1234!`
9. Ir a Tiendas → Sucursal Centro → registrar compra de $200, seleccionar causa
10. Login como `merchant@example.com` / `Merchant1234!`
11. Ir a Pendientes → aprobar la compra
12. Login como consumer → Mis Compras → verificar compra APPROVED
13. Ir a Mis Causas → verificar donación generada (5% de $200 = $10)

---

## 8. Recomendaciones post-milestone

### Prioridad alta

- [ ] Implementar recuperación de contraseña (email + token reset)
- [ ] Cambiar `DJANGO_SECRET_KEY` y `POSTGRES_PASSWORD` para entorno real
- [ ] Poner `DJANGO_DEBUG=0` y configurar `ALLOWED_HOSTS` con dominio real

### Prioridad media

- [ ] Agregar edición y eliminación (Update/Delete) para merchants, stores, campaigns
- [ ] CRUD de causas desde admin frontend
- [ ] Paginación en todos los listados
- [ ] Guard de ruta frontend para `/app/merchant/purchases`
- [ ] Tests automatizados (backend: pytest, frontend: vitest)

### Prioridad baja

- [ ] Implementar upload de recibos con OCR
- [ ] Sistema de notificaciones
- [ ] Habilitar WebSockets con Django Channels
- [ ] Exportación de datos/reportes
- [ ] Página de Settings del usuario

---

## 9. Stack técnico

| Capa     | Tecnología                                     |
| -------- | ---------------------------------------------- |
| Backend  | Django 6.0 + DRF + SimpleJWT                   |
| Frontend | React 18 + TypeScript + Vite + Tailwind        |
| Database | PostgreSQL 16 (SQLite para dev local)          |
| Auth     | JWT con claim `role` (ADMIN/MERCHANT/CONSUMER) |
| Infra    | Docker Compose (3 servicios)                   |
| Build    | tsc + Vite (1724 módulos, ~3s)                 |

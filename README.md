# Cashback Monorepo

Plataforma de cashback inspirada en FlipGive. Monorepo con frontend (Vite + React + TS + Tailwind) y backend (Django 5 + DRF + SimpleJWT) con base de datos PostgreSQL.

## Requisitos

- Docker y Docker Compose

## Estructura

- `apps/web`: Frontend React + Vite + TypeScript + TailwindCSS
- `apps/api`: Backend Django 5 + DRF + SimpleJWT, apps: accounts, commerce, cashback
- `infra/docker-compose.yml`: Servicios `db`, `api`, `web`

## Variables de entorno

### apps/api/.env

- DJANGO_SECRET_KEY
- DJANGO_DEBUG ("1" o "0")
- POSTGRES_DB
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_HOST (por defecto `db`)
- POSTGRES_PORT (por defecto `5432`)
- ALLOWED_HOSTS (ej: `localhost,127.0.0.1`)
- CORS_ALLOWED_ORIGINS (ej: `http://localhost:5173`)
- LOAD_SEEDS ("true" para cargar seeds en el arranque del contenedor)

Ver `apps/api/.env.example`.

### apps/web/.env

- VITE_API_URL (ej: `http://localhost:8000`)

Ver `apps/web/.env.example`.

## Correr localmente (un solo comando)

```bash
# Windows PowerShell / CMD
docker compose -f infra/docker-compose.yml up --build
```

Esto construye y levanta:

- db: Postgres 16 en el puerto 5432 interno
- api: Django en http://localhost:8000
- web: Vite dev server en http://localhost:5173

Si `LOAD_SEEDS=true` en `apps/api/.env`, se ejecutarán migraciones y seeds automáticamente al iniciar el servicio `api`.

## Rutas principales

### Web

- `/`: Landing con hero, beneficios, FAQ y CTA "Comenzar"
- `/signup`: Registro de consumidores (POST a `/api/auth/register`)
- `/for-business`: Página para comerciantes (placeholder)

### API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET/POST /api/commerce/merchants`
- `GET/POST /api/commerce/stores`
- `GET/POST /api/cashback/campaigns`
- `GET/POST /api/cashback/purchases`
- `GET/POST /api/cashback/transactions`

Roles y permisos:

- CONSUMER: leer campañas, crear purchase, ver sus transacciones
- MERCHANT: CRUD de sus stores/campaigns, aprobar purchases
- ADMIN: todo

## Usuarios seed

- Admin: admin@example.com / Admin1234!
- Merchant: merchant@example.com / Merchant1234!
- Consumer: consumer@example.com / Consumer1234!

Se crea también 1 store y 1 campaign activa para el merchant.

## Scripts útiles

- Frontend: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`, `npm run format`
- Backend: `python manage.py runserver`, `python manage.py migrate`, `python manage.py runseeds`

## Próximos pasos (Sprint 1)

- Wireframes responsive
- Autenticación end-to-end (registro, login, guardado de tokens, rutas protegidas)
- Dashboard inicial para consumer y merchant

## Licencia

MIT

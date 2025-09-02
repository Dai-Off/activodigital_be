# Activo Digital - Backend

Backend en Node.js + Express + TypeScript con Supabase para auth y perfiles.

## Requisitos
- Node 20+ (recomendado 22)
- Cuenta de Supabase

## URLs
- Local: `http://localhost:3000`
- Producción: `https://activodigital-be.onrender.com`

## Setup
1. Instalar deps
```bash
npm install
```
2. Crear `.env` en la raíz:
```dotenv
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://evgaypztiulrsjpkxsqx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2Z2F5cHp0aXVscnNqcGt4c3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTU0NDQsImV4cCI6MjA3MjM5MTQ0NH0.8F-ftFa4N6vASOUsT2hD9xDXKpZFLCXJ8IJlRR55pc8
# Opcional para pruebas administrativas:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2Z2F5cHp0aXVscnNqcGt4c3F4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgxNTQ0NCwiZXhwIjoyMDcyMzkxNDQ0fQ.NJOPYrTDTrMDRorniFAlFktbRPSHxoKYUAAoQT5e8_w
```
3. Compilar y ejecutar
```bash
npm run build
npm start
```
Dev (autoreload): `npm run dev`

## Scripts
- npm run dev: desarrollo con ts-node-dev
- npm run build: compila TypeScript a `dist/`
- npm start: ejecuta `dist/index.js`

## Estructura
```
src/
  app.ts                      # App Express (middlewares globales y montaje de rutas)
  index.ts                    # Bootstrap del servidor (lee .env y listen)
  lib/
    supabase.ts               # Clientes Supabase (admin/anon) como singletons
  routes/
    index.ts                  # Router raíz y agrupación de subrutas
    health.ts                 # Healthchecks y debug de envs
    auth.ts                   # Rutas de autenticación (signup, login, me, logout)
  web/
    controllers/
      authController.ts       # Traduce HTTP <-> servicios (validación básica y códigos)
    middlewares/
      authMiddleware.ts       # Extrae userId desde Authorization: Bearer <token>
  domain/
    services/
      authService.ts          # Lógica de negocio; orquesta Supabase (Auth y profiles)
```

### Flujo para crear nuevos endpoints (mantener este patrón)
1. Definir ruta en `src/routes/<modulo>.ts` y exportarla desde `src/routes/index.ts`.
2. Implementar un controlador en `src/web/controllers/` que:
   - Valide `req.body`/`req.params` mínimo (requeridos, tipos simples).
   - Llame al servicio correspondiente y convierta resultados/errores en respuestas HTTP.
3. Implementar la lógica en `src/domain/services/`:
   - Reglas de negocio, transacciones simples, acceso a Supabase (Auth/DB).
   - No usar objetos `Request`/`Response` aquí.
4. Reutilizar utilidades/SDKs desde `src/lib/` (p.ej., clientes Supabase).
5. Autenticación/Autorización:
   - Usar `requireAuth` en rutas que necesiten usuario logueado.
   - Si se requieren roles, consultar `profiles.role` en el servicio.
6. Errores y respuestas:
   - Controlador devuelve `4xx` en validaciones y `5xx` en errores internos.
   - Servicios arrojan `Error` con mensaje claro.

Ejemplo breve (nuevo módulo `items`):
- `routes/items.ts`: define `GET /items` y `POST /items`.
- `web/controllers/itemsController.ts`: valida input y llama `itemsService`.
- `domain/services/itemsService.ts`: CRUD con Supabase.
- `routes/index.ts`: `router.use('/items', itemsRouter);`

## Endpoints
- GET `/` bienvenida
- GET `/health/supabase` ping DB
- GET `/health/env` debug envs (enmascarados)
- POST `/auth/signup` { email, password, full_name }
- POST `/auth/login` { email, password }
- GET `/auth/me` Authorization: Bearer <token>
- POST `/auth/logout` (frontend borra tokens)

## Pruebas rápidas (PowerShell)
Local:
```powershell
# signup
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/signup" `
  -ContentType "application/json" `
  -Body (@{ email="user@example.com"; password="Secret123!"; full_name="User" } | ConvertTo-Json)

# login
$resp = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/login" `
  -ContentType "application/json" `
  -Body (@{ email="user@example.com"; password="Secret123!" } | ConvertTo-Json)
$token = $resp.access_token

# me
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/auth/me" -Headers @{ Authorization = "Bearer $token" }
```
Producción:
```powershell
# login
Invoke-RestMethod -Method Post -Uri "https://activodigital-be.onrender.com/auth/login" `
  -ContentType "application/json" `
  -Body (@{ email="user@example.com"; password="Secret123!" } | ConvertTo-Json)

# health
Invoke-RestMethod -Method Get -Uri "https://activodigital-be.onrender.com/health/supabase"
```

cURL (prod):
```bash
curl -X POST https://activodigital-be.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Secret123!"}'
```

## Deploy en Render
- Repo contiene `render.yaml` (blueprint) con servicio web Node.
- Pasos:
  1. En Render: New → Blueprint → seleccionar repo y rama `main`.
  2. Render detecta `render.yaml`.
  3. Variables de entorno:
     - `NODE_ENV=production`
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
  4. Build: `npm install && npm run build` | Start: `npm start` | Health: `/health/supabase`.
  5. Deploy.
- URL de producción: `https://activodigital-be.onrender.com` (ver bienvenida) ([link](https://activodigital-be.onrender.com)).

## Supabase
- RPC `now` para health:
```sql
create or replace function public.now()
returns timestamptz language sql stable as $$ select now(); $$;
```
- Tabla `public.profiles` con enum `public.user_role` ('tenedor') y RLS (ver SQL en historia del proyecto).

## Notas
- No exponer `SERVICE_ROLE` en frontend.
- Backend stateless; JWT gestionado por Supabase.

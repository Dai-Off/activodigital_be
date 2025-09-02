# Activo Digital - Backend

Backend en Node.js + Express + TypeScript con Supabase para auth y perfiles.

## Requisitos
- Node 20+ (recomendado 22)
- Cuenta de Supabase

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
  app.ts
  index.ts
  lib/supabase.ts
  routes/{index.ts, health.ts, auth.ts}
  web/controllers/authController.ts
  web/middlewares/authMiddleware.ts
  domain/services/authService.ts
```

## Endpoints
- GET `/` bienvenida
- GET `/health/supabase` ping DB
- GET `/health/env` debug envs (enmascarados)
- POST `/auth/signup` { email, password, full_name }
- POST `/auth/login` { email, password }
- GET `/auth/me` Authorization: Bearer <token>
- POST `/auth/logout` (frontend borra tokens)

## Pruebas rápidas (PowerShell)
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

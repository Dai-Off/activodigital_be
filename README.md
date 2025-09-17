# Activo Digital - Backend

Backend en Node.js + Express + TypeScript con Supabase para autenticación y gestión de perfiles de usuarios con roles.

## Características

- **Autenticación completa** con Supabase
- **Sistema de roles** (tenedor, administrador, técnico)
- **API REST** con validación de datos
- **Deploy automático** con GitHub Actions
- **Arquitectura limpia** con separación de responsabilidades

## Requisitos

- Node.js 18+
- Cuenta de Supabase
- Cuenta de Fly.io (para deploy)

## URLs

- **Local:** `http://localhost:3000`
- **Producción:** `https://activodigital-be.fly.dev`

## Setup Local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Variables de entorno
Crear archivo `.env` en la raíz del proyecto:
```dotenv
PORT=3000
NODE_ENV=development

# Supabase (Empresa)
SUPABASE_URL=https://eqyevtkljwvhfsohawrk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxeWV2dGtsand2aGZzb2hhd3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NzU2MTEsImV4cCI6MjA3MzI1MTYxMX0.fPwIWpcH-jKJFxZ_gCZBV6c8hjoDKvN4v361eVtD0N8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxeWV2dGtsand2aGZzb2hhd3JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY3NTYxMSwiZXhwIjoyMDczMjUxNjExfQ.CPy0R9AprbYLtK52SbzNF69EImU4QqEUu0Y1L77mrp8
```

### 3. Compilar y ejecutar
```bash
# Desarrollo (con autoreload)
npm run dev

# Producción
npm run build
npm start
```

## Estructura del Proyecto

```
src/
├── app.ts                      # Configuración Express (middlewares, CORS, rutas)
├── index.ts                    # Bootstrap del servidor (variables de entorno, listen)
├── lib/
│   └── supabase.ts            # Clientes Supabase (admin/anon) como singletons
├── routes/
│   ├── index.ts               # Router principal y agrupación de rutas
│   ├── health.ts              # Healthchecks y debug de variables de entorno
│   └── auth.ts                # Rutas de autenticación
├── web/
│   ├── controllers/
│   │   └── authController.ts  # Controladores HTTP (validación, códigos de respuesta)
│   └── middlewares/
│       └── authMiddleware.ts  # Middleware de autenticación (Bearer token)
└── domain/
    └── services/
        └── authService.ts     # Lógica de negocio (orquestación con Supabase)
```

## Sistema de Autenticación

### Registro de Usuarios
```typescript
POST /auth/signup
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "full_name": "Nombre Completo",
  "role": "administrador"  // "tenedor", "administrador", "tecnico"
}
```

### Inicio de Sesión
```typescript
POST /auth/login
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

### Perfil de Usuario
```typescript
GET /auth/me
Authorization: Bearer <token>
```

## Endpoints Disponibles

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Mensaje de bienvenida | ❌ |
| GET | `/health/supabase` | Healthcheck de base de datos | ❌ |
| GET | `/health/env` | Debug de variables de entorno | ❌ |
| POST | `/auth/signup` | Registro de usuario | ❌ |
| POST | `/auth/login` | Inicio de sesión | ❌ |
| GET | `/auth/me` | Obtener perfil del usuario | ✅ |
| POST | `/auth/logout` | Cerrar sesión | ❌ |

## Pruebas Rápidas

### PowerShell (Local)
```powershell
# Registro con rol
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/signup" `
  -ContentType "application/json" `
  -Body '{"email":"admin@test.com","password":"123456","full_name":"Admin Test","role":"administrador"}'

# Login
$resp = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"admin@test.com","password":"123456"}'
$token = $resp.access_token

# Obtener perfil
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/auth/me" `
  -Headers @{ Authorization = "Bearer $token" }
```

### PowerShell (Producción)
```powershell
# Registro
Invoke-RestMethod -Method Post -Uri "https://activodigital-be.fly.dev/auth/signup" `
  -ContentType "application/json" `
  -Body '{"email":"test@ejemplo.com","password":"123456","full_name":"Test User","role":"tecnico"}'

# Healthcheck
Invoke-RestMethod -Method Get -Uri "https://activodigital-be.fly.dev/health/supabase"
```

### cURL (Producción)
```bash
# Registro
curl -X POST https://activodigital-be.fly.dev/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ejemplo.com","password":"123456","full_name":"Test User","role":"administrador"}'

# Login
curl -X POST https://activodigital-be.fly.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ejemplo.com","password":"123456"}'
```

## Deploy en Fly.io

### Configuración Automática
El proyecto incluye configuración completa para deploy automático:

- **`fly.toml`**: Configuración de la aplicación
- **`Dockerfile`**: Imagen Docker optimizada
- **`.github/workflows/fly-deploy.yml`**: GitHub Actions para deploy automático

### Deploy Manual
```bash
# Instalar Fly CLI
# https://fly.io/docs/hands-on/install-flyctl/

# Login
fly auth login

# Crear app (solo primera vez)
fly launch --no-deploy --org santiago-anangono

# Configurar variables de entorno
fly secrets set SUPABASE_URL="https://eqyevtkljwvhfsohawrk.supabase.co"
fly secrets set SUPABASE_ANON_KEY="tu_anon_key"
fly secrets set SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"

# Deploy
fly deploy
```

### Deploy Automático
1. **Configurar token en GitHub:**
   - Ve a Settings → Secrets and variables → Actions
   - Agrega `FLY_API_TOKEN` con el token generado por `fly tokens create deploy`

2. **Push a main:**
   ```bash
   git add .
   git commit -m "feat: nueva funcionalidad"
   git push origin main
   ```

3. **GitHub Actions ejecutará el deploy automáticamente**

## Base de Datos (Supabase)

### Estructura de la Tabla `profiles`
```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'tenedor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enum `user_role`
```sql
CREATE TYPE user_role AS ENUM ('tenedor', 'administrador', 'tecnico');
```

### Función de Healthcheck
```sql
CREATE OR REPLACE FUNCTION public.now()
RETURNS timestamptz 
LANGUAGE sql 
STABLE AS $$ 
  SELECT now(); 
$$;
```

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo con ts-node-dev (autoreload) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la aplicación compilada |
| `npm run lint` | Ejecuta ESLint |

## Patrón de Desarrollo

Para agregar nuevos endpoints, seguir este patrón:

1. **Ruta** en `src/routes/<modulo>.ts`
2. **Controlador** en `src/web/controllers/<modulo>Controller.ts`
3. **Servicio** en `src/domain/services/<modulo>Service.ts`
4. **Registrar ruta** en `src/routes/index.ts`

### Ejemplo: Módulo de Items
```typescript
// routes/items.ts
router.get('/items', itemsController.getAll);
router.post('/items', requireAuth, itemsController.create);

// web/controllers/itemsController.ts
export const getAll = async (req: Request, res: Response) => {
  // Validación básica + llamada al servicio
};

// domain/services/itemsService.ts
export async function getAllItems() {
  // Lógica de negocio + acceso a Supabase
}
```

## Seguridad

- **Autenticación JWT** con Supabase
- **Validación de roles** en endpoints sensibles
- **Variables de entorno** para credenciales
- **Row Level Security** en Supabase
- **HTTPS** en producción

## Monitoreo

- **Logs en tiempo real:** `fly logs`
- **Estado de la app:** `fly status`
- **Métricas:** Dashboard de Fly.io
- **Healthcheck:** `/health/supabase`

## Troubleshooting

### Error: "fetch failed"
- Verificar que las variables de entorno estén configuradas
- Comprobar conectividad con Supabase

### Error: "invalid role"
- Verificar que el enum `user_role` tenga los valores correctos
- Los roles válidos son: `tenedor`, `administrador`, `tecnico`

### Error de deploy
- Verificar que `FLY_API_TOKEN` esté configurado en GitHub
- Comprobar que la región no esté deprecada

## Soporte

- **Organización:** santiago-anangono
- **Repositorio:** https://github.com/Dai-Off/activodigital_be
- **URL Producción:** https://activodigital-be.fly.dev

---

**Última actualización:** Septiembre 2025
**Versión:** 2.0.0 (con sistema de roles)
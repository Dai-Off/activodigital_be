# Activo Digital - Backend

Backend en Node.js + Express + TypeScript con Supabase para la gestión completa de edificios y libros digitales.

## Características

- **Autenticación JWT** con Supabase
- **Sistema de roles** (tenedor, administrador, técnico)
- **Gestión de edificios** con imágenes y geolocalización
- **Libros digitales** con 8 secciones y progreso automático
- **Relación 1:1** edificio-libro digital
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
├── app.ts                          # Configuración Express (middlewares, CORS, rutas)
├── index.ts                        # Bootstrap del servidor (variables de entorno, listen)
├── types/                          # Definiciones de tipos TypeScript
│   ├── edificio.ts                # Tipos para edificios e imágenes
│   ├── libroDigital.ts            # Tipos para libros digitales y secciones
│   └── index.ts                   # Exportación de todos los tipos
├── lib/
│   └── supabase.ts                # Clientes Supabase (admin/anon) como singletons
├── routes/
│   ├── index.ts                   # Router principal y agrupación de rutas
│   ├── health.ts                  # Healthchecks y debug de variables de entorno
│   ├── auth.ts                    # Rutas de autenticación
│   ├── edificios.ts               # Rutas CRUD para edificios
│   └── librosDigitales.ts         # Rutas CRUD para libros digitales
├── web/
│   ├── controllers/
│   │   ├── authController.ts      # Controladores de autenticación
│   │   ├── edificioController.ts  # Controladores de edificios
│   │   └── libroDigitalController.ts # Controladores de libros digitales
│   └── middlewares/
│       └── authMiddleware.ts      # Middleware de autenticación (Bearer token)
└── domain/
    └── services/
        ├── authService.ts         # Lógica de negocio de autenticación
        ├── edificioService.ts     # Lógica de negocio de edificios
        └── libroDigitalService.ts # Lógica de negocio de libros digitales
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

### Autenticación
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Registro de usuario | No |
| POST | `/auth/login` | Inicio de sesión | No |
| GET | `/auth/me` | Obtener perfil del usuario | Sí |
| POST | `/auth/logout` | Cerrar sesión | No |

### Edificios
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/edificios` | Crear edificio | Sí |
| GET | `/edificios` | Obtener edificios del usuario | Sí |
| GET | `/edificios/:id` | Obtener edificio específico | Sí |
| PUT | `/edificios/:id` | Actualizar edificio | Sí |

### Libros Digitales
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/libros-digitales` | Crear libro digital | Sí |
| GET | `/libros-digitales/:id` | Obtener libro específico | Sí |
| PUT | `/libros-digitales/:id` | Actualizar libro | Sí |
| GET | `/libros-digitales/building/:buildingId` | Obtener libro por edificio | Sí |
| PUT | `/libros-digitales/:id/sections/:sectionType` | Actualizar sección | Sí |

### Utilidades
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Mensaje de bienvenida | No |
| GET | `/health/supabase` | Healthcheck de base de datos | No |
| GET | `/health/env` | Debug de variables de entorno | No |

## Modelos de Datos

### Edificio (Building)
```typescript
{
  "id": "uuid",
  "name": "string",
  "address": "string", 
  "cadastralReference": "string",
  "constructionYear": "number",
  "typology": "residential | mixed | commercial",
  "numFloors": "number",
  "numUnits": "number",
  "lat": "number",
  "lng": "number",
  "images": [
    {
      "id": "string",
      "url": "string",
      "title": "string",
      "isMain": "boolean"
    }
  ],
  "status": "draft | ready_book | with_book",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)",
  "userId": "string (uuid)"
}
```

### Libro Digital (DigitalBook)
```typescript
{
  "id": "uuid",
  "buildingId": "uuid",
  "source": "manual | pdf",
  "status": "draft | in_progress | complete",
  "progress": "number (0-8)",
  "sections": [
    {
      "id": "string",
      "type": "general_data | construction_features | certificates_and_licenses | maintenance_and_conservation | facilities_and_consumption | renovations_and_rehabilitations | sustainability_and_esg | annex_documents",
      "complete": "boolean",
      "content": "object (flexible)"
    }
  ],
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

## Ejemplos de Uso

### Autenticación
```powershell
# Login y obtener token
$resp = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"user@example.com","password":"123456"}'
$token = $resp.data.session.access_token

# Headers para requests autenticados
$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = "Bearer $token"
}
```

### Gestión de Edificios
```powershell
# Crear edificio
$buildingBody = @{
    name = "Edificio Residencial Centro"
    address = "Calle Mayor 123, Madrid"
    cadastralReference = "1234567890"
    constructionYear = 2020
    typology = "residential"
    numFloors = 5
    numUnits = 20
    lat = 40.4168
    lng = -3.7038
    images = @(
        @{
            id = "img-001"
            url = "https://example.com/image1.jpg"
            title = "Fachada principal"
            isMain = $true
        }
    )
} | ConvertTo-Json -Depth 3

$building = Invoke-RestMethod -Uri 'http://localhost:3000/edificios' -Method POST -Headers $headers -Body $buildingBody
$buildingId = $building.data.id

# Obtener todos los edificios
$buildings = Invoke-RestMethod -Uri 'http://localhost:3000/edificios' -Method GET -Headers $headers

# Actualizar edificio
$updateBody = @{ name = "Edificio Actualizado" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/edificios/$buildingId" -Method PUT -Headers $headers -Body $updateBody
```

### Gestión de Libros Digitales
```powershell
# Crear libro digital (relación 1:1 con edificio)
$bookBody = @{
    buildingId = $buildingId
    source = "manual"
} | ConvertTo-Json

$book = Invoke-RestMethod -Uri 'http://localhost:3000/libros-digitales' -Method POST -Headers $headers -Body $bookBody
$bookId = $book.data.id

# Actualizar sección del libro
$sectionBody = @{
    content = @{
        descripcion = "Edificio residencial moderno"
        superficie_construida = "1500 m²"
        arquitecto = "Juan Pérez Arquitectos"
        promotor = "Inmobiliaria Centro SL"
    }
    complete = $true
} | ConvertTo-Json -Depth 3

$updatedBook = Invoke-RestMethod -Uri "http://localhost:3000/libros-digitales/$bookId/sections/general_data" -Method PUT -Headers $headers -Body $sectionBody

# Verificar progreso automático
Write-Host "Progreso: $($updatedBook.data.progress)/8"
Write-Host "Estado: $($updatedBook.data.status)"
```

### Consultas Específicas
```powershell
# Obtener libro por edificio
$bookByBuilding = Invoke-RestMethod -Uri "http://localhost:3000/libros-digitales/building/$buildingId" -Method GET -Headers $headers
```

## Pruebas Rápidas

### PowerShell (Flujo Completo)
```powershell
# 1. Login
$resp = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"user@example.com","password":"123456"}'
$token = $resp.data.session.access_token
$headers = @{ 'Content-Type' = 'application/json'; 'Authorization' = "Bearer $token" }

# 2. Crear edificio
$buildingBody = '{"name":"Test Building","address":"Test Address","cadastralReference":"TEST123","constructionYear":2020,"typology":"residential","numFloors":3,"numUnits":9,"lat":40.4168,"lng":-3.7038}'
$building = Invoke-RestMethod -Uri 'http://localhost:3000/edificios' -Method POST -Headers $headers -Body $buildingBody

# 3. Crear libro digital
$bookBody = "{`"buildingId`":`"$($building.data.id)`",`"source`":`"manual`"}"
$book = Invoke-RestMethod -Uri 'http://localhost:3000/libros-digitales' -Method POST -Headers $headers -Body $bookBody

# 4. Actualizar sección
$sectionBody = '{"content":{"descripcion":"Edificio de prueba","superficie":"500 m²"},"complete":true}'
$updatedBook = Invoke-RestMethod -Uri "http://localhost:3000/libros-digitales/$($book.data.id)/sections/general_data" -Method PUT -Headers $headers -Body $sectionBody

Write-Host "Edificio creado: $($building.data.id)"
Write-Host "Libro creado: $($book.data.id)" 
Write-Host "Progreso: $($updatedBook.data.progress)/8"
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

### Esquema de Base de Datos

#### Tabla `profiles`
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

#### Tabla `buildings`
```sql
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    cadastral_reference VARCHAR(100),
    construction_year INTEGER,
    typology VARCHAR(20) NOT NULL CHECK (typology IN ('residential', 'mixed', 'commercial')),
    num_floors INTEGER,
    num_units INTEGER,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    images JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready_book', 'with_book')),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabla `digital_books`
```sql
CREATE TABLE digital_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    source VARCHAR(20) NOT NULL CHECK (source IN ('manual', 'pdf')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'complete')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 8),
    sections JSONB DEFAULT '[]'::jsonb,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Restricciones y Relaciones

#### Relación 1:1 Edificio-Libro
```sql
-- Garantiza que cada edificio solo tenga un libro digital
ALTER TABLE digital_books 
ADD CONSTRAINT unique_building_book 
UNIQUE (building_id);
```

#### Índices para Rendimiento
```sql
-- Edificios
CREATE INDEX idx_buildings_user_id ON buildings(user_id);
CREATE INDEX idx_buildings_status ON buildings(status);
CREATE INDEX idx_buildings_typology ON buildings(typology);

-- Libros Digitales  
CREATE INDEX idx_digital_books_user_id ON digital_books(user_id);
CREATE INDEX idx_digital_books_building_id ON digital_books(building_id);
CREATE INDEX idx_digital_books_status ON digital_books(status);
```

#### Row Level Security (RLS)
```sql
-- Edificios: usuarios solo ven sus propios edificios
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY buildings_user_policy ON buildings
    FOR ALL USING (auth.uid() = user_id);

-- Libros: usuarios solo ven sus propios libros
ALTER TABLE digital_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY digital_books_user_policy ON digital_books
    FOR ALL USING (auth.uid() = user_id);
```

#### Triggers para `updated_at`
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_buildings_updated_at 
    BEFORE UPDATE ON buildings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_digital_books_updated_at 
    BEFORE UPDATE ON digital_books 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Enums y Tipos

#### Enum `user_role`
```sql
CREATE TYPE user_role AS ENUM ('tenedor', 'administrador', 'tecnico');
```

### Funciones de Utilidad
```sql
-- Función de Healthcheck
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

1. **Tipos** en `src/types/<modulo>.ts`
2. **Servicio** en `src/domain/services/<modulo>Service.ts`
3. **Controlador** en `src/web/controllers/<modulo>Controller.ts`
4. **Ruta** en `src/routes/<modulo>.ts`
5. **Registrar ruta** en `src/routes/index.ts`

### Ejemplo: Módulo de Items
```typescript
// types/items.ts
export interface Item {
  id: string;
  name: string;
  userId: string;
}

// domain/services/itemsService.ts
export class ItemsService {
  private getSupabase() {
    return getSupabaseClient();
  }
  
  async getAllItems(userId: string): Promise<Item[]> {
    // Lógica de negocio + acceso a Supabase
  }
}

// web/controllers/itemsController.ts
export class ItemsController {
  private getItemsService() {
    return new ItemsService();
  }
  
  getAll = async (req: Request, res: Response): Promise<void> => {
  // Validación básica + llamada al servicio
};
}

// routes/items.ts
router.get('/items', authenticateToken, itemsController.getAll);
router.post('/items', authenticateToken, itemsController.create);
```

## Funcionalidades Clave

### Gestión de Edificios
- **CRUD básico** con validación de datos (crear, obtener, editar)
- **Geolocalización** con coordenadas lat/lng
- **Gestión de imágenes** con imagen principal
- **Estados del edificio** (draft, ready_book, with_book)
- **Seguridad RLS** por usuario

### Libros Digitales
- **Relación 1:1** con edificios (un edificio = un libro)
- **8 secciones predefinidas** creadas automáticamente
- **Progreso automático** basado en secciones completadas
- **Estados dinámicos** (draft → in_progress → complete)
- **Contenido flexible** en formato JSON por sección
- **Edición de secciones individuales**

### Flujo de Trabajo
1. Usuario (tenedor) crea **edificio** (estado: draft)
2. Usuario crea **libro digital** para el edificio
3. Usuario edita **secciones** del libro individualmente
4. **Progreso se actualiza automáticamente** (0-8)
5. **Estado cambia automáticamente** según progreso
6. Al completar 8 secciones → estado: complete

### Seguridad
- **JWT Authentication** con Supabase
- **Row Level Security** en todas las tablas
- **Validación de ownership** en todos los endpoints
- **Relaciones CASCADE** para integridad referencial

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

## Changelog

### v3.0.0 - Septiembre 2025
- Gestión básica de edificios con CRUD y geolocalización
- Sistema de libros digitales con 8 secciones y progreso automático
- Relación 1:1 edificio-libro digital con validaciones
- Tipos TypeScript completos en inglés para mejor integración
- Arquitectura escalable con services, controllers y routes
- Base de datos optimizada con índices y RLS
- Documentación completa con ejemplos de uso

### v2.0.0 - Agosto 2025
- Sistema de roles (tenedor, administrador, técnico)
- Autenticación JWT con Supabase
- Deploy automático con GitHub Actions

### v1.0.0 - Julio 2025
- Backend básico con Express + TypeScript
- Integración con Supabase

---

**Última actualización:** Septiembre 2025  
**Versión:** 3.0.0 (con edificios y libros digitales)  
**Estado:** Producción Ready

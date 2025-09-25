# Guía del Desarrollador - Activo Digital Backend

Esta guía está dirigida a desarrolladores que trabajarán en el proyecto Activo Digital Backend.

## 📋 Tabla de Contenidos

1. [Configuración del Entorno](#configuración-del-entorno)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Sistema de Invitaciones](#sistema-de-invitaciones)
4. [Configuración de Producción](#configuración-de-producción)
5. [Troubleshooting](#troubleshooting)
6. [Patrones de Desarrollo](#patrones-de-desarrollo)

## 🚀 Configuración del Entorno

### Prerrequisitos
- Node.js 18+
- Cuenta de Supabase
- Cuenta de Fly.io (para deploy)
- Cuenta de Resend (para emails)

### Setup Local

1. **Clonar y instalar dependencias:**
```bash
git clone <repo-url>
cd activodigital-be
npm install
```

2. **Variables de entorno locales:**
Crear archivo `.env` en la raíz:
```dotenv
PORT=3000
NODE_ENV=development

# Supabase (Empresa)
SUPABASE_URL=https://eqyevtkljwvhfsohawrk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxeWV2dGtsand2aGZzb2hhd3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NzU2MTEsImV4cCI6MjA3MzI1MTYxMX0.fPwIWpcH-jKJFxZ_gCZBV6c8hjoDKvN4v361eVtD0N8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxeWV2dGtsand2aGZzb2hhd3JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY3NTYxMSwiZXhwIjoyMDczMjUxNjExfQ.CPy0R9AprbYLtK52SbzNF69EImU4QqEUu0Y1L77mrp8
```

3. **Configurar Supabase Edge Functions:**
```bash
# Configurar variables de entorno en Supabase
npx supabase secrets set RESEND_API_KEY=tu_api_key_de_resend --project-ref tu_project_id
npx supabase secrets set FRONTEND_URL=http://localhost:3000 --project-ref tu_project_id

# Desplegar Edge Functions
npx supabase functions deploy send-invitation-email --project-ref tu_project_id
npx supabase functions deploy send-welcome-email --project-ref tu_project_id
```

4. **Ejecutar en desarrollo:**
```bash
npm run dev
```

## 🏗️ Arquitectura del Sistema

### Estructura de Carpetas
```
src/
├── app.ts                          # Configuración Express
├── index.ts                        # Bootstrap del servidor
├── types/                          # Definiciones TypeScript
│   ├── edificio.ts                # Tipos para edificios
│   ├── libroDigital.ts            # Tipos para libros digitales
│   ├── user.ts                    # Tipos para usuarios e invitaciones
│   └── index.ts                   # Exportaciones
├── lib/
│   └── supabase.ts                # Clientes Supabase (singletons)
├── routes/
│   ├── index.ts                   # Router principal
│   ├── auth.ts                    # Rutas de autenticación
│   ├── edificios.ts               # Rutas CRUD edificios
│   ├── invitations.ts             # Rutas de invitaciones
│   └── librosDigitales.ts         # Rutas libros digitales
├── web/
│   ├── controllers/                # Controladores HTTP
│   │   ├── authController.ts      # Controladores auth
│   │   ├── edificioController.ts  # Controladores edificios
│   │   ├── invitationController.ts # Controladores invitaciones
│   │   └── libroDigitalController.ts
│   └── middlewares/
│       └── authMiddleware.ts      # Middleware autenticación
└── domain/
    └── services/                   # Lógica de negocio
        ├── authService.ts         # Servicio autenticación
        ├── edificioService.ts     # Servicio edificios
        ├── emailService.ts        # Servicio emails
        ├── invitationService.ts   # Servicio invitaciones
        ├── libroDigitalService.ts # Servicio libros digitales
        └── userService.ts         # Servicio usuarios
```

### Patrón de Arquitectura
- **Controllers**: Manejan requests HTTP, validación básica
- **Services**: Contienen lógica de negocio y acceso a datos
- **Types**: Definiciones TypeScript para type safety
- **Routes**: Definición de endpoints y middlewares

## 📧 Sistema de Invitaciones

### Flujo Completo de Invitaciones

#### 1. **Creación de Edificio con Emails**
```typescript
// Cuando un propietario crea un edificio con emails
POST /api/edificios
{
  "name": "Edificio Ejemplo",
  "technicianEmail": "tecnico@ejemplo.com",
  "cfoEmail": "cfo@ejemplo.com",
  // ... otros campos
}
```

#### 2. **Procesamiento Automático**
El sistema automáticamente:
- ✅ Verifica si los usuarios existen
- ✅ Si existen y tienen el rol correcto → **Asignación directa**
- ✅ Si no existen → **Creación de invitación + Email**

#### 3. **Tipos de Invitación**

##### **A) Usuario Nuevo (Registro)**
```typescript
// Flujo: Email → Registro → Asignación automática
1. Sistema crea invitación con token único
2. Envía email con link: /auth/register?token=xxx
3. Usuario se registra usando el token
4. Sistema asigna automáticamente al edificio
```

##### **B) Usuario Existente (Asignación)**
```typescript
// Flujo: Email → Login → Procesamiento de asignación pendiente
1. Sistema detecta usuario existente con rol correcto
2. Crea asignación en BD inmediatamente
3. Envía email con link: /auth/auto-accept?email=xxx&building=xxx
4. Usuario hace login y sistema procesa asignación pendiente
```

### Estados de Invitación
- `pending`: Invitación enviada, esperando registro
- `accepted`: Invitación aceptada, usuario registrado
- `expired`: Invitación expirada (7 días)
- `cancelled`: Invitación cancelada por el propietario

> **📖 Referencia completa de endpoints**: Ver [API Reference](api-examples.md)  
> **🔧 Flujos técnicos detallados**: Ver [Guía Técnica de Invitaciones](invitations-technical-guide.md)

## 🚀 Configuración de Producción

### Variables de Entorno Fly.io
```bash
# Ya configuradas en Fly.io:
SUPABASE_URL ✅
SUPABASE_ANON_KEY ✅
SUPABASE_SERVICE_ROLE_KEY ✅
```

### Variables de Entorno Supabase Edge Functions
**⚠️ IMPORTANTE: Configurar en Supabase Dashboard → Edge Functions → Environment Variables**

```bash
# REQUERIDAS para producción:
RESEND_API_KEY=tu_api_key_de_resend
FRONTEND_URL=https://edificio-digital.fly.dev
```

### URLs de Producción
```typescript
// URLs correctas en producción:
- Registro: https://edificio-digital.fly.dev/auth/register?token=xxx
- Auto-accept: https://edificio-digital.fly.dev/auth/auto-accept?email=xxx&building=xxx
- Accept Assignment: https://edificio-digital.fly.dev/auth/accept-assignment?email=xxx&building=xxx
```

### Deploy
```bash
# Deploy automático con GitHub Actions
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# Deploy manual
fly deploy
```

## 🔧 Troubleshooting

### Problema: Emails no se envían
**Causa**: Variables de entorno no configuradas en Supabase
**Solución**:
```bash
# Verificar variables en Supabase Dashboard
RESEND_API_KEY=tu_api_key_de_resend
FRONTEND_URL=https://edificio-digital.fly.dev
```

### Problema: Usuario existente no se asigna
**Causa**: Error en el flujo de asignación
**Solución**: Verificar logs del backend:
```
🏢 CREANDO ASIGNACIÓN en BD para técnico existente
✅ ASIGNACIÓN CREADA en BD exitosamente
📧 Enviando EMAIL DE ASIGNACIÓN para técnico existente
✅ EMAIL DE ASIGNACIÓN enviado exitosamente
```

### Problema: Frontend no procesa asignaciones pendientes
**Causa**: Error en AuthContext o localStorage
**Solución**: Verificar en frontend:
```typescript
// En AuthContext.tsx - función login()
const pendingAssignmentData = localStorage.getItem('pendingAssignment');
if (pendingAssignmentData) {
  // Procesar asignación pendiente
}
```

### Problema: URLs incorrectas en emails
**Causa**: FRONTEND_URL mal configurada
**Solución**: Verificar variable en Supabase:
```bash
FRONTEND_URL=https://edificio-digital.fly.dev
```

## 📝 Patrones de Desarrollo

### Agregar Nuevo Endpoint
1. **Definir tipos** en `src/types/`
2. **Crear servicio** en `src/domain/services/`
3. **Crear controlador** en `src/web/controllers/`
4. **Definir rutas** en `src/routes/`
5. **Registrar rutas** en `src/routes/index.ts`

### Ejemplo: Módulo de Notificaciones
```typescript
// types/notification.ts
export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
}

// domain/services/notificationService.ts
export class NotificationService {
  async createNotification(userId: string, message: string): Promise<Notification> {
    // Lógica de negocio
  }
}

// web/controllers/notificationController.ts
export const createNotification = async (req: Request, res: Response) => {
  // Validación + llamada al servicio
};

// routes/notifications.ts
router.post('/notifications', requireAuth, createNotification);
```

### Manejo de Errores
```typescript
// Patrón estándar en controladores
try {
  const result = await service.method();
  res.status(200).json({ success: true, data: result });
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: error instanceof Error ? error.message : 'Error desconocido'
  });
}
```

### Logging
```typescript
// Patrón de logging para debugging
console.log(`🎯 PROCESANDO TÉCNICO: ${email}`);
console.log(`✅ Usuario existe - Rol: ${user.role.name} | ID: ${user.id}`);
console.log(`🏢 CREANDO ASIGNACIÓN en BD para técnico existente`);
console.log(`✅ ASIGNACIÓN CREADA en BD exitosamente`);
```

## 🔐 Seguridad

### Autenticación
- **JWT tokens** con Supabase Auth
- **Middleware de autenticación** en rutas protegidas
- **Validación de roles** en operaciones sensibles

### Autorización
- **Row Level Security (RLS)** en Supabase
- **Validación de ownership** en todos los endpoints
- **Restricciones de roles** por operación

### Validación de Datos
- **Validación de entrada** en controladores
- **Sanitización** de datos antes de BD
- **Validación de tipos** con TypeScript

## 📊 Monitoreo

### Logs Importantes
```bash
# Ver logs en tiempo real
fly logs

# Ver estado de la app
fly status

# Healthcheck
curl https://activodigital-be.fly.dev/health/supabase
```

### Métricas Clave
- **Emails enviados**: Verificar logs de Edge Functions
- **Asignaciones creadas**: Verificar logs del backend
- **Errores de autenticación**: Monitorear logs de auth
- **Performance**: Dashboard de Fly.io

## 🆘 Soporte

### Recursos
- **Documentación Supabase**: https://supabase.com/docs
- **Documentación Fly.io**: https://fly.io/docs
- **Documentación Resend**: https://resend.com/docs

### Contacto
- **Organización**: santiago-anangono
- **Repositorio**: https://github.com/Dai-Off/activodigital_be
- **URL Producción**: https://activodigital-be.fly.dev

---

**Última actualización:** Enero 2025  
**Versión:** 4.3.0 (sistema de invitaciones por email implementado)  
**Estado:** Producción Ready

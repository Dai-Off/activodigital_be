# Quick Start Guide - Activo Digital Backend

Esta guía te ayudará a configurar el proyecto rápidamente para desarrollo.

## ⚡ Setup Rápido (5 minutos)

### 1. Clonar y Instalar
```bash
git clone <repo-url>
cd activodigital-be
npm install
```

### 2. Variables de Entorno
Crear archivo `.env` en la raíz:
```dotenv
PORT=3000
NODE_ENV=development

# Supabase (Empresa) - Ya configuradas
SUPABASE_URL=https://eqyevtkljwvhfsohawrk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxeWV2dGtsand2aGZzb2hhd3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NzU2MTEsImV4cCI6MjA3MzI1MTYxMX0.fPwIWpcH-jKJFxZ_gCZBV6c8hjoDKvN4v361eVtD0N8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxeWV2dGtsand2aGZzb2hhd3JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY3NTYxMSwiZXhwIjoyMDczMjUxNjExfQ.CPy0R9AprbYLtK52SbzNF69EImU4QqEUu0Y1L77mrp8
```

### 3. Ejecutar
```bash
npm run dev
```

**¡Listo!** El servidor estará corriendo en `http://localhost:3000`

## 🧪 Pruebas Rápidas

### Healthcheck
```bash
curl http://localhost:3000/health/supabase
```

### Registro de Usuario
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ejemplo.com","password":"123456","full_name":"Test User"}'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ejemplo.com","password":"123456"}'
```

## 📚 Documentación Completa

- **🚀 [Guía del Desarrollador](developer-guide.md)** - Guía completa
- **🔧 [Guía Técnica de Invitaciones](invitations-technical-guide.md)** - Sistema de invitaciones
- **📖 [API Reference](api-examples.md)** - Referencia completa de la API

## 🚨 Problemas Comunes

### Error: "fetch failed"
**Solución**: Verificar que las variables de entorno estén configuradas correctamente.

### Error: "Missing env SUPABASE_URL"
**Solución**: Crear archivo `.env` con las variables de Supabase.

### Error: "invalid role"
**Solución**: Los roles válidos son: `propietario`, `tecnico`, `cfo`, `administrador`.

## 🔧 Scripts Disponibles

```bash
npm run dev      # Desarrollo con autoreload
npm run build    # Compilar TypeScript
npm start        # Ejecutar compilado
npm run lint     # Ejecutar ESLint
```

## 🌐 URLs Importantes

- **Local**: `http://localhost:3000`
- **Producción**: `https://activodigital-be.fly.dev`
- **Healthcheck**: `http://localhost:3000/health/supabase`

## 📞 Soporte

- **Documentación**: Ver archivos en `docs/`
- **Issues**: Crear issue en GitHub
- **Logs**: `fly logs` (en producción)

---

**Tiempo de setup**: ~5 minutos  
**Última actualización**: Enero 2025

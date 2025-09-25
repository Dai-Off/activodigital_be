# Supabase Edge Functions para ActivoDigital

Este directorio contiene las Edge Functions de Supabase para el envío de emails en el sistema de invitaciones.

## Funciones Disponibles

### 1. send-invitation-email
Envía emails de invitación a técnicos y CFOs cuando son invitados a un edificio.

**Endpoint:** `https://your-project.supabase.co/functions/v1/send-invitation-email`

**Payload esperado:**
```json
{
  "to": "usuario@ejemplo.com",
  "subject": "Invitación para ser Técnico en Edificio Ejemplo",
  "html": "<html>...</html>",
  "text": "Texto plano del email",
  "invitation": {
    "id": "uuid-invitacion",
    "token": "token-unico",
    "role": "tecnico",
    "expiresAt": "2024-01-15T10:00:00Z"
  },
  "building": {
    "id": "uuid-edificio",
    "name": "Edificio Ejemplo",
    "address": "Calle Falsa 123"
  },
  "invitedBy": {
    "name": "Propietario Nombre",
    "email": "propietario@ejemplo.com"
  }
}
```

### 2. send-welcome-email
Envía emails de bienvenida después de que un usuario se registra exitosamente.

**Endpoint:** `https://your-project.supabase.co/functions/v1/send-welcome-email`

**Payload esperado:**
```json
{
  "to": "usuario@ejemplo.com",
  "subject": "¡Bienvenido a ActivoDigital!",
  "html": "<html>...</html>",
  "user": {
    "name": "Usuario Nombre",
    "role": "Técnico",
    "building": "Edificio Ejemplo"
  }
}
```

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la carpeta `supabase/functions/` con las siguientes variables:

```bash
# Resend API Key para envío de emails
RESEND_API_KEY=tu_api_key_de_resend

# URL del frontend para los enlaces de registro
FRONTEND_URL=http://localhost:3000
```

### 2. Configurar Resend

1. Ve a [Resend.com](https://resend.com) y crea una cuenta
2. Obtén tu API Key desde el dashboard
3. Configura un dominio verificado (opcional, pero recomendado)
4. Actualiza la variable `RESEND_API_KEY` en tu archivo `.env`

### 3. Desplegar las Funciones

```bash
# Desde el directorio raíz del proyecto
npx supabase functions deploy send-invitation-email
npx supabase functions deploy send-welcome-email
```

### 4. Configurar Variables de Entorno en Supabase

En el dashboard de Supabase:
1. Ve a "Edge Functions" → "Settings"
2. Agrega las variables de entorno:
   - `RESEND_API_KEY`: Tu API key de Resend
   - `FRONTEND_URL`: URL de tu frontend

## Pruebas Locales

Para probar las funciones localmente:

```bash
# Iniciar Supabase localmente
npx supabase start

# Las funciones estarán disponibles en:
# http://localhost:54321/functions/v1/send-invitation-email
# http://localhost:54321/functions/v1/send-welcome-email
```

## Integración con el Backend

El backend ya está configurado para usar estas funciones. Solo necesitas:

1. **Configurar las variables de entorno** en tu proyecto de Supabase
2. **Desplegar las funciones** a Supabase
3. **Verificar que el backend tenga acceso** a las funciones

## Troubleshooting

### Error: "RESEND_API_KEY environment variable is not set"
- Verifica que hayas configurado la variable de entorno en Supabase
- Asegúrate de que la variable esté disponible para las Edge Functions

### Error: "Failed to send email: 401"
- Verifica que tu API key de Resend sea válida
- Asegúrate de que tu cuenta de Resend esté activa

### Error: "Failed to send email: 422"
- Verifica que el email tenga un formato válido
- Asegúrate de que el dominio esté verificado en Resend (si usas un dominio personalizado)

## Monitoreo

Puedes monitorear el envío de emails en:
1. **Resend Dashboard**: Ve todos los emails enviados
2. **Supabase Logs**: Ve los logs de las Edge Functions
3. **Backend Logs**: Ve los logs de tu aplicación

## Personalización

### Cambiar el Remitente
Edita el campo `from` en ambas funciones:
```typescript
from: 'ActivoDigital <noreply@tu-dominio.com>'
```

### Personalizar Templates
Los templates HTML se generan en el backend (`emailService.ts`). Puedes modificarlos según tus necesidades.

### Agregar Más Proveedores de Email
Puedes reemplazar Resend con otros proveedores como:
- SendGrid
- Mailgun
- Amazon SES
- Postmark

Solo necesitas cambiar la URL de la API y el formato del payload en las funciones.

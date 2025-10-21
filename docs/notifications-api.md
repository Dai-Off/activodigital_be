# Sistema de Notificaciones - API Documentation

## Descripción
Sistema básico de notificaciones para mejorar la experiencia de usuario durante el procesamiento de documentos con IA.

## Características
- Notificaciones en tiempo real durante el procesamiento de IA
- Gestión de estado (leído/no leído)
- Limpieza automática de notificaciones antiguas
- Integración con el proceso de creación de libros digitales

## Endpoints

### GET /api/notifications
Obtiene las notificaciones del usuario autenticado.

**Query Parameters:**
- `status` (opcional): `unread` | `read`
- `type` (opcional): Tipo de notificación
- `limit` (opcional): Número máximo de notificaciones (default: 50)
- `offset` (opcional): Offset para paginación (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "ai_processing_start",
      "title": "Procesando documento con IA",
      "message": "Iniciando análisis del documento...",
      "status": "unread",
      "metadata": {
        "fileName": "documento.pdf",
        "buildingId": "uuid",
        "stage": "start"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "readAt": null
    }
  ],
  "count": 1,
  "filters": {}
}
```

### GET /api/notifications/unread-count
Obtiene el conteo de notificaciones no leídas.

**Response:**
```json
{
  "unreadCount": 5
}
```

### PUT /api/notifications/:id/read
Marca una notificación específica como leída.

**Response:**
```json
{
  "message": "Notificación marcada como leída",
  "success": true
}
```

### PUT /api/notifications/mark-all-read
Marca todas las notificaciones del usuario como leídas.

**Response:**
```json
{
  "message": "3 notificaciones marcadas como leídas",
  "count": 3
}
```

### DELETE /api/notifications/:id
Elimina una notificación específica.

**Response:**
```json
{
  "message": "Notificación eliminada exitosamente",
  "success": true
}
```

### DELETE /api/notifications/cleanup
Elimina notificaciones antiguas.

**Query Parameters:**
- `days` (opcional): Días de antigüedad (default: 30)

**Response:**
```json
{
  "message": "5 notificaciones antiguas eliminadas",
  "count": 5,
  "daysOld": 30
}
```

## Tipos de Notificaciones

### AI Processing Notifications
- `ai_processing_start`: Inicio del procesamiento
- `ai_processing_progress`: Progreso del procesamiento
- `ai_processing_complete`: Procesamiento completado exitosamente
- `ai_processing_error`: Error durante el procesamiento

### General Notifications
- `book_created`: Libro digital creado
- `book_updated`: Libro digital actualizado
- `general`: Notificación general

## Integración con Proceso de IA

El sistema se integra automáticamente con el proceso de creación de libros digitales:

1. **Inicio**: Se crea notificación cuando el usuario sube un documento
2. **Progreso**: Se crean notificaciones durante el procesamiento (25%, 75%)
3. **Finalización**: Se crea notificación cuando el libro se crea exitosamente
4. **Errores**: Se crean notificaciones para cualquier error durante el proceso

## Base de Datos

### Tabla: notifications
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unread',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE NULL
);
```

### Funciones de Base de Datos
- `mark_notification_as_read(notification_id UUID)`: Marca notificación como leída
- `get_unread_notifications_count()`: Obtiene conteo de no leídas

## Seguridad
- Todas las rutas requieren autenticación
- Los usuarios solo pueden ver/modificar sus propias notificaciones
- RLS (Row Level Security) habilitado

## Ejemplo de Uso

```javascript
// Obtener notificaciones no leídas
const response = await fetch('/api/notifications?status=unread', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

// Marcar como leída
await fetch('/api/notifications/123/read', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

// Obtener conteo de no leídas
const countResponse = await fetch('/api/notifications/unread-count', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const { unreadCount } = await countResponse.json();
```

## Migración
Para instalar el sistema de notificaciones, ejecuta la migración:
```bash
# En PowerShell
.\scripts\run-migration-019.ps1

# O directamente en PostgreSQL/Supabase
psql -f database/migrations/019_create_notifications_system.sql
```

# API Reference - Activo Digital Backend

Este documento contiene la referencia completa de la API para gestión de edificios, libros digitales e invitaciones.

## Autenticación

Todas las rutas requieren autenticación. Incluye el token JWT en el header:

```
Authorization: Bearer <tu_jwt_token>
```

## Edificios (Buildings)

### Crear un edificio

```http
POST /edificios
Content-Type: application/json

{
  "name": "Edificio Residencial Centro",
  "address": "Calle Mayor 123, Madrid",
  "cadastralReference": "1234567890",
  "constructionYear": 2010,
  "typology": "residential",
  "numFloors": 5,
  "numUnits": 20,
  "lat": 40.4168,
  "lng": -3.7038,
  "images": [
    {
      "id": "img-1",
      "url": "https://example.com/image1.jpg",
      "title": "Fachada principal",
      "isMain": true
    }
  ]
}
```

### Obtener todos los edificios del usuario

```http
GET /edificios
```

### Obtener un edificio específico

```http
GET /edificios/{id}
```

### Actualizar un edificio

```http
PUT /edificios/{id}
Content-Type: application/json

{
  "name": "Nuevo nombre del edificio",
  "numUnits": 25
}
```

### Actualizar el estado de un edificio

```http
PATCH /edificios/{id}/status
Content-Type: application/json

{
  "status": "ready_book"
}
```

### Agregar una imagen

```http
POST /edificios/{id}/images
Content-Type: application/json

{
  "id": "img-2",
  "url": "https://example.com/image2.jpg",
  "title": "Vista interior",
  "isMain": false
}
```

### Establecer imagen principal

```http
PATCH /edificios/{id}/images/{imageId}/main
```

### Eliminar una imagen

```http
DELETE /edificios/{id}/images/{imageId}
```

### Eliminar un edificio

```http
DELETE /edificios/{id}
```

## Libros Digitales

### Crear un libro digital

```http
POST /libros-digitales
Content-Type: application/json

{
  "buildingId": "uuid-del-edificio",
  "source": "manual"
}
```

### Obtener el libro de un edificio

```http
GET /libros-digitales/building/{buildingId}
```

### Actualizar una sección del libro

```http
PUT /libros-digitales/{id}/sections/{sectionType}
Content-Type: application/json

{
  "content": {
    "nombreEdificio": "Residencial Las Flores",
    "direccion": "Calle Mayor 123, Madrid",
    "anioConstruccion": 1999,
    "tipologia": "residencial",
    "superficieTotal": 2500
  },
  "complete": true
}
```

Requisitos y notas:
- Autenticación: Bearer token del **técnico asignado** al edificio/libro.
- Obtener `bookId` primero:
  - `GET /libros-digitales/building/{buildingId}` → `data.id`.
  - Si 404: crear con `POST /libros-digitales` `{ "buildingId": "<buildingId>", "source": "manual" }` y repetir el GET.
- `sectionType` debe estar en inglés: `general_data`, `construction_features`, `certificates_and_licenses`, `maintenance_and_conservation`, `facilities_and_consumption`, `renovations_and_rehabilitations`, `sustainability_and_esg`, `annex_documents`.

Ejemplo cURL (local):
```bash
TOKEN="<ACCESS_TOKEN_TECNICO>"
BUILDING_ID="<UUID>"

# Obtener/crear libro
BOOK_ID=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/libros-digitales/building/$BUILDING_ID | jq -r '.data.id')
if [ "$BOOK_ID" = "null" ]; then
  BOOK_ID=$(curl -s -X POST http://localhost:3000/libros-digitales \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"buildingId":"'"$BUILDING_ID"'","source":"manual"}' | jq -r '.data.id')
fi

# Actualizar sección
curl -X PUT http://localhost:3000/libros-digitales/$BOOK_ID/sections/general_data \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"content":{"nombreEdificio":"Residencial Las Flores"},"complete":true}'
```

Tipos de sección válidos (usar SIEMPRE en inglés):
- `general_data`
- `construction_features`
- `certificates_and_licenses`
- `maintenance_and_conservation`
- `facilities_and_consumption`
- `renovations_and_rehabilitations`
- `sustainability_and_esg`
- `annex_documents`

Notas:
- El libro digital está ligado al edificio (no a listados por usuario ni acceso por id).
- El estado del libro se calcula automáticamente al actualizar secciones: pasa de `draft` a `in_progress` cuando hay progreso y a `complete` cuando las 8 secciones están completas.

### Ejemplo de respuesta de libro digital (resumen)

```json
{
  "data": {
    "id": "uuid-1234",
    "buildingId": "uuid-edificio-5678",
    "status": "in_progress",
    "progress": 3,
    "estado": "en_borrador",
    "version": 1,
    "sections": [
      { "id": "s1", "type": "datos_generales", "complete": true },
      { "id": "s2", "type": "agentes_intervinientes", "complete": false },
      { "id": "s3", "type": "proyecto_tecnico", "complete": true }
    ]
  }
}
```

## Respuestas de la API

### Respuesta exitosa

```json
{
  "data": {
    "id": "uuid",
    "name": "Edificio Ejemplo",
    // ... resto de datos
  }
}
```

### Respuesta de error

```json
{
  "error": "Descripción del error"
}
```

## Sistema de Invitaciones

### Crear Invitación Manual
```http
POST /api/invitations
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "tecnico@ejemplo.com",
  "role": "tecnico",
  "buildingId": "uuid-del-edificio"
}
```

### Validar Invitación
```http
GET /api/auth/validate-invitation/{token}
```

### Registro con Invitación
```http
POST /api/auth/register-with-invitation
Content-Type: application/json

{
  "email": "tecnico@ejemplo.com",
  "password": "password123",
  "full_name": "Técnico Nombre",
  "invitation_token": "token-de-invitacion"
}
```

### Auto-Accept (Usuarios Existentes)
```http
GET /api/auth/auto-accept?email=xxx&building=xxx
```

### Procesar Asignaciones Pendientes
```http
POST /api/auth/process-pending-assignments
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "tecnico@ejemplo.com",
  "buildingId": "uuid-edificio"
}
```

### Obtener Invitaciones Enviadas
```http
GET /api/invitations
Authorization: Bearer <token>
```

### Cancelar Invitación
```http
DELETE /api/invitations/{invitationId}
Authorization: Bearer <token>
```

## Códigos de estado HTTP

- `200` - OK
- `201` - Creado
- `204` - Sin contenido (para eliminaciones)
- `400` - Petición incorrecta
- `401` - No autenticado
- `404` - No encontrado
- `500` - Error interno del servidor

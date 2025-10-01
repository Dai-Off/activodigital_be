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

### Actualizar una sección con documentos

Las secciones del libro digital ahora soportan arrays de documentos (`DocumentFile[]`). Los documentos se suben primero a Supabase Storage desde el frontend, y luego se guarda la referencia en la base de datos.

**Ejemplo: Proyecto Técnico con documentos**

```http
PUT /libros-digitales/{id}/sections/{sectionType}
Content-Type: application/json

{
  "content": {
    "proyectoEjecucion": [
      {
        "id": "doc-123456789",
        "url": "https://supabase.co/storage/v1/object/sign/digital-book-documents/...",
        "fileName": "Proyecto_Ejecucion_2024.pdf",
        "fileSize": 2458624,
        "mimeType": "application/pdf",
        "title": "Proyecto de Ejecución",
        "uploadedAt": "2024-01-15T10:30:00.000Z",
        "uploadedBy": "user-uuid-123"
      }
    ],
    "planos": [
      {
        "id": "doc-987654321",
        "url": "https://supabase.co/storage/v1/object/sign/digital-book-documents/...",
        "fileName": "Plano_Planta_Baja.dwg",
        "fileSize": 1024000,
        "mimeType": "application/x-dwg",
        "title": "Plano Planta Baja",
        "uploadedAt": "2024-01-15T10:35:00.000Z",
        "uploadedBy": "user-uuid-123"
      }
    ]
  },
  "complete": true
}
```

**Estructura de DocumentFile:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | Identificador único del documento |
| `url` | string | URL firmada de Supabase Storage |
| `fileName` | string | Nombre original del archivo |
| `fileSize` | number | Tamaño en bytes |
| `mimeType` | string | Tipo MIME del archivo |
| `title` | string (opcional) | Título descriptivo |
| `uploadedAt` | string | Fecha ISO de subida |
| `uploadedBy` | string | ID del usuario que subió |

**Tipos MIME soportados:**
- `application/pdf`
- `application/msword` (.doc)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx)
- `application/vnd.ms-excel` (.xls)
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (.xlsx)
- `image/jpeg`, `image/png`, `image/webp`
- `application/zip`
- `text/plain`

**Secciones que soportan documentos:**
- `proyecto_tecnico`: `proyectoEjecucion`, `modificacionesProyecto`, `memoriaObra`, `planos`
- `documentacion_administrativa`: `licenciasObra`, `licenciaPrimeraOcupacion`, `autorizacionesAdministrativas`, `garantiasAgentes`, `seguroDecenal`
- `manual_uso_mantenimiento`: `instruccionesUso`, `planMantenimientoPreventivo`, `recomendacionesConservacion`, `documentacionInstalaciones`
- `certificados_garantias`: `certificadosInstalaciones`, `garantiasMaterialesEquipos`
- `anexos_planos`: `planosAdjuntos`, `otrosAnexos`

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
- `general_data` - Datos generales del edificio
- `construction_features` - Características constructivas
- `certificates_and_licenses` - Certificados y licencias
- `maintenance_and_conservation` - Mantenimiento y conservación
- `facilities_and_consumption` - Instalaciones y consumo
- `renovations_and_rehabilitations` - Renovaciones y rehabilitaciones
- `sustainability_and_esg` - Sostenibilidad y ESG
- `annex_documents` - Documentos anexos

Notas:
- El libro digital está ligado al edificio (no a listados por usuario ni acceso por id).
- El estado del libro se calcula automáticamente al actualizar secciones: pasa de `draft` a `in_progress` cuando hay progreso y a `complete` cuando las 8 secciones están completas.
- Los documentos se suben desde el frontend directamente a Supabase Storage, y luego se guarda la referencia en la base de datos.
- Límite: 10 MB por archivo.
- El backend valida la estructura de `DocumentFile` antes de guardar.

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

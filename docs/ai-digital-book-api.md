# API de Libro Digital con Procesamiento de IA

## Descripción

Este endpoint permite cargar un documento (PDF o texto) del libro digital de un edificio y procesarlo automáticamente con IA (OpenAI GPT-4) para extraer todos los datos relevantes y crear el libro digital de forma automática.

## Endpoint

```
POST /api/libros-digitales/upload-ai
```

## Autenticación

Requiere token JWT en el header:
```
Authorization: Bearer <token>
```

## Formato de la Petición

### Tipo: `multipart/form-data`

**Campos del formulario:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `document` | File | ✅ Sí | Archivo del libro digital (PDF o TXT) |
| `buildingId` | String | ✅ Sí | UUID del edificio al que pertenece el libro |

**Formatos de archivo soportados:**
- PDF: `application/pdf`
- Texto plano: `text/plain`

**Tamaño máximo:** 10 MB

## Ejemplo de Uso

### Con cURL

```bash
curl -X POST https://api.activodigital.com/api/libros-digitales/upload-ai \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@/path/to/libro-digital.pdf" \
  -F "buildingId=123e4567-e89b-12d3-a456-426614174000"
```

### Con JavaScript (Fetch API)

```javascript
const formData = new FormData();
formData.append('document', fileInput.files[0]);
formData.append('buildingId', '123e4567-e89b-12d3-a456-426614174000');

const response = await fetch('/api/libros-digitales/upload-ai', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

### Con Postman

1. Selecciona método **POST**
2. URL: `http://localhost:3000/api/libros-digitales/upload-ai`
3. En la pestaña **Authorization**:
   - Type: `Bearer Token`
   - Token: `tu_token_jwt`
4. En la pestaña **Body**:
   - Selecciona `form-data`
   - Agrega campo `document` tipo `File` y selecciona el PDF
   - Agrega campo `buildingId` tipo `Text` con el UUID del edificio
5. Envía la petición

## Respuesta Exitosa

### HTTP 201 Created

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "buildingId": "123e4567-e89b-12d3-a456-426614174000",
    "source": "pdf",
    "status": "draft",
    "progress": 5,
    "sections": [
      {
        "id": "abc-123",
        "type": "general_data",
        "complete": true,
        "content": {
          "buildingName": "Edificio Central",
          "address": "Calle Mayor 123, Madrid",
          "constructionYear": 2010,
          "totalArea": 5000
        }
      },
      {
        "id": "abc-124",
        "type": "construction_features",
        "complete": true,
        "content": {
          "structureType": "hormigón armado",
          "numberOfFloors": 5
        }
      },
      // ... más secciones
    ],
    "technicianId": "user-uuid",
    "createdAt": "2025-10-20T10:30:00Z",
    "updatedAt": "2025-10-20T10:30:00Z"
  },
  "message": "Libro digital creado exitosamente mediante IA",
  "metadata": {
    "fileName": "libro-digital.pdf",
    "fileSize": 1024567,
    "mimeType": "application/pdf",
    "extractedTextLength": 25000,
    "sectionsGenerated": 8
  }
}
```

## Errores Comunes

### 400 Bad Request - Archivo no proporcionado

```json
{
  "error": "No se ha proporcionado ningún archivo"
}
```

### 400 Bad Request - buildingId faltante

```json
{
  "error": "buildingId es requerido"
}
```

### 400 Bad Request - Formato no soportado

```json
{
  "error": "Formato de archivo no permitido. Solo se aceptan PDF y archivos de texto.",
  "supportedFormats": ["application/pdf", "text/plain"]
}
```

### 400 Bad Request - Documento sin suficiente texto

```json
{
  "error": "El documento no contiene suficiente texto para procesar",
  "minLength": 100,
  "foundLength": 45
}
```

### 401 Unauthorized

```json
{
  "error": "Usuario no autenticado"
}
```

### 403 Forbidden

```json
{
  "error": "No tienes permisos para crear un libro digital para este edificio"
}
```

### 409 Conflict - Libro ya existe (Solo en carga manual)

```json
{
  "error": "Este edificio ya tiene un libro digital asociado"
}
```

**Nota**: Este error NO ocurre en `/upload-ai` porque sobrescribe automáticamente el libro existente.

### 413 Payload Too Large

```json
{
  "error": "El archivo excede el tamaño máximo permitido (10MB)"
}
```

### 500 Internal Server Error - Error de IA

```json
{
  "error": "Error al procesar el documento con IA",
  "details": "Descripción del error específico"
}
```

## Secciones Extraídas

El sistema procesa el documento y extrae información para **8 secciones**:

1. **general_data** - Datos generales del edificio
2. **construction_features** - Características constructivas
3. **certificates_and_licenses** - Certificados y licencias
4. **maintenance_and_conservation** - Mantenimiento y conservación
5. **facilities_and_consumption** - Instalaciones y consumo
6. **renovations_and_rehabilitations** - Reformas y rehabilitaciones
7. **sustainability_and_esg** - Sostenibilidad y ESG
8. **annex_documents** - Documentos anexos

Cada sección se marca como `complete: true` si se encontró información relevante.

## Flujo de Procesamiento

1. **Validación**: Se verifica el archivo y los permisos del usuario
2. **Extracción**: Se extrae el texto del PDF o archivo de texto
3. **Procesamiento IA**: OpenAI GPT-4 analiza el texto y estructura los datos
4. **Validación**: Se validan las 8 secciones generadas
5. **Creación**: Se crea el libro digital en la base de datos
6. **Respuesta**: Se devuelve el libro digital completo

## Permisos Requeridos

- El usuario debe ser **TECNICO** con acceso al edificio, o
- El usuario debe ser **PROPIETARIO** del edificio

## Variables de Entorno

Asegúrate de tener configurada:

```bash
OPENAI_API_KEY=sk-...
```

## Notas Importantes

- 🔄 Si el edificio **ya tiene** un libro digital, será **sobrescrito** automáticamente
- 📄 El documento debe contener al menos 100 caracteres de texto
- 🤖 El procesamiento con IA puede tardar 10-30 segundos dependiendo del tamaño del documento
- ✅ El libro se crea con `status: "draft"` por defecto
- 💾 El progreso se calcula automáticamente según las secciones completadas

## Diferencias con la Carga Manual

| Característica | Carga Manual (`POST /`) | Carga con IA (`POST /upload-ai`) |
|----------------|-------------------------|----------------------------------|
| Entrada | JSON estructurado | Archivo PDF/TXT |
| Procesamiento | Inmediato | 10-30 segundos |
| Extracción | Manual | Automática con IA |
| Fuente | `manual` | `pdf` |
| Precisión | 100% | ~90% (depende del documento) |
| Sobrescribir | ❌ Error si existe | ✅ Sobrescribe automáticamente |

## Siguientes Pasos

Después de crear el libro con IA:

1. **Revisar** las secciones generadas
2. **Editar** usando `PUT /:id/sections/:sectionType` si es necesario
3. **Completar** información faltante manualmente
4. **Cambiar estado** cuando esté listo

## Soporte

Para reportar problemas o solicitar mejoras, contacta al equipo de desarrollo.


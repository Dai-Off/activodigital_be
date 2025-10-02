# API de Certificados Energéticos

Este documento describe los endpoints disponibles para gestionar certificados energéticos en la API de Activo Digital Backend.

La funcionalidad permite el flujo completo: **Subir documentos → IA extrae datos → Técnico revisa → Confirma certificado**.

## Endpoints Disponibles

### 1. Crear Sesión de Certificado Energético
**POST** `/api/certificados-energeticos/sessions`

Crea una nueva sesión para procesar certificados energéticos con documentos asociados.

**Body:**
```json
{
  "buildingId": "uuid-del-edificio",
  `"kind": "building|dwelling|commercial_unit",
  "documents": [
    {
      "filename": "certificado_energetico.pdf",
      "url": "https://storage.url/documento.pdf",
      "mimeType": "application/pdf",
      "uploadedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "id": "session-uuid",
    "buildingId": "building-uuid",
    "kind": "building",
    "status": "uploaded",
    "documents": ["doc-uuid-1"],
    "extractedData": null,
    "editedData": null,
    "reviewerUserId": null,
    "errorMessage": null,
    "userId": "user-uuid",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### 2. Procesar Datos de IA
**POST** `/api/certificados-energeticos/process-ai-data`

Actualiza una sesión con datos extraídos por inteligencia artificial.

**Body:**
```json
{
  "sessionId": "session-uuid",
  "extractedData": {
    "rating": {
      "value": "D",
      "confidence": 0.95,
      "source": "ocr_page_1"
    },
    "primaryEnergyKwhPerM2Year": {
      "value": 145.2,
      "confidence": 0.87,
      "source": "ocr_table_2"
    },
    "emissionsKgCo2PerM2Year": {
      "value": 28.5,
      "confidence": 0.92,
      "source": "ocr_table_2"
    },
    "certificateNumber": {
      "value": "CE-E-2024-001234",
      "confidence": 0.98,
      "source": "ocr_header"
    },
    "scope": {
      "value": "building",
      "confidence": 0.89,
      "source": "ocr_context"
    },
    "issuerName": {
      "value": "Técnico Certificador",
      "confidence": 0.85,
      "source": "ocr_signature"
    },
    "issueDate": {
      "value： "2024-03-15",
      "confidence": 0.93,
      "source": "ocr_dates"
    },
    "expiryDate": {
      "value": "2034-03-15",
      "confidence": 0.93,
      "source": "ocr_dates"
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "id": "session-uuid",
    "status": "extracted",
    "extractedData": { /* datos completos con confidence */ },
    "updatedAt": "2025-01-15T10:31:00.000Z"
  }
}
```

### 3. Confirmar Certificado Energético
**POST** `/api/certificados-energeticos/sessions/:sessionId/confirm`

Guarda definitivamente el certificado energético después de la revisión técnica.

**Body:**
```json
{
  "rating": "D",
  "primaryEnergyKwhPerM2Year": 145.2,
  "emissionsKgCo2PerM2Year": 28.5,
  "certificateNumber": "CE-E-2024-001234",
  "scope": "building",
  "issuerName": "Técnico Certificador Energético S.L.",
  "issueDate": "2024-03-15",
  "expiryDate": "2034-03-15",
  "propertyReference": "1234567890ABCD1234",
  "notes": "Certificado revisado y validado por técnico competente"
}
```

**Response:**
```json
{
  "data": {
    "id": "certificate-uuid",
    "buildingId": "building-uuid",
    "kind": "building",
    "rating": "D",
    "primaryEnergyKwhPerM2Year": 145.2,
    "emissionsKgCo2PerM2Year": 28.5,
    "certificateNumber": "CE-E-2024-001234",
    "scope": "building",
    "issuerName": "Técnico Certificador Energético S.L.",
    "issueDate": "2024-03-15",
    "expiryDate": "2034-03-15",
    "propertyReference": "1234567890ABCD1234",
    "notes": "Certificado revisado y validado...",
    "sourceDocumentUrl": "https://storage.url/certificado.pdf",
    "sourceSessionId": "session-uuid",
    "userId": "user-uuid",
    "createdAt": "2025-03-15T10:45:00.000Z",
    "updatedAt": "2025-01-15T10:45:00.000Z"
  }
}
```

### 4. Actualizar Sesión Manualmente
**PUT** `/api/certificados-energeticos/sessions/:sessionId`

Permite actualizar manualmente el estado de una sesión.

**Body:**
```json
{
  "status": "extracted|reviewed|confirmed|failed",
  "extractedData": { /* datos de IA */ },
  "editedData": { /* correcciones técnicas */ },
  "errorMessage": "Mensaje de error si corresponde"
}
```

### 5. Obtener Certificados por Edificio
**GET** `/api/certificados-energeticos/building/:buildingId`

**Response:**
```json
{
  "data": {
    "sessions": [
      {
        "id": "session-uuid",
        "buildingId": "building-uuid",
        "kind": "building",
        "status": "confirmed",
        "documents": ["document-uuid"],
        "extractedData": { /* datos extraídos por IA */ },
        "editedData": { /* datos editados por técnico */ },
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "certificates": [
      {
        "id": "certificate-uuid",
        "buildingId": "building-uuid",
        "kind": "building",
        "rating": "D",
        "primaryEnergyKwhPerM2Year": 145.2,
        "emissionsKgCo2PerM2Year": 28.5,
        "certificateNumber": "CE-E-2024-001234",
        "scope": "building",
        "issuerName": "Técnico Certificador Energético",
        "issueDate": "2024-03-15",
        "expiryDate": "2034-03-15",
        "sourceDocumentUrl": "https://storage.url/certificado.pdf",
        "createdAt": "2025-03-15T10:45:00.000Z"
      }
    ]
  }
}
```

### 6. Obtener Todos los Certificados del Usuario
**GET** `/api/certificados-energeticos`

### 7. Eliminar Sesión
**DELETE** `/api/certificados-energeticos/sessions/:sessionId`

### 8. Eliminar Certificado Confirmado
**DELETE** `/api/certificados-energeticos/:certificateId`

### 9. Obtener Documentos de una Sesión
**GET** `/api/certificados-energeticos/sessions/:sessionId/documents`

Obtiene los documentos originales de una sesión específica para visualización.

**Response:**
```json
{
  "data": [
    {
      "id": "document-uuid",
      "buildingId": "building-uuid",
      "kind": "building",
      "filename": "certificado_energetico.pdf",
      "url": "https://storage.url/certificado.pdf",
      "mimeType": "application/pdf",
      "uploadedAt": "2025-01-15T10:30:00.000Z",
      "userId": "user-uuid"
    }
  ]
}
```

## Estados de Sesión

- `uploaded`: Documentos subidos, listos para procesamiento
- `processing`: IA está procesando los documentos
- `extracted`: IA extraje datos, pendiente revisión técnica
- `reviewed`: Técnico revisó y ajustó datos
- `confirmed`: Certificado confirmado y guardado definitivamente
- `failed`: Error en el procesamiento

## tipos de Certificado

- `building`: Edificio completo
- `dwelling`: Vivienda específica
- `commercial_unit`: Local comercial específico

## Calificaciones Energéticas

- `A`, `B`, `C`, `D`, `E`, `F`, `G`: Calificaciones energéticas estándar
- `ND`: No disponible/sin datos suficientes

## Manejo de Errores

Todos los endpoints pueden devolver los siguientes errores:

- **401**: Usuario no autenticado
- **400**: Datos de entrada incorrectos o faltantes
- **404**: Sesión/edificio/certificado no encontrado
- **403**: Sin permisos para acceder al recurso
- **500**: Error interno del servidor

**Formato de error:**
```json
{
  "error": "Descripción específica del error"
}
```

## Estructura de Base de Datos

### Tabla `energy_certificate_documents`
- `id`: UUID del documento
- `building_id`: ID del edificio asociado
- `filename`: Nombre del archivo
- `url`: URL firmada de Supabase Storage
- `mime_type`: Tipo MIME del archivo
- `uploaded_at`: Fecha de subida

### Tabla `energy_certificate_sessions`
- `id`: UUID de la sesión
- `building_id`: ID del edificio asociado
- `kind`: Tipo de certificado (building/dwelling/commercial_unit)
- `status`: Estado actual de la sesión
- `documents`: Array de IDs de documentos
- `extracted_data`: JSONB con datos extraídos por IA
- `edited_data`: JSONB con modificaciones del técnico
- `reviewer_user_id`: ID del técnico que revisó
- `error_message`: Mensaje de error si falló

### Tabla `energy_certificates`
- `id`: UUID del certificado confirmado
- `building_id`: ID del edificio asociado
- `kind`: Tipo de certificado
- `rating`: Calificación energética (A-G, ND)
- `primary_energy_kwh_per_m2_year`: Consumo energético
- `emissions_kg_co2_per_m2_year`: Emisiones de CO2
- `certificate_number`: Número del certificado
- `scope`: Ámbito del certificado
- `issuer_name`: Nombre del técnico certificador
- `issue_date`: Fecha de emisión
- `expiry_date`: Fecha de caducidad
- `property_reference`: Referencia catastral opcional
- `notes`: Observaciones adicionales
- `source_document_url`: **NUEVO**: URL del documento original
- `source_session_id`: ID de la sesión origen

## Autenticación

Todos los endpoints requieren autenticación mediante JWT en el header:
```
Authorization: Bearer <token>
```

## Notas para el Frontend

1. **Flujo completo recomendado**: 
   ```
   1. Crear sesión (POST /sessions)
   2. Procesar con IA (POST /process-ai-data)
   3. Mostrar datos + documento para revisión
   4. Permitir editar datos si necesario
   5. Confirmar certificado (POST /sessions/:id/confirm)
   ```
   
2. **Visualización de documentos**: Usa `sourceDocumentUrl` del certificado o `/sessions/:id/documents`

3. **Datos de IA**: Los campos vienen con `confidence` scores (0-1) para mostrar fiabilidad

4. **Validación**: Todos los campos marcados como requeridos deben estar presentes antes de confirmar

5. **Autenticación**: Todos los endpoints requieren token válido en header `Authorization: Bearer <token>`

6. **Optimización**: Las URLs de documentos son firmadas y tienen caducidad (1 año por defecto)

## Ejemplos de Uso Completo

### PowerShell (Flujo Completo)
```powershell
# Headers con autenticación
$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = "Bearer $token"
}

# 1. Crear sesión
$sessionData = @{
    buildingId = "building-uuid"
    kind = "building"
    documents = @(
        @{
            filename = "certificado.pdf"
            url = "https://storage.url/cert.pdf"
            mimeType = "application/pdf"
            uploadedAt = "2025-01-15T10:30:00.000Z"
        }
    )
} | ConvertTo-Json -Depth 3

$session = Invoke-RestMethod -Uri "http://localhost:3000/api/certificados-energeticos/sessions" -Method POST -Headers $headers -Body $sessionData

# 2. Procesar con IA
$aiData = @{
    sessionId = $session.data.id
    extractedData = @{
        rating = @{ value = "D"; confidence = 0.95 }
        primaryEnergyKwhPerM2Year = @{ value = 145.2; confidence = 0.87 }
        emissionsKgCo2PerM2Year = @{ value = 28.5; confidence = 0.92 }
        certificateNumber = @{ value = "CE-E-2024-001234"; confidence = 0.98 }
        scope = @{ value = "building"; confidence = 0.89 }
        issuerName = @{ value = "Técnico Certificador"; confidence = 0.85 }
        issueDate = @{ value = "2024-03-15"; confidence = 0.93 }
        expiryDate = @{ value = "2034-03-15"; confidence = 0.93 }
    }
} | ConvertTo-Json -Depth 4

Invoke-RestMethod -Uri "http://localhost:3000/api/certificados-energeticos/process-ai-data" -Method POST -Headers $headers -Body $aiData

# 3. Confirmar certificado
$finalData = @{
    rating = "D"
    primaryEnergyKwhPerM2Year = 145.2
    emissionsKgCo2PerM2Year = 28.5
    certificateNumber = "CE-E-2024-001234"
    scope = "building"
    issuerName = "Técnico Certificador Energético"
    issueDate = "2024-03-15"
    expiryDate = "2034-03-15"
}

$certificate = Invoke-RestMethod -Uri "http://localhost:3000/api/certificados-energeticos/sessions/$($session.data.id)/confirm" -Method POST -Headers $headers -Body ($finalData | ConvertTo-Json)

# 4. Verificar resultado
$certificate.data.sourceDocumentUrl  # URL del documento original
```
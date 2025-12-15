## Technical Audit API

Documentación completa del endpoint de auditoría técnica del backend.

### Autenticación

Todas las rutas son privadas. Incluye el JWT en el header:

```
Authorization: Bearer <token>
```

### Endpoint

- Método: **GET**
- Ruta: `/edificios/:id/audits/technical`
- Content-Type: `application/json`

### Descripción

El sistema genera automáticamente una auditoría técnica completa de un edificio analizando:
- Estado del libro digital y sus secciones técnicas
- Certificado energético vigente
- Score ESG calculado
- Tareas pendientes priorizadas
- Recomendaciones de mejoras energéticas

### Flujo Completo

```
1. Cliente hace request
   GET /edificios/{buildingId}/audits/technical
   Headers: Authorization: Bearer <token>

2. Middleware de autenticación
   - Verifica token JWT
   - Extrae userAuthId del token

3. Controlador (technicalAuditController.ts)
   - Valida que el usuario esté autenticado
   - Extrae buildingId de los parámetros
   - Llama al servicio

4. Servicio (technicalAuditService.ts)
   - Verifica que el edificio existe
   - Obtiene libro digital (secciones, estado, campos ambientales)
   - Obtiene certificado energético más reciente
   - Obtiene o calcula score ESG
   - Calcula porcentaje de completitud (0-100)
   - Genera lista de tareas pendientes priorizadas
   - Genera recomendaciones de mejoras energéticas
   - Calcula ahorro potencial total

5. Respuesta JSON
   {
     "data": {
       "completionPercentage": 65,
       "tasks": [...],
       "energyImprovements": [...],
       "potentialSavingsKwhPerM2": 68,
       "summary": {...}
     },
     "message": "Auditoría técnica obtenida exitosamente"
   }
```

### Parámetros

- `id` (path parameter): UUID del edificio

### Respuesta exitosa (200)

```json
{
  "data": {
    "completionPercentage": 65,
    "tasks": [
      {
        "id": "task-1",
        "category": "documentation",
        "title": "Crear libro digital del edificio",
        "description": "El edificio no tiene un libro digital asociado. Es necesario crear uno para cumplir con la normativa.",
        "priority": "high",
        "relatedData": "digital_book"
      },
      {
        "id": "task-2",
        "category": "maintenance",
        "title": "Completar plan de mantenimiento preventivo",
        "description": "La sección de mantenimiento y conservación del libro digital está incompleta.",
        "priority": "high",
        "relatedData": "maintenance_section"
      }
    ],
    "energyImprovements": [
      {
        "id": "improvement-1",
        "type": "insulation",
        "title": "Mejora del aislamiento térmico",
        "description": "Instalar o mejorar el aislamiento en fachadas, cubierta y suelos puede reducir significativamente el consumo energético.",
        "estimatedSavingsKwhPerM2": 60,
        "priority": "high"
      },
      {
        "id": "improvement-2",
        "type": "lighting",
        "title": "Sustitución a iluminación LED",
        "description": "Reemplazar iluminación tradicional por LED de bajo consumo reduce el consumo eléctrico.",
        "estimatedSavingsKwhPerM2": 8,
        "priority": "medium"
      }
    ],
    "potentialSavingsKwhPerM2": 68,
    "summary": {
      "totalTasks": 5,
      "highPriorityTasks": 2,
      "mediumPriorityTasks": 2,
      "lowPriorityTasks": 1,
      "recommendedImprovements": 3
    }
  },
  "message": "Auditoría técnica obtenida exitosamente"
}
```

### Estructura de la respuesta

#### `completionPercentage` (number)
Porcentaje de completitud técnica del edificio (0-100). Se calcula basándose en:

**Libro digital (50 puntos máx)**:
- 40 puntos: Secciones técnicas completas (mantenimiento, instalaciones, reformas, sostenibilidad)
- 10 puntos: Estado del libro (publicado/validado/borrador)

**Certificado energético (30 puntos máx)**:
- Disponibilidad y validez del certificado

**Score ESG (20 puntos máx)**:
- Completitud del cálculo ESG (completo o parcial según datos disponibles)

#### `tasks` (array)
Lista de tareas pendientes identificadas, cada una con:
- `id`: Identificador único de la tarea
- `category`: Categoría (`maintenance`, `safety`, `energy`, `documentation`, `compliance`)
- `title`: Título de la tarea
- `description`: Descripción detallada
- `priority`: Prioridad (`high`, `medium`, `low`)
- `relatedData`: Campo o sección relacionada que falta

#### `energyImprovements` (array)
Recomendaciones de mejoras energéticas, cada una con:
- `id`: Identificador único de la mejora
- `type`: Tipo de mejora (`insulation`, `heating`, `lighting`, `windows`, `renewable`, `hvac`)
- `title`: Título de la mejora
- `description`: Descripción detallada
- `estimatedSavingsKwhPerM2`: Ahorro estimado en kWh/m²·año
- `priority`: Prioridad (`high`, `medium`, `low`)

#### `potentialSavingsKwhPerM2` (number)
Ahorro potencial total en kWh/m²·año si se implementan todas las mejoras prioritarias (high y medium). Se aplica un factor de solapamiento del 0.85.

#### `summary` (object)
Resumen estadístico:
- `totalTasks`: Número total de tareas pendientes
- `highPriorityTasks`: Tareas de alta prioridad
- `mediumPriorityTasks`: Tareas de prioridad media
- `lowPriorityTasks`: Tareas de baja prioridad
- `recommendedImprovements`: Número de mejoras energéticas recomendadas

### Categorías de tareas

#### `maintenance`
Tareas relacionadas con mantenimiento preventivo y conservación del edificio.

#### `safety`
Tareas relacionadas con seguridad, accesibilidad y cumplimiento normativo de seguridad.

#### `energy`
Tareas relacionadas con eficiencia energética, certificados energéticos y consumo.

#### `documentation`
Tareas relacionadas con documentación técnica, historial de reformas y registro de obras.

#### `compliance`
Tareas relacionadas con cumplimiento normativo y datos faltantes para cálculos ESG.

### Tipos de mejoras energéticas

#### `insulation`
Mejora del aislamiento térmico (fachadas, cubierta, suelos). Recomendada especialmente para clases energéticas D-G.

#### `heating`
Optimización del sistema de calefacción. Recomendada cuando el consumo es >150 kWh/m²·año.

#### `lighting`
Sustitución a iluminación LED. Siempre recomendable.

#### `windows`
Sustitución de ventanas por doble/triple acristalamiento. Recomendada para clases energéticas D-G.

#### `renewable`
Instalación de energías renovables (paneles solares, etc.). Recomendada cuando el porcentaje de renovables es <30%.

#### `hvac`
Optimización de sistemas de climatización y ventilación. Recomendada cuando el consumo es >100 kWh/m²·año.

### Fuentes de datos

La auditoría técnica analiza datos de:

1. **`buildings`**: Información básica del edificio (metros cuadrados, año de construcción)
2. **`digital_books`**: Estado del libro digital, secciones completadas, campos ambientales
3. **`energy_certificates`**: Certificado energético más reciente (rating, consumo, emisiones, fecha de emisión)
4. **`esg_scores`**: Score ESG calculado o datos para calcularlo

### Lógica de generación de tareas

#### Tareas del libro digital
- Si no existe libro digital → Tarea alta prioridad: "Crear libro digital"
- Secciones incompletas:
  - Mantenimiento → Alta prioridad
  - Instalaciones → Prioridad media
  - Reformas → Prioridad baja
  - Sostenibilidad → Prioridad media
- Campos ambientales faltantes:
  - Accesibilidad → Prioridad media
  - Cumplimiento de seguridad → Alta prioridad

#### Tareas del certificado energético
- Si no existe certificado → Tarea alta prioridad: "Obtener certificado energético"
- Si el certificado tiene >10 años → Tarea prioridad media: "Renovar certificado energético"

#### Tareas de ESG
- Si faltan datos críticos para calcular ESG → Tareas prioridad media por cada dato faltante

### Lógica de mejoras energéticas

Las mejoras se generan según:

1. **Clase energética** (certificado):
   - D-G: Mejoras de aislamiento y ventanas (alta prioridad)
   - B-C: Mejoras menores
   - A-B: Solo mejoras de bajo impacto (iluminación, renovables)

2. **Consumo energético**:
   - >150 kWh/m²·año: Optimización de calefacción (alta prioridad)
   - >100 kWh/m²·año: Optimización HVAC (prioridad media)

3. **Porcentaje de renovables**:
   - <30%: Instalación de energías renovables (prioridad según porcentaje actual)

4. **Mejoras siempre recomendadas**:
   - Iluminación LED (prioridad media)

### Limitaciones y mejoras futuras

**IMPORTANTE: Reglas hardcodeadas para pruebas**

Las reglas de generación de mejoras energéticas y cálculo de completitud están actualmente **hardcodeadas con valores estimados** para permitir pruebas y desarrollo. Estas reglas **NO están basadas en normativas oficiales** ni estándares reconocidos.

#### Limitaciones actuales:

1. **Valores de ahorro estimados**: Los ahorros energéticos (8, 15, 20, 30 kWh/m²·año) son estimaciones arbitrarias, no basadas en:
   - Normativas oficiales (CTE, Directiva UE)
   - Estudios técnicos validados
   - Tablas de referencia oficiales

2. **Umbrales arbitrarios**: Los umbrales utilizados son valores inventados:
   - 30% para porcentaje de renovables
   - 100 y 150 kWh/m²·año para consumo energético
   - No consideran tipología, zona climática ni normativas vigentes

3. **No verifica estado actual**: El sistema no comprueba:
   - Si el edificio ya tiene LED instalado
   - Si ya tiene ventanas eficientes
   - El tipo de sistema de calefacción actual
   - Mejoras ya implementadas

4. **No considera normativas**: No se basan en:
   - CTE (Código Técnico de la Edificación)
   - Directiva Europea de Eficiencia Energética
   - Objetivos 2030/2050
   - Estándares internacionales (LEED, BREEAM, Passivhaus)

#### Mejoras necesarias:

1. **Implementar estándares reales**:
   - Basarse en CTE DB-HE (Documento Básico de Ahorro de Energía)
   - Considerar Directiva Europea de Eficiencia Energética
   - Incluir objetivos gubernamentales (2030, 2050)

2. **Umbrales según normativa**:
   - Consumos máximos según tipología y zona climática
   - Objetivos de renovables según normativa vigente
   - Clases energéticas mínimas requeridas

3. **Verificar estado actual**:
   - Consultar datos del libro digital sobre mejoras ya implementadas
   - Verificar sistemas instalados antes de recomendar

4. **Cálculo de ahorros reales**:
   - Usar tablas oficiales de ahorro energético
   - Considerar estudios técnicos validados
   - Calcular según características específicas del edificio

5. **Priorización basada en criterios objetivos**:
   - Obligatoriedad legal
   - Impacto en certificación
   - ROI estimado
   - Viabilidad técnica

**Nota**: Esta funcionalidad está en desarrollo y las reglas actuales son temporales para permitir pruebas. Se debe mejorar con estándares y normativas reales antes de uso en producción.

### Errores

#### 401 Unauthorized
```json
{
  "error": "Usuario no autenticado"
}
```

#### 404 Not Found
```json
{
  "error": "Edificio no encontrado"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Error interno del servidor",
  "message": "Descripción del error"
}
```

### Ejemplo de uso

#### cURL
```bash
curl -X GET \
  https://activodigital-be.fly.dev/edificios/123e4567-e89b-12d3-a456-426614174000/audits/technical \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

#### PowerShell
```powershell
$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = "Bearer $token"
}

$audit = Invoke-RestMethod `
  -Uri "https://activodigital-be.fly.dev/edificios/$buildingId/audits/technical" `
  -Method GET `
  -Headers $headers

Write-Host "Completitud: $($audit.data.completionPercentage)%"
Write-Host "Tareas pendientes: $($audit.data.summary.totalTasks)"
Write-Host "Mejoras recomendadas: $($audit.data.summary.recommendedImprovements)"
```

#### JavaScript/TypeScript
```typescript
const response = await fetch(
  `https://activodigital-be.fly.dev/edificios/${buildingId}/audits/technical`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

const audit = await response.json();
console.log('Completitud:', audit.data.completionPercentage);
console.log('Tareas:', audit.data.tasks);
console.log('Mejoras:', audit.data.energyImprovements);
```

### Notas importantes

1. **Permisos**: El usuario debe tener acceso al edificio (validado mediante RLS de Supabase).

2. **Datos dinámicos**: La auditoría se calcula en tiempo real basándose en los datos actuales del edificio.

3. **Cálculo ESG**: Si no existe un score ESG guardado, se calcula automáticamente antes de generar la auditoría.

4. **Factor de solapamiento**: El ahorro potencial total aplica un factor de 0.85 para considerar que algunas mejoras pueden tener efectos parcialmente solapados.

5. **Priorización**: Las tareas y mejoras se priorizan automáticamente según su impacto y urgencia.

6. **Reglas temporales**: Las reglas de recomendación están hardcodeadas para pruebas. Ver sección "Limitaciones y mejoras futuras" para más detalles.

### Arquitectura

#### Componentes

```
src/
├── types/
│   └── technicalAudit.ts          # Tipos TypeScript (TechnicalTask, EnergyImprovement, TechnicalAuditResult)
├── domain/
│   └── services/
│       └── technicalAuditService.ts  # Lógica de negocio y cálculo
├── web/
│   └── controllers/
│       └── technicalAuditController.ts # Controlador HTTP
└── routes/
    └── edificios.ts                # Ruta registrada: GET /:id/audits/technical
```

#### Dependencias

- `EsgService`: Para obtener o calcular el score ESG
- `Supabase`: Para consultar datos del edificio, libro digital y certificado energético

### Integración con otros módulos

La auditoría técnica se integra con:

- **Libro Digital**: Analiza secciones técnicas y campos ambientales
- **Certificado Energético**: Usa rating y consumo para generar mejoras
- **ESG**: Utiliza el score ESG para completitud y tareas de cumplimiento


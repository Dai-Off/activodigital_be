## ESG API

Documentación del cálculo ESG (Environmental, Social, Governance) del backend.

### Autenticación

Todas las rutas son privadas. Incluye el JWT en el header:

```
Authorization: Bearer <token>
```

### Endpoint

- Método: POST
- Ruta: `/esg/calculate`
- Content-Type: `application/json`

### Descripción

El sistema calcula automáticamente el score ESG de un edificio a partir de los datos almacenados en la base de datos. El cálculo es **100% dinámico** y obtiene la información de:

- `energy_certificates`: Certificado energético más reciente del edificio
- `digital_books`: Estado del libro digital y campos ambientales adicionales

### Body esperado

Se aceptan dos formatos equivalentes: payload plano o envuelto en `data`.

1) Plano:
```json
{
  "building_id": "uuid-del-edificio"
}
```

2) Envuelto en `data`:
```json
{
  "data": {
    "building_id": "uuid-del-edificio"
  }
}
```

### Fuentes de datos

El sistema obtiene los datos de las siguientes tablas:

#### De `energy_certificates` (certificado más reciente por `issue_date`)
- `rating` → `ceeClass` (A, B, C, D, E, F, G)
- `primary_energy_kwh_per_m2_year` → `energyConsumptionKwhPerM2Year`
- `emissions_kg_co2_per_m2_year` → `co2EmissionsKgPerM2Year`

#### De `digital_books.campos_ambientales` (JSONB)
- `renewableSharePercent`: Porcentaje de energía renovable (0-100)
- `waterFootprintM3PerM2Year`: Huella hídrica en m³/m²·año
- `accessibility`: Nivel de accesibilidad (`full`, `partial`, `none`)
- `indoorAirQualityCo2Ppm`: Calidad del aire interior en ppm de CO₂
- `safetyCompliance`: Cumplimiento de seguridad (`full`, `pending`, `none`)
- `regulatoryCompliancePercent`: Porcentaje de cumplimiento normativo (0-100)

#### De `digital_books.estado`
- Se mapea al campo `digitalBuildingLog`:
  - `publicado` → `full`
  - `validado` → `partial`
  - `en_borrador` → `none`

### Valores por defecto

Cuando los datos no están disponibles en la base de datos, el sistema aplica valores por defecto conservadores:

```typescript
{
  ceeClass: 'G',                          // Sin certificado → peor rating
  energyConsumptionKwhPerM2Year: 200,     // Consumo alto por defecto
  co2EmissionsKgPerM2Year: 50,            // Emisiones altas por defecto
  renewableSharePercent: 0,                // Sin energías renovables
  waterFootprintM3PerM2Year: 2.0,         // Consumo de agua medio-alto
  accessibility: 'none',                   // Sin accesibilidad
  indoorAirQualityCo2Ppm: 1500,           // Calidad del aire baja
  safetyCompliance: 'none',                // Sin certificación de seguridad
  digitalBuildingLog: 'none',              // Sin libro digital
  regulatoryCompliancePercent: 50          // Cumplimiento normativo básico
}
```

> **Nota**: Los valores por defecto están diseñados para penalizar la falta de datos y motivar la recopilación de información completa.

### Reglas de cálculo

- Ponderación final: `ESG = E*0.5 + S*0.3 + G*0.2` (0–100)

- Environmental (E) → 50 puntos (se normaliza desde 70):
  - Clase Energética (CEE):
    - A: 50, B: 40, C: 30, D: 20, E: 10, F–G: 0
  - Consumo energético (kWh/m²·año): `<50:10`, `50–100:8`, `101–150:6`, `151–200:4`, `>200:0`
  - Emisiones CO₂ (kg CO₂eq/m²·año): `<5:10`, `5–15:8`, `16–30:6`, `31–50:4`, `>50:0`
  - % Energía renovable: `>70%:10`, `40–70%:7`, `20–39%:5`, `<20%:0`
  - Huella hídrica (m³/m²·año): `<0.5:10`, `0.5–1.0:7`, `1.1–2.0:5`, `>2.0:0`
  - Normalización E: `round((subtotal_E/70)*50)`

- Social (S) → 30 puntos (escala directa 0–30):
  - Accesibilidad universal: `full:10`, `partial:5`, `none:0`
  - Calidad aire interior (ppm CO₂): `<600:10`, `600–1000:7`, `1001–1500:5`, `>1500:0`
  - Seguridad / normativa: `full:10`, `pending:5`, `none:0`

- Governance (G) → 20 puntos (escala directa 0–20):
  - Libro Digital del Edificio: `full:10`, `partial:5`, `none:0`
  - Cumplimiento normativo (%): `90–100:10`, `70–89:7`, `50–69:5`, `<50:0`

- Interpretación:
  - 90–100: Premium
  - 80–89: Gold
  - 60–79: Silver
  - 40–59: Bronze
  - 0–39: Crítico

### Validaciones del payload

- `building_id`: **Requerido**. UUID del edificio a calcular

El sistema validará automáticamente que:
- El usuario tenga acceso al edificio (RLS de Supabase)
- El `building_id` exista en la base de datos

### Ejemplo de request

```http
POST /esg/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "building_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Ejemplo de respuesta

```json
{
  "data": {
    "environmental": {
      "ceePoints": 30,
      "consumptionPoints": 6,
      "emissionsPoints": 6,
      "renewablePoints": 5,
      "waterPoints": 7,
      "subtotalRaw": 54,
      "normalized": 39
    },
    "social": {
      "accessibilityPoints": 5,
      "airQualityPoints": 7,
      "safetyPoints": 10,
      "subtotalRaw": 22,
      "normalized": 22
    },
    "governance": {
      "digitalLogPoints": 5,
      "compliancePoints": 7,
      "subtotalRaw": 12,
      "normalized": 12
    },
    "total": 73,
    "label": "Silver"
  }
}
```

### cURL (local)

```bash
curl -X POST http://localhost:3000/esg/calculate \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "building_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### Errores comunes

**400 Bad Request - Campo building_id requerido**
```json
{
  "error": "El campo building_id es requerido"
}
```

**401 Unauthorized - Token no encontrado**
```json
{
  "error": "Token no encontrado"
}
```

**401 Unauthorized - Usuario no autenticado**
```json
{
  "error": "Usuario no autenticado"
}
```

**403 Forbidden - El usuario no tiene acceso al edificio**
El sistema respeta las políticas RLS de Supabase. Si el edificio no pertenece al usuario autenticado, la consulta no devolverá resultados.

### Notas importantes

1. **Cálculo dinámico**: Los datos se obtienen siempre de la base de datos en tiempo real
2. **Valores por defecto**: Si faltan datos, se usan valores conservadores que penalizan el score
3. **Certificado más reciente**: Se selecciona automáticamente el certificado con `issue_date` más reciente
4. **Seguridad**: Row Level Security (RLS) garantiza que solo se calculen edificios del usuario autenticado
5. **Campos ambientales**: Para mejorar el score ESG, se deben completar los campos en `digital_books.campos_ambientales`

### Cómo mejorar el score ESG

Para obtener un mejor score ESG, asegúrate de:

1. ✅ Subir certificados energéticos con buena calificación (A, B, C)
2. ✅ Completar el libro digital y publicarlo (`estado = 'publicado'`)
3. ✅ Agregar datos ambientales en `campos_ambientales`:
   - `renewableSharePercent`: Porcentaje de energías renovables
   - `waterFootprintM3PerM2Year`: Huella hídrica
4. ✅ Agregar datos sociales:
   - `accessibility`: Nivel de accesibilidad
   - `indoorAirQualityCo2Ppm`: Calidad del aire interior
   - `safetyCompliance`: Certificaciones de seguridad
5. ✅ Agregar datos de gobernanza:
   - `regulatoryCompliancePercent`: Porcentaje de cumplimiento normativo



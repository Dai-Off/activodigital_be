# Financial Audit API - Documentación Técnica

## Overview

Endpoint para obtener una auditoría financiera completa de un edificio, incluyendo estado actual y proyección post-mejoras.

**Endpoint:** `GET /edificios/:id/audits/financial`  
**Autenticación:** Requerida (JWT Bearer token)  
**Content-Type:** `application/json`

## Request

### Path Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | string (UUID) | Sí | ID del edificio |

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Ejemplo

```bash
curl -X GET \
  https://activodigital-be.fly.dev/edificios/123e4567-e89b-12d3-a456-426614174000/audits/financial \
  -H "Authorization: Bearer <token>"
```

## Response

### Success (200)

```json
{
  "data": {
    "buildingId": "123e4567-e89b-12d3-a456-426614174000",
    "currentState": {
      "marketValue": 2500000,
      "roiPct": 4.8,
      "noi": 120000,
      "capRatePct": 4.8
    },
    "postImprovementScenario": {
      "totalInvestment": 450000,
      "investmentBreakdown": [
        {
          "category": "Rehabilitación estructural",
          "description": "Obras de rehabilitación general del edificio",
          "estimatedCost": 300000
        },
        {
          "category": "Mejora energética: insulation",
          "description": "Mejora del aislamiento térmico",
          "estimatedCost": 80000
        }
      ],
      "revaluationPct": 5.5,
      "futureValue": 2637500,
      "valueIncrease": 137500,
      "paybackMonths": 72,
      "netProfit": -312500,
      "projectRoiPct": 15.2,
      "annualEnergySavings": 18500,
      "noiIncrease": 18500,
      "newCapRatePct": 5.25
    },
    "dataCompleteness": {
      "hasFinancialSnapshot": true,
      "hasEnergyImprovements": true,
      "hasBuildingPrice": true,
      "completenessScore": 100
    },
    "recommendations": [
      "El proyecto de mejoras presenta un ROI positivo (>10%). Recomendable.",
      "Periodo de recuperación moderado: 6 años",
      "Ahorros energéticos estimados: 18k EUR/año mejoran la rentabilidad operativa"
    ],
    "calculatedAt": "2025-12-16T10:30:00.000Z"
  },
  "message": "Auditoría financiera obtenida exitosamente"
}
```

### Error Responses

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
  "message": "Descripción detallada del error"
}
```

## Response Schema

### `currentState`

Estado financiero actual del edificio.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `marketValue` | number | Valor actual del activo en EUR |
| `roiPct` | number \| null | ROI operativo actual (%) |
| `noi` | number \| null | Net Operating Income anual (EUR) |
| `capRatePct` | number \| null | Cap Rate actual (%) |

### `postImprovementScenario`

Proyección financiera tras implementar mejoras recomendadas.

#### Inversión

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `totalInvestment` | number | Inversión total requerida (EUR) |
| `investmentBreakdown` | array | Desglose de inversión por categoría |
| `investmentBreakdown[].category` | string | Categoría de la mejora |
| `investmentBreakdown[].description` | string | Descripción de la mejora |
| `investmentBreakdown[].estimatedCost` | number | Coste estimado (EUR) |

#### Revalorización

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `revaluationPct` | number | Porcentaje de revalorización estimado |
| `futureValue` | number | Valor futuro del activo (EUR) |
| `valueIncrease` | number | Incremento de valor (EUR) |

#### Retorno

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `paybackMonths` | number \| null | Periodo de recuperación (meses) |
| `netProfit` | number | Ganancia neta del proyecto (EUR) |
| `projectRoiPct` | number \| null | ROI del proyecto (%) |

#### Mejoras Operativas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `annualEnergySavings` | number | Ahorros energéticos anuales (EUR) |
| `noiIncrease` | number | Incremento del NOI (EUR) |
| `newCapRatePct` | number \| null | Nuevo Cap Rate tras mejoras (%) |

### `dataCompleteness`

Evaluación de la completitud de datos disponibles.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `hasFinancialSnapshot` | boolean | Existe snapshot financiero |
| `hasEnergyImprovements` | boolean | Existen mejoras energéticas identificadas |
| `hasBuildingPrice` | boolean | El edificio tiene valor de mercado |
| `completenessScore` | number | Score de completitud (0-100) |

### `recommendations`

Array de strings con recomendaciones financieras generadas automáticamente basadas en el análisis.

### `calculatedAt`

Timestamp ISO 8601 de cuándo se calculó la auditoría.

## Lógica de Cálculo

### Estado Actual

#### Market Value
```typescript
marketValue = buildings.price
```

#### ROI Operativo
```typescript
roiPct = (NOI / marketValue) * 100
```

#### NOI (Net Operating Income)
```typescript
NOI = (ingresos_brutos_anuales + otros_ingresos_anuales) - opex_total_anual
```

#### Cap Rate
```typescript
capRatePct = (NOI / marketValue) * 100
```

### Escenario Post-Mejoras

#### Inversión Total

**Rehabilitación base:**
```typescript
baseRehab = snapshot.capex_rehab_estimado_eur || building.rehabilitation_cost || 0
```

**Mejoras energéticas:**
```typescript
// Costes por tipo (EUR/m²)
const costPerM2 = {
  insulation: 80,
  windows: 250,
  heating: 100,
  lighting: 20,
  renewable: 150,
  hvac: 120
}

energyCost = Σ(costPerM2[improvement.type] * building.squareMeters)
totalInvestment = baseRehab + energyCost
```

#### Revalorización

```typescript
// Prioridad 1: Usar snapshot
revaluationPct = snapshot.uplift_precio_pct_estimado

// Prioridad 2: Estimar según mejoras
if (revaluationPct === 0 && improvements.length > 0) {
  highPriority = improvements.filter(i => i.priority === 'high').length
  mediumPriority = improvements.filter(i => i.priority === 'medium').length
  revaluationPct = min((highPriority * 0.5) + (mediumPriority * 0.3), 8)
}

futureValue = marketValue * (1 + revaluationPct/100)
valueIncrease = futureValue - marketValue
```

#### Ahorros Energéticos

```typescript
// Prioridad 1: Usar snapshot
annualEnergySavings = (snapshot.ahorro_energia_pct_estimado / 100) * snapshot.opex_energia_anual_eur

// Prioridad 2: Estimar desde mejoras técnicas
if (!annualEnergySavings && technicalAudit.potentialSavingsKwhPerM2 > 0) {
  pricePerKwh = 0.15 // EUR/kWh
  annualEnergySavings = technicalAudit.potentialSavingsKwhPerM2 * building.squareMeters * pricePerKwh
}
```

#### Payback

```typescript
// Considera ahorros + amortización del valor en 10 años
annualReturn = annualEnergySavings + (valueIncrease / 10)
paybackYears = totalInvestment / annualReturn
paybackMonths = paybackYears * 12
```

#### ROI del Proyecto

```typescript
netProfit = valueIncrease - totalInvestment
projectRoiPct = (netProfit / totalInvestment) * 100
```

#### Nuevo NOI y Cap Rate

```typescript
noiIncrease = annualEnergySavings
newNOI = currentNOI + noiIncrease
newCapRatePct = (newNOI / futureValue) * 100
```

### Completitud de Datos

```typescript
score = 0
if (building.price > 0) score += 40
if (hasFinancialSnapshot) score += 40
if (hasEnergyImprovements) score += 20
completenessScore = score // 0-100
```

### Recomendaciones

El sistema genera recomendaciones según:

**Datos faltantes:**
- Sin precio → "Registre el valor de mercado del edificio"
- Sin snapshot → "Cree un snapshot financiero"
- Sin mejoras → "Complete la auditoría técnica"

**ROI del proyecto:**
- `>20%` → "ROI excelente, altamente recomendable"
- `10-20%` → "ROI positivo, recomendable"
- `0-10%` → "ROI modesto, evaluar prioridades"
- `<0%` → "ROI negativo, considerar solo mejoras prioritarias"

**Payback:**
- `≤60 meses` → "Periodo de recuperación favorable: X años"
- `61-120 meses` → "Periodo de recuperación moderado: X años"
- `>120 meses` → "Periodo de recuperación largo: X años"

**Cap Rate:**
- Si `newCapRate - currentCapRate > 0.5pp` → "Las mejoras incrementarían el Cap Rate en Xpp"

## Fuentes de Datos

### Tablas de Base de Datos

| Tabla | Campos Utilizados | Propósito |
|-------|-------------------|-----------|
| `buildings` | `price`, `square_meters`, `rehabilitation_cost` | Valor actual, superficie, coste base |
| `financial_snapshots` | `ingresos_brutos_anuales_eur`, `otros_ingresos_anuales_eur`, `opex_total_anual_eur`, `opex_energia_anual_eur`, `capex_rehab_estimado_eur`, `ahorro_energia_pct_estimado`, `uplift_precio_pct_estimado` | Métricas financieras y estimaciones |
| `energy_certificates` | `primary_energy_kwh_per_m2_year` | Consumo energético base |

### Servicios Integrados

| Servicio | Método | Propósito |
|----------|--------|-----------|
| `FinancialMetricsService` | `getBuildingMetrics()` | ROI, NOI, Cap Rate actuales |
| `FinancialSnapshotService` | `getFinancialSnapshotsByBuilding()` | Snapshot más reciente |
| `TechnicalAuditService` | `getTechnicalAudit()` | Mejoras energéticas recomendadas |
| `BuildingService` | `getBuildingById()` | Datos del edificio |

## Arquitectura

### Estructura de Archivos

```
src/
├── types/
│   └── financialAudit.ts                    # Interfaces TypeScript
├── domain/
│   └── services/
│       └── financialAuditService.ts          # Lógica de negocio
├── web/
│   └── controllers/
│       └── financialAuditController.ts       # Controlador HTTP
└── routes/
    └── edificios.ts                          # Registro de ruta
```

### Flujo de Ejecución

```
1. Request HTTP
   ↓
2. authMiddleware (valida JWT)
   ↓
3. FinancialAuditController.getFinancialAudit()
   ↓
4. FinancialAuditService.getFinancialAudit()
   ├── BuildingService.getBuildingById()
   ├── FinancialSnapshotService.getFinancialSnapshotsByBuilding()
   ├── TechnicalAuditService.getTechnicalAudit()
   ├── FinancialMetricsService.getBuildingMetrics()
   ├── calculateCurrentState()
   ├── calculatePostImprovementScenario()
   ├── evaluateDataCompleteness()
   └── generateRecommendations()
   ↓
5. Response JSON
```

### Métodos Principales del Servicio

#### `getFinancialAudit(buildingId: string, userAuthId: string): Promise<FinancialAuditResult>`

Método principal que orquesta todo el proceso de auditoría.

**Pasos:**
1. Valida existencia del edificio
2. Obtiene snapshot financiero más reciente
3. Obtiene auditoría técnica
4. Obtiene métricas financieras actuales
5. Calcula estado actual
6. Calcula escenario post-mejoras
7. Evalúa completitud de datos
8. Genera recomendaciones

#### `calculateCurrentState(building, metrics): CurrentFinancialState`

Calcula el estado financiero actual del edificio.

#### `calculatePostImprovementScenario(building, snapshot, technicalAudit, currentState): PostImprovementScenario`

Calcula la proyección financiera tras implementar mejoras.

**Lógica:**
1. Calcula inversión total (rehab + mejoras energéticas)
2. Estima revalorización
3. Calcula ahorros energéticos
4. Calcula payback
5. Calcula ROI del proyecto
6. Calcula nuevo NOI y Cap Rate

#### `evaluateDataCompleteness(building, snapshot, technicalAudit): DataCompleteness`

Evalúa la calidad y completitud de los datos disponibles.

#### `generateRecommendations(currentState, scenario, dataCompleteness): string[]`

Genera recomendaciones automáticas basadas en el análisis.

## Costes de Referencia

Los costes por tipo de mejora están basados en valores de mercado español (EUR/m²):

| Tipo de Mejora | Coste/m² | Variable en Código |
|----------------|----------|-------------------|
| Aislamiento térmico | 80 EUR | `costPerM2ByType.insulation` |
| Ventanas eficientes | 250 EUR | `costPerM2ByType.windows` |
| Sistema calefacción | 100 EUR | `costPerM2ByType.heating` |
| Iluminación LED | 20 EUR | `costPerM2ByType.lighting` |
| Energías renovables | 150 EUR | `costPerM2ByType.renewable` |
| Sistema HVAC | 120 EUR | `costPerM2ByType.hvac` |

**Constantes adicionales:**
- Precio medio electricidad: `0.15 EUR/kWh`
- Revalorización máxima estimada: `8%`
- Amortización valor en payback: `10 años`

## Limitaciones y Consideraciones

### Limitaciones Actuales

1. **Costes genéricos:** Los costes por m² son valores de referencia que no consideran:
   - Ubicación geográfica específica
   - Estado actual del edificio
   - Complejidad de la obra
   - Precios de proveedores locales

2. **Revalorización estimada:** El uplift de precio es conservador y no considera:
   - Mercado inmobiliario local
   - Demanda del área
   - Comparables de mercado
   - Tipología del activo

3. **Precio energía fijo:** Se usa 0.15 EUR/kWh sin considerar:
   - Contrato energético actual
   - Tarifa específica
   - Evolución de precios

4. **Payback simplificado:** No considera:
   - Financiación (coste del capital)
   - Inflación
   - Escalada de costes
   - Subvenciones disponibles

### Mejoras Recomendadas

Para entorno de producción:

1. **Integración con APIs de valoración** para obtener precios de mercado actualizados
2. **Base de datos de costes** por región y tipología
3. **Análisis financiero avanzado**: NPV, IRR, sensibilidad
4. **Integración con subvenciones** (Next Generation EU, etc.)
5. **Múltiples escenarios** (optimista, realista, pesimista)

## Testing

### Casos de Prueba Recomendados

1. **Edificio completo (score 100)**
   - Con precio, snapshot y mejoras energéticas
   - Debe devolver análisis completo

2. **Edificio sin precio**
   - Debe devolver análisis limitado con recomendación

3. **Edificio sin snapshot**
   - Debe usar valores por defecto y advertir en completitud

4. **Edificio sin mejoras energéticas**
   - Debe calcular escenario sin inversión en mejoras

5. **Usuario sin permisos**
   - Debe devolver 401/404 según RLS

### Ejemplo de Test Unitario

```typescript
describe('FinancialAuditService', () => {
  it('should calculate correct ROI for complete building', async () => {
    const result = await service.getFinancialAudit(buildingId, userId);
    
    expect(result.currentState.marketValue).toBeGreaterThan(0);
    expect(result.currentState.roiPct).toBeDefined();
    expect(result.postImprovementScenario.totalInvestment).toBeGreaterThan(0);
    expect(result.dataCompleteness.completenessScore).toBe(100);
  });
});
```

## Integración Frontend

### Ejemplo TypeScript

```typescript
interface FinancialAuditResult {
  buildingId: string;
  currentState: {
    marketValue: number;
    roiPct: number | null;
    noi: number | null;
    capRatePct: number | null;
  };
  postImprovementScenario: {
    totalInvestment: number;
    investmentBreakdown: Array<{
      category: string;
      description: string;
      estimatedCost: number;
    }>;
    revaluationPct: number;
    futureValue: number;
    valueIncrease: number;
    paybackMonths: number | null;
    netProfit: number;
    projectRoiPct: number | null;
    annualEnergySavings: number;
    noiIncrease: number;
    newCapRatePct: number | null;
  };
  dataCompleteness: {
    hasFinancialSnapshot: boolean;
    hasEnergyImprovements: boolean;
    hasBuildingPrice: boolean;
    completenessScore: number;
  };
  recommendations: string[];
  calculatedAt: string;
}

async function fetchFinancialAudit(buildingId: string): Promise<FinancialAuditResult> {
  const response = await fetch(
    `/edificios/${buildingId}/audits/financial`,
    {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch financial audit');
  }
  
  const data = await response.json();
  return data.data;
}
```

## Seguridad

### Validaciones Implementadas

1. **Autenticación:** Token JWT requerido en todos los requests
2. **Autorización:** RLS de Supabase valida acceso al edificio
3. **Validación de UUID:** buildingId debe ser UUID válido
4. **Rate limiting:** Según configuración del servidor

### Permisos Requeridos

- Usuario debe tener acceso de lectura al edificio
- Validado automáticamente por RLS de Supabase en queries

## Explicación Técnica Interna

### Flujo de Ejecución Detallado

Cuando se recibe un request a `GET /edificios/:id/audits/financial`:

#### 1. Request y Autenticación
```
Request → authMiddleware → FinancialAuditController → FinancialAuditService
```

#### 2. Recolección de Datos (Paralelo)

El servicio obtiene datos de múltiples fuentes:

```typescript
// Datos del edificio
const building = await buildingService.getBuildingById()
// → price, squareMeters, rehabilitationCost

// Snapshot financiero más reciente
const snapshot = await financialSnapshotService.getFinancialSnapshotsByBuilding()
// → ingresos, OPEX, capex_rehab, ahorro_energia_pct, uplift_precio_pct

// Auditoría técnica (mejoras energéticas)
const technicalAudit = await technicalAuditService.getTechnicalAudit()
// → energyImprovements[], potentialSavingsKwhPerM2

// Métricas financieras actuales
const metrics = await financialMetricsService.getBuildingMetrics()
// → NOI, roiPct, capRatePct (ya calculados)
```

#### 3. Cálculo del Estado Actual

```typescript
currentState = {
  marketValue: building.price,
  roiPct: metrics.roiOperativoPct,  // Reutiliza cálculo existente
  noi: metrics.noi,
  capRatePct: metrics.capRatePct
}
```

#### 4. Cálculo del Escenario Post-Mejoras

**4.1 Inversión Total**
```typescript
// Rehabilitación base
baseRehab = snapshot?.capex_rehab_estimado_eur || building.rehabilitationCost || 0

// Mejoras energéticas (por cada mejora de auditoría técnica)
energyCost = Σ(costPerM2[improvement.type] * building.squareMeters)

totalInvestment = baseRehab + energyCost
```

**4.2 Revalorización**
```typescript
// Prioridad 1: Usar snapshot
revaluationPct = snapshot?.uplift_precio_pct_estimado

// Prioridad 2: Estimar según mejoras
if (revaluationPct === 0) {
  highCount = mejoras de prioridad 'high'
  mediumCount = mejoras de prioridad 'medium'
  revaluationPct = min((highCount * 0.5) + (mediumCount * 0.3), 8)
}

futureValue = marketValue * (1 + revaluationPct/100)
valueIncrease = futureValue - marketValue
```

**4.3 Ahorros Energéticos**
```typescript
// Prioridad 1: Snapshot
annualEnergySavings = (snapshot.ahorro_energia_pct / 100) * snapshot.opex_energia_anual

// Prioridad 2: Desde auditoría técnica
annualEnergySavings = potentialSavingsKwhPerM2 * squareMeters * 0.15 EUR/kWh
```

**4.4 Métricas de Retorno**
```typescript
// Payback (considera ahorros + amortización del valor en 10 años)
annualReturn = annualEnergySavings + (valueIncrease / 10)
paybackMonths = (totalInvestment / annualReturn) * 12

// Ganancia neta (NO incluye ahorros, son flujos operativos)
netProfit = valueIncrease - totalInvestment

// ROI del proyecto
projectRoiPct = (netProfit / totalInvestment) * 100

// Nuevo NOI (ahorros OPEX aumentan NOI)
newNOI = currentNOI + annualEnergySavings
newCapRatePct = (newNOI / futureValue) * 100
```

#### 5. Evaluación de Completitud

```typescript
score = 0
if (building.price > 0) score += 40          // Crítico
if (hasFinancialSnapshot) score += 40        // Crítico
if (hasEnergyImprovements) score += 20       // Importante
```

#### 6. Generación de Recomendaciones

Sistema de reglas automáticas:

```typescript
// Datos faltantes
if (!hasBuildingPrice) → "Registre el valor de mercado"
if (!hasSnapshot) → "Cree un snapshot financiero"

// ROI del proyecto
if (projectRoiPct > 20) → "ROI excelente, altamente recomendable"
if (projectRoiPct 10-20) → "ROI positivo, recomendable"
if (projectRoiPct 0-10) → "ROI modesto, evaluar prioridades"
if (projectRoiPct < 0) → "ROI negativo, considerar solo mejoras prioritarias"

// Payback
if (paybackMonths ≤ 60) → "Periodo favorable: X años"
if (paybackMonths 61-120) → "Periodo moderado: X años"
if (paybackMonths > 120) → "Periodo largo: X años"

// Cap Rate
if (newCapRate - currentCapRate > 0.5pp) → "Mejoras incrementan Cap Rate"
```

### Decisiones de Diseño Clave

1. **Reutilización sobre Duplicación**
   - No recalcula NOI, ROI, Cap Rate
   - Usa `FinancialMetricsService` existente
   - Integra con `TechnicalAuditService` para mejoras

2. **Prioridad de Datos**
   - Datos reales (snapshot) > Estimaciones
   - Fallback a cálculos conservadores

3. **Valores Hardcodeados (MVP)**
   - Costes por m²: constantes en código
   - Precio electricidad: 0.15 EUR/kWh
   - Revalorización máxima: 8%
   - Para producción: mover a BD

4. **Fórmulas Conservadoras**
   - Payback incluye amortización en 10 años
   - Ganancia neta NO incluye ahorros OPEX
   - Revalorización limitada al 8%

5. **Arquitectura Limpia**
   ```
   Controller (HTTP) 
     ↓
   Service (Lógica de Negocio)
     ↓
   Multiple Services (Datos)
     ↓
   Supabase (Persistencia)
   ```

### Puntos de Extensión Futuros

Para evolucionar la API:

1. **Costes dinámicos**: Reemplazar constantes por tabla `improvement_costs` en BD
2. **Múltiples escenarios**: Añadir parámetro `scenario` (optimista/realista/pesimista)
3. **Subvenciones**: Integrar API de subvenciones disponibles
4. **Análisis avanzado**: Añadir NPV, IRR con múltiples años de proyección
5. **Cache**: Implementar cache de auditorías (TTL 24h)

## Changelog

### v1.0.0 (2025-12-16)

- Release inicial
- Cálculo de estado financiero actual
- Proyección post-mejoras
- Sistema de recomendaciones automáticas
- Evaluación de completitud de datos
- Integración con servicios existentes

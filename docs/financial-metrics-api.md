# Financial Metrics API - ARKIA v1

Documentación de los endpoints financieros para calcular y simular métricas inmobiliarias a nivel edificio. Diseñado para ser usado por agentes de IA a través de orquestadores como n8n.

## Autenticación

Todas las rutas requieren autenticación JWT:

```
Authorization: Bearer <token>
```

## Base URL

```
{{base_url}}/edificios/{buildingId}/...
```

---

## Principios de Diseño

### Temporalidad Parametrizable

Todos los endpoints GET soportan el parámetro `period` que permite obtener métricas en formato anual o mensual:

- `period=annual` (default): Métricas anuales
- `period=monthly`: Métricas mensuales (valores anuales divididos por 12)

**Ejemplo:**
```
GET /edificios/{id}/metrics?period=annual
GET /edificios/{id}/metrics?period=monthly
```

### Moneda y Tasa de Descuento Parametrizables

- **Currency (`currency`)**: Parámetro opcional en endpoints GET. Valores: `EUR` (default) | `USD`
- **Discount Rate (`discountRate`)**: Parámetro opcional/requerido en endpoints POST para cálculos de NPV/IRR. Valor decimal entre 0 y 1 (ej: 0.08 = 8%)

**Ejemplo:**
```
GET /edificios/{id}/metrics?currency=EUR
POST /edificios/{id}/scenarios/npv
Body: { "discountRate": 0.08, ... }
```

### Escenarios Reproducibles con scenarioId

Todos los endpoints POST de escenarios soportan `scenarioId` para reproducir escenarios:

- **Si pasas `scenarioId`**: El endpoint usa ese ID y lo devuelve en la respuesta
- **Si NO pasas `scenarioId`**: Se genera automáticamente y se devuelve en la respuesta
- **Idempotencia**: Mismo `scenarioId` + mismos inputs = mismo output

**Ejemplo:**
```json
POST /edificios/{id}/scenarios/npv
Body: {
  "discountRate": 0.08,
  "cashflows": [123, 123, 123],
  "initialInvestment": 12333,
  "scenarioId": "test_001"  // ← Mismo scenarioId = mismo resultado
}
```

### Compatibilidad n8n

Los endpoints están diseñados para ser usados por orquestadores como n8n:

- **Entradas simples y predecibles**: Parámetros claros, sin lógica compleja
- **Respuestas auto-contenidas**: Todas las respuestas incluyen todos los datos necesarios
- **Idempotencia**: Mismo input → mismo output (cacheable)
- **JSON estándar**: Fácil de procesar en workflows

**Ejemplo de workflow n8n:**
```
1. HTTP Request: POST /edificios/{id}/scenarios/cashflow/run
2. HTTP Request: POST /edificios/{id}/scenarios/npv
   Body: { "cashflows": {{$json.cashflows}}, ... }
3. Function Node: Transforma respuesta a texto natural
```

---

## GET - Métricas Financieras

Estos endpoints calculan métricas usando los datos actuales guardados en la base de datos (snapshot financiero + building).

### GET /edificios/:id/metrics

Obtiene todas las métricas consolidadas del edificio.

**Query Parameters:**
- `period` (opcional): `annual` | `monthly` (default: `annual`)
- `currency` (opcional): `EUR` | `USD` (default: `EUR`)

**Ejemplo:**
```http
GET /edificios/36cf9cea-05a6-4438-9583-e218ca6dff48/metrics?period=annual&currency=EUR
```

**Response:**
```json
{
  "data": {
    "buildingId": "36cf9cea-05a6-4438-9583-e218ca6dff48",
    "period": "annual",
    "currency": "EUR",
    "noi": 120000,
    "capRatePct": 12.5,
    "roiOperativoPct": 12.5,
    "dscr": 2.5,
    "opexRatioPct": 40.0,
    "marketValue": 960000,
    "estimatedValue": 1200000,
    "valueGapPct": 25.0,
    "occupancyPct": null
  }
}
```

---

### GET /edificios/:id/roi

Obtiene el ROI operativo del edificio.

**Query Parameters:** `period`, `currency` (opcionales)

**Response:**
```json
{
  "data": {
    "buildingId": "36cf9cea-05a6-4438-9583-e218ca6dff48",
    "roiOperativoPct": 12.5,
    "noi": 120000,
    "marketValue": 960000,
    "period": "annual",
    "currency": "EUR"
  }
}
```

---

### GET /edificios/:id/cap-rate

Obtiene el Cap Rate del edificio.

**Query Parameters:** `period`, `currency` (opcionales)

**Response:**
```json
{
  "data": {
    "buildingId": "36cf9cea-05a6-4438-9583-e218ca6dff48",
    "capRatePct": 12.5,
    "noi": 120000,
    "marketValue": 960000,
    "period": "annual",
    "currency": "EUR"
  }
}
```

---

### GET /edificios/:id/noi

Obtiene el NOI (Net Operating Income) del edificio.

**Query Parameters:** `period`, `currency` (opcionales)

**Response:**
```json
{
  "data": {
    "buildingId": "36cf9cea-05a6-4438-9583-e218ca6dff48",
    "noi": 120000,
    "grossRevenue": 200000,
    "totalOpex": 80000,
    "period": "annual",
    "currency": "EUR"
  }
}
```

---

### GET /edificios/:id/dscr

Obtiene el DSCR (Debt Service Coverage Ratio) del edificio.

**Query Parameters:** `period`, `currency` (opcionales)

**Response:**
```json
{
  "data": {
    "buildingId": "36cf9cea-05a6-4438-9583-e218ca6dff48",
    "dscr": 2.5,
    "noi": 120000,
    "annualDebtService": 48000,
    "period": "annual",
    "currency": "EUR"
  }
}
```

---

### GET /edificios/:id/opex-ratio

Obtiene el ratio OPEX del edificio.

**Query Parameters:** `period`, `currency` (opcionales)

**Response:**
```json
{
  "data": {
    "buildingId": "36cf9cea-05a6-4438-9583-e218ca6dff48",
    "opexRatioPct": 40.0,
    "totalOpex": 80000,
    "grossRevenue": 200000,
    "period": "annual",
    "currency": "EUR"
  }
}
```

---

### GET /edificios/:id/value-gap

Obtiene el Value Gap del edificio (diferencia entre valor estimado y valor de mercado).

**Response:**
```json
{
  "data": {
    "buildingId": "36cf9cea-05a6-4438-9583-e218ca6dff48",
    "valueGapPct": 25.0,
    "marketValue": 960000,
    "estimatedValue": 1200000,
    "currency": "EUR"
  }
}
```

---

## POST - Escenarios y Simulaciones

Estos endpoints permiten simular escenarios "what-if" pasando parámetros personalizados. Los datos de la BD se usan como base, pero puedes sobrescribir valores para simular diferentes escenarios.

### POST /edificios/:id/scenarios/rehab/simulate

Simula una rehabilitación y calcula payback, ROI y valor estimado.

**¿Qué hace?**
Simula una rehabilitación del edificio y calcula si es rentable. Recibe el coste de rehabilitación y calcula:
- `estimatedValue`: Valor del edificio después de la rehabilitación
- `valueGapPct`: Diferencia porcentual entre valor estimado y valor de mercado
- `paybackMonths`: Meses necesarios para recuperar la inversión
- `simpleRoiPct`: ROI anual de la inversión

**¿Por qué es útil?**
- Responde: "¿Vale la pena rehabilitar con 50k?"
- Compara: "¿Mejor invertir 50k o 100k?"
- Justifica: "¿Cuánto tiempo tardo en recuperar mi inversión?"

**Cómo funciona:**
1. Lee datos del snapshot (ahorro energético estimado, uplift de precio)
2. Usa el `rehabCost` que pasas en el body
3. Calcula beneficios anuales (ahorro energético + subsidios)
4. Calcula payback: `rehabCost / annualBenefit * 12`
5. Calcula ROI: `(annualBenefit / rehabCost) * 100`

**Body:**
```json
{
  "rehabCost": 50000,
  "energySavingsPerYear": 5000,
  "subsidies": 10000,
  "monthsToExecute": 6,
  "method": "heuristic"
}
```

**Campos:**
- `rehabCost` (requerido): Coste de rehabilitación en EUR
- `energySavingsPerYear` (opcional): Ahorro energético anual. Si no se proporciona, se calcula del snapshot
- `subsidies` (opcional): Subsidios en EUR
- `monthsToExecute` (opcional): Meses para ejecutar la rehabilitación
- `method` (opcional): `heuristic` | `model` (default: `heuristic`)

**Response:**
```json
{
  "data": {
    "buildingId": "36cf9cea-05a6-4438-9583-e218ca6dff48",
    "estimatedValue": 2400000,
    "valueGapPct": 0,
    "paybackMonths": 40,
    "simpleRoiPct": 30,
    "notes": "Simulación usando método heuristic. Ahorro energético estimado: 5000.00 EUR/año. Uplift de precio estimado: 0.00%."
  }
}
```

**Ejemplo de uso con n8n:**
```
Usuario pregunta: "¿Vale la pena rehabilitar con 50k EUR?"

1. n8n recibe pregunta del agente de IA
2. n8n extrae buildingId y rehabCost de la pregunta
3. n8n llama: POST /edificios/{id}/scenarios/rehab/simulate
   Body: { "rehabCost": 50000 }
4. n8n recibe respuesta con paybackMonths y simpleRoiPct
5. IA transforma a texto natural:
   "Sí, vale la pena. ROI del 30% anual, recuperación en 40 meses."
```

---

### POST /edificios/:id/scenarios/cashflow/run

Genera flujos de caja proyectados para el edificio.

**¿Qué hace?**
Genera una proyección de flujos de caja futuros del edificio. Lee el snapshot financiero, calcula el NOI anual (Ingresos - OPEX) y proyecta ese flujo para los próximos X años.

**¿Por qué es útil?**
- Base para NPV e IRR: Necesitas flujos de caja para calcular rentabilidad
- Proyección: "¿Cuánto dinero generará este edificio en 5 años?"
- Planificación: Ver los flujos futuros antes de decidir

**Cómo funciona:**
1. Lee el snapshot financiero más reciente (ingresos y OPEX)
2. Calcula NOI anual = Ingresos brutos - OPEX total
3. Proyecta ese NOI para los próximos X años (default: 5 años)
4. Si `period = "monthly"`, divide los valores anuales por 12
5. Devuelve array de cashflows proyectados

**Relación con otros endpoints:**
Los flujos generados aquí se usan como input para `/scenarios/npv`, `/scenarios/irr` y `/scenarios/sensitivity`.

**Body:**
```json
{
  "period": "annual",
  "years": 5,
  "discountRate": 0.08,
  "scenarioId": "test_001"
}
```

**Campos:**
- `period` (opcional): `annual` | `monthly` (default: `annual`)
- `years` (opcional): Número de años a proyectar, 1-30 (default: 5)
- `discountRate` (opcional): Tasa de descuento, 0-1 (default: 0.08)
- `scenarioId` (opcional): ID del escenario para reproducibilidad

**Response:**
```json
{
  "data": {
    "buildingId": "36cf9cea-05a6-4438-9583-e218ca6dff48",
    "scenarioId": "test_001",
    "period": "annual",
    "discountRate": 0.08,
    "cashflows": [120000, 120000, 120000, 120000, 120000],
    "initialInvestment": 12333,
    "years": 5
  }
}
```

**Ejemplo de uso con n8n:**
```
Usuario pregunta: "¿Cuánto dinero generará este edificio en los próximos 5 años?"

1. n8n llama: POST /edificios/{id}/scenarios/cashflow/run
   Body: { "years": 5, "period": "annual" }
2. n8n recibe cashflows proyectados
3. IA transforma a respuesta:
   "Según los datos actuales, este edificio generará:
   - Año 1: 120,000 EUR
   - Año 2: 120,000 EUR
   - Año 3: 120,000 EUR
   - Año 4: 120,000 EUR
   - Año 5: 120,000 EUR
   Total: 600,000 EUR"
```

---

### POST /edificios/:id/scenarios/npv

Calcula el NPV (Net Present Value) de una inversión.

**¿Qué hace?**
Calcula el Valor Presente Neto de una inversión. Descuenta cada flujo futuro al presente usando una tasa de descuento y resta la inversión inicial. Si NPV > 0 → rentable, si NPV < 0 → no rentable.

**¿Por qué es útil?**
- Decisión: "¿Vale la pena invertir 300k?"
- Comparación: "¿Qué inversión es mejor?"
- Valor del dinero en el tiempo: Considera que 100 EUR hoy valen más que 100 EUR en 5 años

**Cómo funciona:**
1. Recibe flujos de caja futuros e inversión inicial
2. Descuenta cada flujo futuro al presente: `flujo[i] / (1 + discountRate)^(i+1)`
3. Suma todos los flujos descontados
4. Resta la inversión inicial
5. Si resultado > 0 → rentable

**Fórmula:**
```
NPV = -initialInvestment + Σ(cashflow[i] / (1 + discountRate)^(i+1))
```

**Body:**
```json
{
  "discountRate": 0.08,
  "cashflows": [120000, 124000, 128000, 132000, 136000],
  "initialInvestment": 300000,
  "scenarioId": "scenario_npv_001"
}
```

**Campos:**
- `discountRate` (requerido): Tasa de descuento, 0-1
- `cashflows` (requerido): Array de flujos de caja futuros
- `initialInvestment` (requerido): Inversión inicial en EUR
- `scenarioId` (opcional): ID del escenario

**Response:**
```json
{
  "data": {
    "buildingId": "36cf9cea-05a6-4438-9583-e218ca6dff48",
    "npv": 165432.45,
    "discountRate": 0.08,
    "scenarioId": "scenario_npv_001"
  }
}
```

**Ejemplo de uso con n8n:**
```
Usuario pregunta: "Si invierto 300k, ¿vale la pena según los flujos futuros?"

1. n8n llama: POST /edificios/{id}/scenarios/cashflow/run
   → Obtiene cashflows base
2. n8n llama: POST /edificios/{id}/scenarios/npv
   Body: {
     "cashflows": [120000, 124000, ...],
     "initialInvestment": 300000,
     "discountRate": 0.08
   }
3. n8n recibe: npv = 165432.45 (positivo)
4. IA responde:
   "Sí, vale la pena. NPV positivo (165,432 EUR) indica que la inversión es rentable."
```

---

### POST /edificios/:id/scenarios/irr

Calcula el IRR (Internal Rate of Return) de una inversión.

**¿Qué hace?**
Calcula la Tasa Interna de Retorno: la tasa de descuento que hace que el NPV sea igual a 0. Es la tasa de retorno efectiva que genera la inversión.

**¿Por qué es útil?**
- Retorno: "¿Qué tasa de retorno genera esta inversión?"
- Comparación: "¿Esta inversión es mejor que poner dinero en el banco?"
- Benchmark: Si el banco da 5% y el IRR es 32%, es mucho mejor

**Cómo funciona:**
1. Recibe flujos de caja e inversión inicial
2. Busca la tasa de descuento que hace NPV = 0 (usando método Newton-Raphson)
3. Esa tasa es el IRR
4. Si IRR > tasa de mercado → rentable
5. Si no converge, retorna `null`

**Diferencia con NPV:**
- NPV: Dice si es rentable (Sí/No) y cuánto valor genera
- IRR: Dice qué tasa de retorno genera (32%, 15%, etc.)

**Nota:** Si los cashflows son muy bajos comparados con la inversión, el IRR puede no converger (retorna `null`).

**Body:**
```json
{
  "cashflows": [120000, 124000, 128000, 132000, 136000],
  "initialInvestment": 300000,
  "scenarioId": "scenario_irr_001",
  "maxIterations": 100,
  "tolerance": 0.0001
}
```

**Campos:**
- `cashflows` (requerido): Array de flujos de caja futuros
- `initialInvestment` (requerido): Inversión inicial en EUR
- `scenarioId` (opcional): ID del escenario
- `maxIterations` (opcional): Máximo de iteraciones para calcular IRR (default: 100)
- `tolerance` (opcional): Tolerancia para convergencia (default: 0.0001)

**Response:**
```json
{
  "data": {
    "buildingId": "36cf9cea-05a6-4438-9583-e218ca6dff48",
    "irr": 0.325,
    "scenarioId": "scenario_irr_001",
    "iterations": 12
  }
}
```

**Nota:** Si el IRR no converge, `irr` será `null`.

**Ejemplo de uso con n8n:**
```
Usuario pregunta: "¿Qué tasa de retorno genera esta inversión?"

1. n8n llama: POST /edificios/{id}/scenarios/cashflow/run
   → Obtiene cashflows
2. n8n llama: POST /edificios/{id}/scenarios/irr
   Body: {
     "cashflows": [120000, 124000, ...],
     "initialInvestment": 300000
   }
3. n8n recibe: irr = 0.325 (32.5%)
4. IA responde:
   "La inversión genera una tasa de retorno del 32.5% anual."
```

---

### POST /edificios/:id/scenarios/sensitivity

Realiza análisis de sensibilidad del NPV variando la tasa de descuento.

**¿Qué hace?**
Prueba cómo cambia el NPV con diferentes tasas de descuento. Calcula el NPV para múltiples tasas (2%, 4%, 6%, 8%, 10%, 12%, 15%) y devuelve una tabla de sensibilidad.

**¿Por qué es útil?**
- Robustez: "¿Qué pasa si suben las tasas de interés?"
- Riesgo: "¿Sigue siendo rentable si cambian las condiciones?"
- Planificación: Saber cómo responde la inversión a cambios en el mercado

**Cómo funciona:**
1. Recibe flujos de caja base e inversión inicial
2. Calcula NPV para cada tasa de descuento en el rango
3. Devuelve tabla: cada tasa → NPV correspondiente
4. Incluye el NPV base (con la tasa base)

**Ejemplo de interpretación:**
- Si todos los NPVs son positivos → inversión robusta
- Si algunos NPVs son negativos → inversión sensible a cambios
- Si NPV baja mucho con tasas altas → inversión de alto riesgo

**Body:**
```json
{
  "baseDiscountRate": 0.08,
  "baseCashflows": [120000, 124000, 128000, 132000, 136000],
  "initialInvestment": 300000,
  "discountRateRange": [0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.15],
  "scenarioId": "scenario_sens_001"
}
```

**Campos:**
- `baseDiscountRate` (requerido): Tasa de descuento base, 0-1
- `baseCashflows` (requerido): Array de flujos de caja base
- `initialInvestment` (requerido): Inversión inicial en EUR
- `discountRateRange` (opcional): Array de tasas a probar (default: [0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.15])
- `scenarioId` (opcional): ID del escenario

**Response:**
```json
{
  "data": {
    "buildingId": "36cf9cea-05a6-4438-9583-e218ca6dff48",
    "scenarioId": "scenario_sens_001",
    "sensitivity": [
      { "discountRate": 0.02, "npv": 250000 },
      { "discountRate": 0.04, "npv": 210000 },
      { "discountRate": 0.06, "npv": 180000 },
      { "discountRate": 0.08, "npv": 165432 },
      { "discountRate": 0.10, "npv": 150000 },
      { "discountRate": 0.12, "npv": 135000 },
      { "discountRate": 0.15, "npv": 110000 }
    ],
    "baseNpv": 165432.45
  }
}
```

**Ejemplo de uso con n8n:**
```
Usuario pregunta: "¿Qué tan sensible es la inversión a cambios en las tasas de interés?"

1. n8n llama: POST /edificios/{id}/scenarios/cashflow/run
   → Obtiene cashflows base
2. n8n llama: POST /edificios/{id}/scenarios/sensitivity
   Body: {
     "baseDiscountRate": 0.08,
     "baseCashflows": [120000, 124000, ...],
     "initialInvestment": 300000
   }
3. n8n recibe tabla de sensibilidad
4. IA responde:
   "La inversión es moderadamente sensible a cambios en las tasas:
   - Con tasa 2%: NPV = 250,000 EUR
   - Con tasa 8%: NPV = 165,432 EUR
   - Con tasa 15%: NPV = 110,000 EUR
   Sigue siendo rentable incluso con tasas altas."
```

---

## Flujos Completos con n8n

### Flujo 1: Análisis completo de inversión

```
Usuario: "Si invierto 300k en este edificio, ¿vale la pena?"

Workflow en n8n:
1. HTTP Request: POST /scenarios/cashflow/run
   → Obtiene cashflows proyectados
   
2. HTTP Request: POST /scenarios/npv
   Body: {
     "cashflows": {{$json.cashflows}},
     "initialInvestment": 300000,
     "discountRate": 0.08
   }
   → Obtiene NPV
   
3. HTTP Request: POST /scenarios/irr
   Body: {
     "cashflows": {{$json.cashflows}},
     "initialInvestment": 300000
   }
   → Obtiene IRR
   
4. Function Node: Transforma a respuesta natural
   "Sí, vale la pena. NPV: 165k EUR, IRR: 32.5%"
```

---

### Flujo 2: Comparación de escenarios de rehabilitación

```
Usuario: "¿Mejor rehabilitar con 50k o 100k?"

Workflow en n8n:
1. HTTP Request: POST /scenarios/rehab/simulate
   Body: { "rehabCost": 50000 }
   → Escenario A
   
2. HTTP Request: POST /scenarios/rehab/simulate
   Body: { "rehabCost": 100000 }
   → Escenario B
   
3. Function Node: Compara ambos escenarios
   "Escenario 50k: ROI 30%, payback 40 meses
    Escenario 100k: ROI 20%, payback 60 meses
    Recomendación: Escenario 50k es mejor"
```

---

### Flujo 3: Pregunta simple sobre métricas actuales

```
Usuario: "¿Cuál es el ROI de este edificio?"

Workflow en n8n:
1. HTTP Request: GET /edificios/{id}/roi
   → Obtiene ROI actual
   
2. Function Node: Transforma a respuesta
   "El ROI operativo actual es del 12.5% anual."
```

---

## Relación entre Endpoints POST

### Flujo típico de uso:

```
1. POST /scenarios/cashflow/run
   → Genera flujos de caja base
   Output: cashflows = [120k, 124k, 128k, ...]

2. POST /scenarios/npv
   → Usa esos cashflows para calcular si es rentable
   Output: NPV = 165k (positivo = rentable)

3. POST /scenarios/irr
   → Usa esos mismos cashflows para calcular tasa de retorno
   Output: IRR = 32.5% (muy buena tasa)

4. POST /scenarios/sensitivity
   → Usa esos mismos cashflows para ver robustez
   Output: Tabla de sensibilidad
```

### Tabla de resumen por caso de uso:

| Pregunta del Usuario | Endpoint a Usar |
|---------------------|-----------------|
| "¿Vale la pena rehabilitar con 50k?" | `/scenarios/rehab/simulate` |
| "¿Cuánto dinero generará este edificio?" | `/scenarios/cashflow/run` |
| "¿Vale la pena invertir 300k?" | `/scenarios/npv` |
| "¿Qué tasa de retorno genera?" | `/scenarios/irr` |
| "¿Qué pasa si suben las tasas?" | `/scenarios/sensitivity` |

### ¿Por qué son útiles juntos?

1. **`/cashflow/run`**: Genera los datos base (flujos de caja)
2. **`/scenarios/npv`**: Evalúa si es rentable (Sí/No + cuánto valor)
3. **`/scenarios/irr`**: Indica qué tasa de retorno genera
4. **`/scenarios/sensitivity`**: Valida la robustez ante cambios
5. **`/scenarios/rehab/simulate`**: Analiza rehabilitación específica

Estos endpoints permiten analizar inversiones de forma completa antes de tomar decisiones.

---

## Notas de Implementación

### Cálculos

- **Cap Rate / ROI Operativo:** `roiOperativoPct = (NOI / marketValue) * 100`
- **Value Gap:** `valueGapPct = (estimatedValue - marketValue) / marketValue * 100`
- **NOI:** `NOI = ingresos_brutos - opex_total`
- **OPEX Ratio:** `opexRatioPct = (opex_total / ingresos_brutos) * 100`
- **NPV:** `NPV = -initialInvestment + Σ(cashflow[i] / (1 + discountRate)^(i+1))`
- **IRR:** Calculado usando método Newton-Raphson

### Idempotencia

Todos los endpoints son idempotentes: mismo input → mismo output (cacheable). Esto es importante para n8n y agentes de IA.

### Temporalidad

Los endpoints GET soportan `period = annual | monthly`. Los valores anuales se dividen por 12 para convertirlos a mensuales.

### Escenarios Reproducibles

Usa `scenarioId` en los POST para reproducir escenarios. Si no se proporciona, se genera automáticamente.

---

## Errores Comunes

### Error: "No hay snapshot financiero disponible"
**Solución:** El edificio necesita tener un `financial_snapshot`. Crea uno primero con `POST /financial-snapshots`.

### Error: "Edificio no encontrado"
**Solución:** Verifica que el `buildingId` sea correcto y que el usuario tenga acceso al edificio.

### Error: "rehabCost es requerido"
**Solución:** El campo `rehabCost` es obligatorio en `/scenarios/rehab/simulate`.

### Error: "discountRate debe estar entre 0 y 1"
**Solución:** La tasa de descuento debe ser un decimal (ej: 0.08 = 8%, no 8).

---

## Referencias

- [ARKIA - Catálogo de Endpoints Financieros v1](./arkia-financial-endpoints.md)
- [Dashboard API](./dashboard-api.md)
- [Financial Snapshots API](../README.md#financial-snapshots)


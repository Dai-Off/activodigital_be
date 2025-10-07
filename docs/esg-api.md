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

### Body esperado

Se aceptan dos formatos equivalentes: payload plano o envuelto en `data`.

1) Plano:
```json
{
  "ceeClass": "A|B|C|D|E|F|G",
  "energyConsumptionKwhPerM2Year": 0,
  "co2EmissionsKgPerM2Year": 0,
  "renewableSharePercent": 0,
  "waterFootprintM3PerM2Year": 0,
  "accessibility": "full|partial|none",
  "indoorAirQualityCo2Ppm": 0,
  "safetyCompliance": "full|pending|none",
  "digitalBuildingLog": "full|partial|none",
  "regulatoryCompliancePercent": 0
}
```

2) Envuelto en `data`:
```json
{
  "data": {
    "ceeClass": "A|B|C|D|E|F|G",
    "energyConsumptionKwhPerM2Year": 0,
    "co2EmissionsKgPerM2Year": 0,
    "renewableSharePercent": 0,
    "waterFootprintM3PerM2Year": 0,
    "accessibility": "full|partial|none",
    "indoorAirQualityCo2Ppm": 0,
    "safetyCompliance": "full|pending|none",
    "digitalBuildingLog": "full|partial|none",
    "regulatoryCompliancePercent": 0
  }
}
```

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

- `ceeClass`: enum `A|B|C|D|E|F|G`
- `energyConsumptionKwhPerM2Year`: número `>= 0`
- `co2EmissionsKgPerM2Year`: número `>= 0`
- `renewableSharePercent`: número `0–100`
- `waterFootprintM3PerM2Year`: número `>= 0`
- `accessibility`: enum `full|partial|none`
- `indoorAirQualityCo2Ppm`: número `>= 0`
- `safetyCompliance`: enum `full|pending|none`
- `digitalBuildingLog`: enum `full|partial|none`
- `regulatoryCompliancePercent`: número `0–100`

### Ejemplo de request

```http
POST /esg/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "ceeClass": "C",
  "energyConsumptionKwhPerM2Year": 140,
  "co2EmissionsKgPerM2Year": 22,
  "renewableSharePercent": 25,
  "waterFootprintM3PerM2Year": 0.8,
  "accessibility": "partial",
  "indoorAirQualityCo2Ppm": 900,
  "safetyCompliance": "full",
  "digitalBuildingLog": "partial",
  "regulatoryCompliancePercent": 75
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
    "ceeClass":"C",
    "energyConsumptionKwhPerM2Year":140,
    "co2EmissionsKgPerM2Year":22,
    "renewableSharePercent":25,
    "waterFootprintM3PerM2Year":0.8,
    "accessibility":"partial",
    "indoorAirQualityCo2Ppm":900,
    "safetyCompliance":"full",
    "digitalBuildingLog":"partial",
    "regulatoryCompliancePercent":75
  }'
```



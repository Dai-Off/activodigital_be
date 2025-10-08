# Dashboard API - Métricas y Estadísticas

Documentación del endpoint de métricas del dashboard.

## Autenticación

Todas las rutas requieren autenticación JWT:

```
Authorization: Bearer <token>
```

## Endpoint

### Obtener Estadísticas del Dashboard

```http
GET /dashboard/stats
```

**Descripción:** Obtiene todas las métricas y estadísticas del dashboard para el usuario autenticado. Las métricas varían según el rol del usuario (propietario vs técnico).

**Autenticación:** Requerida

**Respuesta exitosa (200):**

```json
{
  "data": {
    // Métricas financieras
    "totalValue": 15000000,
    "totalAssets": 45,
    "totalRehabilitationCost": 2500000,
    "totalPotentialValue": 18000000,
    
    // Métricas ambientales y energéticas
    "totalSurfaceArea": 12500,
    "totalEmissions": 1500,
    "averageEnergyClass": "B",
    "averageEnergyRating": 6,
    
    // Métricas de completitud
    "completedBooks": 30,
    "pendingBooks": 15,
    "draftBooks": 8,
    "completionPercentage": 67,
    
    // Financiación verde (solo propietarios)
    "greenFinancingEligiblePercentage": 65,
    "greenFinancingEligibleCount": 29,
    
    // Promedios
    "averageUnitsPerBuilding": 8,
    "averageBuildingAge": 35,
    "averageFloorsPerBuilding": 5,
    
    // Tipología
    "mostCommonTypology": "residential",
    "typologyDistribution": {
      "residential": 30,
      "mixed": 10,
      "commercial": 5
    },
    
    // ESG (placeholder)
    "averageESGScore": null
  },
  "message": "Estadísticas obtenidas exitosamente"
}
```

## Diferencias por Rol

### Propietario (Owner)

**Métricas disponibles:**
- ✅ Todas las métricas financieras (valor total, costes, etc.)
- ✅ Métricas ambientales completas
- ✅ Clase energética promedio
- ✅ Porcentaje de financiación verde
- ✅ Todas las métricas de completitud
- ✅ Todos los promedios y distribuciones

**Cálculos específicos:**
- Se incluyen **todos los edificios** donde el usuario es propietario
- Se calculan emisiones basadas en certificados energéticos reales
- Se determina elegibilidad para financiación verde (clases A, B, C)

### Técnico (Technician)

**Métricas disponibles:**
- ❌ Métricas financieras (todas en 0)
- ✅ Total de edificios asignados
- ✅ Superficie total
- ✅ Métricas de completitud de libros
- ✅ Promedios de unidades, edad, pisos
- ✅ Distribución de tipologías

**Cálculos específicos:**
- Se incluyen **solo edificios asignados** al técnico
- No se muestran valores financieros
- Enfoque en progreso de libros digitales

## Detalles de Cálculo

### Superficie Total
```
totalSurfaceArea = SUM(num_units * 65 m²)
```
*Estimación: 65 m² por unidad*

### Emisiones Totales

**Con certificados energéticos:**
```
totalEmissions = SUM(emissions_kg_co2_per_m2_year * surfaceArea) / 1000
```

**Sin certificados (estimación):**
```
totalEmissions = totalSurfaceArea * 0.12 tCO₂ eq/m²
```

### Clase Energética Promedio

Mapeo de letras a números:
- A = 7
- B = 6
- C = 5
- D = 4
- E = 3
- F = 2
- G = 1
- ND = 0

```
averageEnergyRating = ROUND(AVG(rating_number))
averageEnergyClass = MAP(averageEnergyRating)
```

### Financiación Verde

**Criterio:** Edificios con clase energética A, B o C

```
greenFinancingEligibleCount = COUNT(buildings WHERE energy_class IN ('A', 'B', 'C'))
greenFinancingEligiblePercentage = (greenFinancingEligibleCount / totalAssets) * 100
```

### Completitud de Libros

```
completionPercentage = (completedBooks / totalAssets) * 100
```

### Tipología Más Común

```
mostCommonTypology = MODE(typology)
```

## Ejemplos de Uso

### cURL (Local)

```bash
curl -X GET http://localhost:3000/dashboard/stats \
  -H "Authorization: Bearer <TOKEN>"
```

### cURL (Producción)

```bash
curl -X GET https://activodigital-be.fly.dev/dashboard/stats \
  -H "Authorization: Bearer <TOKEN>"
```

### PowerShell

```powershell
# Login primero
$resp = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"user@example.com","password":"123456"}'

$token = $resp.data.session.access_token
$headers = @{ 'Authorization' = "Bearer $token" }

# Obtener estadísticas
$stats = Invoke-RestMethod -Uri 'http://localhost:3000/dashboard/stats' `
  -Method GET -Headers $headers

# Mostrar métricas
Write-Host "Total de activos: $($stats.data.totalAssets)"
Write-Host "Valor total: $($stats.data.totalValue)"
Write-Host "Clase energética promedio: $($stats.data.averageEnergyClass)"
Write-Host "% Completitud: $($stats.data.completionPercentage)%"
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/dashboard/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();

console.log('Estadísticas del Dashboard:', data);
```

## Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| 200 | Estadísticas obtenidas exitosamente |
| 401 | No autorizado (token inválido o ausente) |
| 500 | Error interno del servidor |

## Respuestas de Error

### 401 - No Autorizado

```json
{
  "error": "No autorizado",
  "message": "Token de autenticación inválido"
}
```

### 500 - Error Interno

```json
{
  "error": "Error al obtener estadísticas",
  "message": "Descripción detallada del error"
}
```

## Notas Técnicas

1. **Performance:** Las consultas están optimizadas con índices en las tablas principales
2. **Caché:** Considera implementar caché para reducir carga en la base de datos
3. **Tiempo de respuesta:** ~100-300ms dependiendo del volumen de datos
4. **Límites:** No hay límite de edificios, el cálculo es dinámico

## Campos Futuros

Los siguientes campos están preparados pero devuelven `null` por ahora:

- `averageESGScore`: Requerirá cálculo ESG por edificio y promedio

## Changelog

### v1.0.0 - Enero 2025
- ✅ Endpoint inicial de métricas del dashboard
- ✅ Soporte para propietarios y técnicos
- ✅ Cálculo de métricas financieras
- ✅ Cálculo de métricas ambientales
- ✅ Integración con certificados energéticos
- ✅ Cálculo de financiación verde
- ✅ Estadísticas de tipología y promedios

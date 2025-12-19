# Service Expenses API - ARKIA v1

Documentación de los endpoints para consultar gastos de servicios agrupados por mes por edificio. Los gastos de servicios se calculan **automáticamente** desde las facturas de servicios (ver [Service Invoices API](./service-invoices-api.md)). Esta API es **solo de lectura** - no se pueden crear, actualizar o eliminar gastos directamente.

**Tabla en base de datos:** `service_expenses` (constraint: `UNIQUE(building_id, year, month)`)

## Autenticación

Todas las rutas requieren autenticación JWT:

```
Authorization: Bearer <token>
```

## Base URL

```
{{base_url}}/service-expenses/...
```

**Nota:** La tabla en la base de datos se llama `service_expenses`.

---

## Cálculo Automático

Los gastos de servicios se calculan automáticamente desde las facturas de servicios cuando:
- Se crea una nueva factura de servicio
- Se actualiza una factura de servicio (importe, fecha, tipo, etc.)
- Se elimina una factura de servicio

Para gestionar las facturas de servicios, usa la [Service Invoices API](./service-invoices-api.md).

---

## Endpoints

Todos los endpoints son **solo de lectura** (GET). Los gastos de servicios se calculan automáticamente desde las facturas y se agrupan por mes/año.

### 1. Obtener gastos de servicios de un edificio (agrupados por mes)

Obtiene todos los gastos de servicios de un edificio agrupados por mes, opcionalmente filtrados por año y/o mes. Los gastos se calculan automáticamente desde las facturas de servicios.

**GET** `/service-expenses/building/:buildingId?year=2024&month=12`

**Parámetros de URL:**
- `buildingId`: UUID del edificio (requerido)

**Query parameters:**
- `year`: Año opcional para filtrar (ej: `?year=2024`)
- `month`: Mes opcional para filtrar (1-12). Requiere que se especifique `year` también (ej: `?year=2024&month=12`)

**Comportamiento:**
- Sin parámetros: Devuelve todos los meses de todos los años
- Solo `year`: Devuelve todos los meses de ese año (12 registros máximo)
- `year` + `month`: Devuelve solo el mes específico (1 registro)

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": "uuid-del-coste-1",
      "building_id": "uuid-del-edificio",
      "year": 2024,
      "month": 12,
      "electricity_eur": 480.00,
      "water_eur": 685.00,
      "gas_eur": 40.00,
      "ibi_eur": 40.00,
      "waste_eur": 40.00,
      "total_monthly_eur": 1285.00,
      "electricity_units": 6410,
      "water_units": 685,
      "gas_units": 40,
      "ibi_units": 40,
      "waste_units": 40,
      "notes": null,
      "created_at": "2024-12-17T10:00:00Z",
      "updated_at": "2024-12-17T10:00:00Z",
      "created_by": "uuid-del-usuario"
    },
    {
      "id": "uuid-del-coste-2",
      "building_id": "uuid-del-edificio",
      "year": 2024,
      "month": 11,
      "electricity_eur": 450.00,
      "water_eur": 650.00,
      "gas_eur": 45.00,
      "ibi_eur": 40.00,
      "waste_eur": 40.00,
      "total_monthly_eur": 1225.00,
      "electricity_units": 6200,
      "water_units": 650,
      "gas_units": 45,
      "ibi_units": 40,
      "waste_units": 40,
      "notes": null,
      "created_at": "2024-11-17T10:00:00Z",
      "updated_at": "2024-11-17T10:00:00Z",
      "created_by": "uuid-del-usuario"
    }
  ]
}
```

Los resultados están ordenados por año y mes descendente (más recientes primero).

**Errores:**
- `400`: buildingId es requerido
- `401`: Usuario no autenticado
- `500`: Error interno del servidor

---

### 2. Obtener resumen anual de gastos de servicios

Obtiene un resumen agregado de los gastos de servicios de un edificio para un año específico.

**GET** `/service-expenses/building/:buildingId/summary?year=2024`

**Parámetros de URL:**
- `buildingId`: UUID del edificio (requerido)

**Query parameters:**
- `year`: Año (por defecto: año actual)

**Respuesta exitosa (200):**
```json
{
  "data": {
    "building_id": "uuid-del-edificio",
    "year": 2024,
    "total_annual_eur": 15420.00,
    "average_monthly_eur": 1285.00,
    "months_count": 12,
    "breakdown": {
      "electricity_annual": 5760.00,
      "water_annual": 8220.00,
      "gas_annual": 480.00,
      "ibi_annual": 480.00,
      "waste_annual": 480.00
    }
  }
}
```

**Errores:**
- `400`: buildingId es requerido
- `401`: Usuario no autenticado
- `500`: Error interno del servidor

---

### 3. Obtener un gasto de servicios mensual específico

Obtiene un registro de gasto de servicios agrupado por mes por su ID.

**GET** `/service-expenses/:id`

**Parámetros de URL:**
- `id`: UUID del coste mensual (requerido)

**Respuesta exitosa (200):**
```json
{
  "data": {
    "id": "uuid-del-coste",
    "building_id": "uuid-del-edificio",
    "year": 2024,
    "month": 12,
    "electricity_eur": 480.00,
    "water_eur": 685.00,
    "gas_eur": 40.00,
    "ibi_eur": 40.00,
    "waste_eur": 40.00,
    "total_monthly_eur": 1285.00,
    "electricity_units": 6410,
    "water_units": 685,
    "gas_units": 40,
    "ibi_units": 40,
    "waste_units": 40,
    "notes": "Notas adicionales",
    "created_at": "2024-12-17T10:00:00Z",
    "updated_at": "2024-12-17T10:00:00Z",
    "created_by": "uuid-del-usuario"
  }
}
```

**Errores:**
- `404`: Monthly cost no encontrado
- `401`: Usuario no autenticado
- `500`: Error interno del servidor

---

## Permisos y Seguridad

- Todos los usuarios con acceso al edificio pueden ver los gastos de servicios.
- Los gastos de servicios se calculan automáticamente, no se pueden modificar directamente.
- Para cambiar los gastos, gestiona las facturas de servicios usando la [Service Invoices API](./service-invoices-api.md).
- La seguridad se aplica mediante Row Level Security (RLS) en la base de datos.

---

## Ejemplos de Uso

### Ejemplo 1: Obtener resumen anual

```bash
curl -X GET "{{base_url}}/service-expenses/building/uuid-edificio/summary?year=2024" \
  -H "Authorization: Bearer <token>"
```

### Ejemplo 2: Obtener gastos de servicios de un año específico

```bash
curl -X GET "{{base_url}}/service-expenses/building/uuid-edificio?year=2024" \
  -H "Authorization: Bearer <token>"
```

### Ejemplo 3: Obtener un gasto mensual específico

```bash
curl -X GET {{base_url}}/service-expenses/uuid-coste \
  -H "Authorization: Bearer <token>"
```

---

## Cómo Modificar Gastos de Servicios

Para modificar los gastos de servicios, debes gestionar las facturas de servicios:

1. **Agregar gastos**: Crea una nueva factura de servicio usando la [Service Invoices API](./service-invoices-api.md)
2. **Modificar gastos**: Actualiza la factura de servicio correspondiente
3. **Eliminar gastos**: Elimina la factura de servicio correspondiente

Los gastos de servicios se recalcularán automáticamente y se reagruparán por mes.

---

## Notas Técnicas

1. **Campo calculado**: `total_monthly_eur` se calcula automáticamente como la suma de los cinco gastos (electricidad, agua, gas, IBI, basuras).

2. **Tabla en base de datos**: Los datos se almacenan en la tabla `service_expenses` con constraint `UNIQUE(building_id, year, month)`.

3. **Cálculo automático**: Los gastos de servicios se calculan automáticamente mediante triggers de PostgreSQL (`recalculate_service_expenses_for_period`) cuando se insertan, actualizan o eliminan facturas de servicios en la tabla `service_invoices`.

4. **Unicidad**: Solo puede existir un registro por combinación de `building_id`, `year` y `month`. Si se agregan más facturas del mismo mes/año, el mismo registro se actualiza (UPSERT).

5. **Determinación del mes**: El mes del gasto se determina a partir de la fecha de las facturas (`invoice_date`). Todas las facturas con fecha en el mismo mes se agrupan automáticamente.

6. **Múltiples facturas**: Si hay múltiples facturas del mismo tipo de servicio en el mismo mes, se suman automáticamente en el gasto mensual.

7. **Ordenamiento**: Los resultados de listado están ordenados por año y mes descendente (más recientes primero).

8. **Solo lectura**: Esta API es solo de lectura. Para modificar gastos, usa la [Service Invoices API](./service-invoices-api.md).



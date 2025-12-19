# Service Invoices API - ARKIA v1

Documentación de los endpoints para gestión de facturas de servicios del edificio. Las facturas de servicios (electricidad, agua, gas, IBI, basuras) se utilizan para calcular automáticamente los costes mensuales.

## Autenticación

Todas las rutas requieren autenticación JWT:

```
Authorization: Bearer <token>
```

## Base URL

```
{{base_url}}/service-invoices/...
```

---

## Endpoints

### 1. Crear factura de servicio

Crea una nueva factura de servicio para un edificio. Los costes mensuales se recalcularán automáticamente.

**POST** `/service-invoices`

**Body:**
```json
{
  "building_id": "uuid-del-edificio",
  "service_type": "electricity",
  "invoice_number": "FAC-2024-001",
  "invoice_date": "2024-12-15",
  "amount_eur": 480.00,
  "units": 6410,
  "period_start": "2024-11-01",
  "period_end": "2024-12-15",
  "document_url": "https://example.com/invoice.pdf",
  "document_filename": "factura_electricidad_diciembre.pdf",
  "provider": "Endesa",
  "notes": "Factura bimestral"
}
```

**Campos requeridos:**
- `building_id`: UUID del edificio
- `service_type`: Tipo de servicio - `electricity` | `water` | `gas` | `ibi` | `waste`
- `invoice_date`: Fecha de emisión de la factura (YYYY-MM-DD) - se usa para determinar el mes del coste
- `amount_eur`: Importe de la factura en EUR (>= 0)

**Campos opcionales:**
- `invoice_number`: Número de factura del proveedor
- `units`: Unidades consumidas (kWh para electricidad, m³ para agua/gas, etc.)
- `period_start`: Fecha de inicio del periodo que cubre la factura (YYYY-MM-DD)
- `period_end`: Fecha de fin del periodo que cubre la factura (YYYY-MM-DD)
- `document_url`: URL del documento de la factura (PDF, imagen, etc.)
- `document_filename`: Nombre del archivo del documento
- `provider`: Nombre del proveedor del servicio
- `notes`: Notas adicionales

**Respuesta exitosa (201):**
```json
{
  "data": {
    "id": "uuid-de-la-factura",
    "building_id": "uuid-del-edificio",
    "service_type": "electricity",
    "invoice_number": "FAC-2024-001",
    "invoice_date": "2024-12-15",
    "amount_eur": 480.00,
    "units": 6410,
    "period_start": "2024-11-01",
    "period_end": "2024-12-15",
    "document_url": "https://example.com/invoice.pdf",
    "document_filename": "factura_electricidad_diciembre.pdf",
    "provider": "Endesa",
    "notes": "Factura bimestral",
    "created_at": "2024-12-17T10:00:00Z",
    "updated_at": "2024-12-17T10:00:00Z",
    "created_by": "uuid-del-usuario"
  }
}
```

**Errores:**
- `400`: Faltan campos requeridos o valores inválidos
- `401`: Usuario no autenticado
- `500`: Error interno del servidor

---

### 2. Obtener facturas de servicio de un edificio

Obtiene todas las facturas de servicio de un edificio, opcionalmente filtradas por tipo, año y mes.

**GET** `/service-invoices/building/:buildingId?serviceType=electricity&year=2024&month=12`

**Parámetros de URL:**
- `buildingId`: UUID del edificio (requerido)

**Query parameters:**
- `serviceType`: Tipo de servicio opcional para filtrar (`electricity`, `water`, `gas`, `ibi`, `waste`)
- `year`: Año opcional para filtrar (ej: `2024`)
- `month`: Mes opcional para filtrar (ej: `12`)

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": "uuid-factura-1",
      "building_id": "uuid-del-edificio",
      "service_type": "electricity",
      "invoice_number": "FAC-2024-001",
      "invoice_date": "2024-12-15",
      "amount_eur": 480.00,
      "units": 6410,
      "period_start": "2024-11-01",
      "period_end": "2024-12-15",
      "document_url": "https://example.com/invoice.pdf",
      "document_filename": "factura_electricidad_diciembre.pdf",
      "provider": "Endesa",
      "notes": "Factura bimestral",
      "created_at": "2024-12-17T10:00:00Z",
      "updated_at": "2024-12-17T10:00:00Z",
      "created_by": "uuid-del-usuario"
    },
    {
      "id": "uuid-factura-2",
      "building_id": "uuid-del-edificio",
      "service_type": "water",
      "invoice_number": "FAC-2024-002",
      "invoice_date": "2024-12-10",
      "amount_eur": 685.00,
      "units": 685,
      "period_start": null,
      "period_end": null,
      "document_url": null,
      "document_filename": null,
      "provider": "Aqualia",
      "notes": null,
      "created_at": "2024-12-17T10:00:00Z",
      "updated_at": "2024-12-17T10:00:00Z",
      "created_by": "uuid-del-usuario"
    }
  ]
}
```

Los resultados están ordenados por fecha de factura descendente (más recientes primero).

**Errores:**
- `400`: buildingId es requerido
- `401`: Usuario no autenticado
- `500`: Error interno del servidor

---

### 3. Obtener una factura de servicio específica

Obtiene una factura de servicio por su ID.

**GET** `/service-invoices/:id`

**Parámetros de URL:**
- `id`: UUID de la factura (requerido)

**Respuesta exitosa (200):**
```json
{
  "data": {
    "id": "uuid-de-la-factura",
    "building_id": "uuid-del-edificio",
    "service_type": "electricity",
    "invoice_number": "FAC-2024-001",
    "invoice_date": "2024-12-15",
    "amount_eur": 480.00,
    "units": 6410,
    "period_start": "2024-11-01",
    "period_end": "2024-12-15",
    "document_url": "https://example.com/invoice.pdf",
    "document_filename": "factura_electricidad_diciembre.pdf",
    "provider": "Endesa",
    "notes": "Factura bimestral",
    "created_at": "2024-12-17T10:00:00Z",
    "updated_at": "2024-12-17T10:00:00Z",
    "created_by": "uuid-del-usuario"
  }
}
```

**Errores:**
- `404`: Factura de servicio no encontrada
- `401`: Usuario no autenticado
- `500`: Error interno del servidor

---

### 4. Actualizar una factura de servicio

Actualiza una factura de servicio existente. Los costes mensuales se recalcularán automáticamente.

**PUT** `/service-invoices/:id`

**Body (todos los campos son opcionales):**
```json
{
  "service_type": "electricity",
  "invoice_number": "FAC-2024-001-CORR",
  "invoice_date": "2024-12-15",
  "amount_eur": 500.00,
  "units": 6500,
  "provider": "Endesa",
  "notes": "Factura corregida"
}
```

**Respuesta exitosa (200):**
```json
{
  "data": {
    "id": "uuid-de-la-factura",
    "building_id": "uuid-del-edificio",
    "service_type": "electricity",
    "invoice_number": "FAC-2024-001-CORR",
    "invoice_date": "2024-12-15",
    "amount_eur": 500.00,
    "units": 6500,
    "period_start": "2024-11-01",
    "period_end": "2024-12-15",
    "document_url": "https://example.com/invoice.pdf",
    "document_filename": "factura_electricidad_diciembre.pdf",
    "provider": "Endesa",
    "notes": "Factura corregida",
    "created_at": "2024-12-17T10:00:00Z",
    "updated_at": "2024-12-17T11:00:00Z",
    "created_by": "uuid-del-usuario"
  }
}
```

**Nota:** Si cambias `invoice_date`, el sistema recalculará los costes mensuales tanto del mes anterior como del nuevo mes.

**Errores:**
- `404`: Factura de servicio no encontrada
- `401`: Usuario no autenticado
- `500`: Error interno del servidor

---

### 5. Eliminar una factura de servicio

Elimina una factura de servicio. Los costes mensuales se recalcularán automáticamente.

**DELETE** `/service-invoices/:id`

**Parámetros de URL:**
- `id`: UUID de la factura (requerido)

**Respuesta exitosa (204):**
Sin contenido.

**Errores:**
- `401`: Usuario no autenticado
- `500`: Error interno del servidor

---

## Tipos de Servicio

Los tipos de servicio disponibles son:
- `electricity`: Electricidad
- `water`: Agua
- `gas`: Gas
- `ibi`: IBI (Impuesto sobre Bienes Inmuebles)
- `waste`: Basuras

---

## Cálculo Automático de Costes Mensuales

Cuando se crea, actualiza o elimina una factura de servicio, el sistema **automáticamente** recalcula los costes mensuales correspondientes sumando todas las facturas del mismo tipo que pertenecen al mismo mes (basado en `invoice_date`).

**Ejemplo:**
- Si cargas una factura de electricidad del 15 de diciembre de 2024 por 480€
- Y luego cargas otra factura de electricidad del 20 de diciembre de 2024 por 100€
- El sistema automáticamente creará/actualizará el registro de `service_expenses` para diciembre 2024 con `electricity_eur = 580.00`

Los gastos de servicios se pueden consultar usando la API de Service Expenses (solo lectura). Los datos se almacenan en la tabla `service_expenses`.

---

## Permisos y Seguridad

- Solo los propietarios del edificio (o usuarios asignados mediante `building_propietario_assignments`) pueden crear, actualizar o eliminar facturas de servicio.
- Todos los usuarios con acceso al edificio pueden ver las facturas de servicio.
- La seguridad se aplica mediante Row Level Security (RLS) en la base de datos.

---

## Ejemplos de Uso

### Ejemplo 1: Crear facturas para diferentes servicios del mismo mes

```bash
# Factura de electricidad - Diciembre 2024
curl -X POST {{base_url}}/service-invoices \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "building_id": "uuid-edificio",
    "service_type": "electricity",
    "invoice_date": "2024-12-15",
    "amount_eur": 480.00,
    "units": 6410,
    "provider": "Endesa"
  }'

# Factura de agua - Diciembre 2024
curl -X POST {{base_url}}/service-invoices \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "building_id": "uuid-edificio",
    "service_type": "water",
    "invoice_date": "2024-12-10",
    "amount_eur": 685.00,
    "units": 685,
    "provider": "Aqualia"
  }'

# Factura de gas - Diciembre 2024
curl -X POST {{base_url}}/service-invoices \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "building_id": "uuid-edificio",
    "service_type": "gas",
    "invoice_date": "2024-12-05",
    "amount_eur": 40.00,
    "units": 40,
    "provider": "Naturgy"
  }'
```

### Ejemplo 2: Obtener todas las facturas de electricidad de un año

```bash
curl -X GET "{{base_url}}/service-invoices/building/uuid-edificio?serviceType=electricity&year=2024" \
  -H "Authorization: Bearer <token>"
```

### Ejemplo 3: Actualizar el importe de una factura

```bash
curl -X PUT {{base_url}}/service-invoices/uuid-factura \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount_eur": 500.00,
    "notes": "Corrección de importe"
  }'
```

---

## Notas Técnicas

1. **Cálculo automático**: Los costes mensuales se calculan automáticamente mediante triggers en la base de datos cuando se inserta/actualiza/elimina una factura.

2. **Determinación del mes**: El mes del coste se determina a partir del campo `invoice_date`. Por ejemplo, una factura con fecha `2024-12-15` se contabilizará en los costes mensuales de diciembre 2024.

3. **Múltiples facturas del mismo tipo**: Si hay múltiples facturas del mismo tipo en el mismo mes, se suman automáticamente en el coste mensual.

4. **Actualización de fecha**: Si cambias `invoice_date` de una factura, el sistema recalculará los costes mensuales tanto del mes original como del nuevo mes.

5. **Unidades**: Las unidades se suman si hay múltiples facturas del mismo tipo en el mismo mes. Si una factura no tiene unidades, no afecta el total.



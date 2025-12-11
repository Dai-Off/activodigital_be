# Rentas API - Gestión de Facturas y Pagos

Documentación de los endpoints para gestionar facturas mensuales de rentas y sus pagos asociados.

## Autenticación

Todas las rutas requieren autenticación JWT:

```
Authorization: Bearer <token>
```

## Base URL

```
{{base_url}}/rents/...
```

---

## Modelo de Datos

### Factura (RentInvoice)

Una factura representa una facturación mensual de renta para una unidad. Incluye la información del pago directamente en la misma entidad.

```typescript
{
  id: string;
  buildingId: string;
  unitId: string;
  invoiceMonth: string; // YYYY-MM-01 (primer día del mes)
  invoiceNumber?: string | null;
  rentAmount: number;
  additionalCharges: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string; // YYYY-MM-DD
  notes?: string | null;
  
  // Campos de pago (parte de la factura)
  paymentDate?: string | null; // YYYY-MM-DD
  paymentAmount?: number | null;
  paymentMethod?: 'transfer' | 'cash' | 'check' | 'other' | null;
  paymentReferenceNumber?: string | null;
  paymentNotes?: string | null;
  
  createdAt?: string;
  updatedAt?: string;
}
```

### Resumen Mensual (MonthlyRentSummary)

Resumen consolidado de todas las facturas de un edificio para un mes específico.

```typescript
{
  buildingId: string;
  month: string; // YYYY-MM
  year: number;
  monthNumber: number;
  
  // Totales
  totalInvoiced: number; // Total facturado
  totalCollected: number; // Total cobrado
  collectionPercentage: number; // % cobro (0-100, máximo 100%)
  
  // Estados
  paidCount: number; // Número de facturas pagadas
  pendingCount: number; // Número de facturas pendientes
  overdueCount: number; // Número de facturas retrasadas
  
  // Detalles por estado
  paidAmount: number; // Monto pagado
  pendingAmount: number; // Monto pendiente
  overdueAmount: number; // Monto retrasado
  
  // Detalle de facturas
  invoices: RentInvoice[];
}
```

---

## Endpoints

### POST /rents/invoices

Crea una nueva factura de renta.

**Request Body:**
```json
{
  "buildingId": "uuid-del-edificio",
  "unitId": "uuid-de-la-unidad",
  "invoiceMonth": "2024-01-01",
  "rentAmount": 800,
  "additionalCharges": 50,
  "dueDate": "2024-02-05",
  "invoiceNumber": "FAC-2024-001",
  "notes": "Renta enero 2024"
}
```

**Campos requeridos:**
- `buildingId`: UUID del edificio
- `unitId`: UUID de la unidad
- `invoiceMonth`: Primer día del mes en formato `YYYY-MM-01`
- `rentAmount`: Monto de la renta (número)
- `dueDate`: Fecha de vencimiento en formato `YYYY-MM-DD`

**Campos opcionales:**
- `additionalCharges`: Gastos adicionales (default: 0)
- `invoiceNumber`: Número de factura
- `notes`: Notas adicionales

**Respuesta (201):**
```json
{
  "data": {
    "id": "uuid",
    "buildingId": "...",
    "unitId": "...",
    "invoiceMonth": "2024-01-01",
    "rentAmount": 800,
    "additionalCharges": 50,
    "totalAmount": 850,
    "status": "pending",
    "dueDate": "2024-02-05",
    "paymentDate": null,
    "paymentAmount": null,
    ...
  }
}
```

---

### GET /rents/invoices/:id

Obtiene una factura específica con toda su información, incluyendo el pago si existe.

**Respuesta (200):**
```json
{
  "data": {
    "id": "uuid",
    "buildingId": "...",
    "unitId": "...",
    "invoiceMonth": "2024-01-01",
    "totalAmount": 850,
    "status": "paid",
    "paymentDate": "2024-01-15",
    "paymentAmount": 850,
    "paymentMethod": "transfer",
    "paymentReferenceNumber": "TRF-123456",
    ...
  }
}
```

**Respuesta (404):** Si la factura no existe

---

### GET /rents/building/:buildingId/invoices

Obtiene todas las facturas de un edificio (todos los meses), ordenadas por mes descendente.

**Respuesta (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "invoiceMonth": "2024-02-01",
      "totalAmount": 900,
      "status": "pending",
      ...
    },
    {
      "id": "uuid",
      "invoiceMonth": "2024-01-01",
      "totalAmount": 850,
      "status": "paid",
      ...
    }
  ]
}
```

---

### GET /rents/building/:buildingId/invoices/:month

Obtiene las facturas de un mes específico para un edificio.

**Parámetros:**
- `buildingId`: UUID del edificio
- `month`: Mes en formato `YYYY-MM` (ej: "2024-01")

**Respuesta (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "invoiceMonth": "2024-01-01",
      "totalAmount": 850,
      "status": "paid",
      "paymentDate": "2024-01-15",
      "paymentAmount": 850,
      ...
    }
  ]
}
```

---

### GET /rents/building/:buildingId/summary/:month

Obtiene el resumen mensual de rentas para un edificio. Este es el endpoint principal que calcula:
- Total facturado
- Total cobrado
- Porcentaje de cobro
- Cantidad y montos por estado (pagadas/pendientes/retrasadas)

**Parámetros:**
- `buildingId`: UUID del edificio
- `month`: Mes en formato `YYYY-MM` (ej: "2024-01")

**Respuesta (200):**
```json
{
  "data": {
    "buildingId": "uuid",
    "month": "2024-01",
    "year": 2024,
    "monthNumber": 1,
    "totalInvoiced": 850,
    "totalCollected": 850,
    "collectionPercentage": 100.0,
    "paidCount": 1,
    "pendingCount": 0,
    "overdueCount": 0,
    "paidAmount": 850,
    "pendingAmount": 0,
    "overdueAmount": 0,
    "invoices": [
      {
        "id": "uuid",
        "totalAmount": 850,
        "status": "paid",
        "paymentAmount": 850,
        ...
      }
    ]
  }
}
```

**Nota:** El `collectionPercentage` está limitado a un máximo de 100%, incluso si hay sobrepagos.

---

### PUT /rents/invoices/:id

Actualiza una factura. Puede actualizar tanto los datos de la factura como registrar/actualizar el pago.

**Request Body - Registrar pago:**
```json
{
  "paymentDate": "2024-01-15",
  "paymentAmount": 850,
  "paymentMethod": "transfer",
  "paymentReferenceNumber": "TRF-123456",
  "paymentNotes": "Pago completo recibido"
}
```

**Request Body - Actualizar datos de factura:**
```json
{
  "invoiceNumber": "FAC-2024-002",
  "rentAmount": 900,
  "additionalCharges": 50,
  "dueDate": "2024-03-05",
  "notes": "Actualización de renta"
}
```

**Request Body - Combinado (actualizar factura y pago):**
```json
{
  "rentAmount": 900,
  "paymentDate": "2024-01-20",
  "paymentAmount": 950,
  "paymentMethod": "cash"
}
```

**Campos opcionales (puedes enviar solo los que quieras actualizar):**
- `invoiceNumber`
- `rentAmount`
- `additionalCharges`
- `dueDate`
- `notes`
- `paymentDate`
- `paymentAmount`
- `paymentMethod`
- `paymentReferenceNumber`
- `paymentNotes`

**Respuesta (200):**
```json
{
  "data": {
    "id": "uuid",
    "totalAmount": 950,
    "status": "paid",
    "paymentAmount": 950,
    ...
  }
}
```

**Nota:** El estado de la factura se actualiza automáticamente mediante un trigger en la base de datos:
- `paid`: Si `paymentAmount >= totalAmount`
- `overdue`: Si la fecha actual > `dueDate` y no está pagada
- `pending`: En cualquier otro caso

---

### DELETE /rents/invoices/:id

Elimina una factura. Al eliminar una factura, también se elimina el pago asociado (están en la misma tabla).

**Respuesta (200):**
```json
{
  "message": "Factura eliminada correctamente"
}
```

---

## Estados de Factura

Las facturas pueden tener tres estados:

- **pending**: Factura pendiente de pago
- **paid**: Factura pagada (cuando `paymentAmount >= totalAmount`)
- **overdue**: Factura retrasada (cuando la fecha actual > `dueDate` y no está pagada)

El estado se actualiza automáticamente mediante un trigger en la base de datos cuando:
- Se actualiza el `paymentAmount`
- Se actualiza el `totalAmount`
- Se actualiza el `dueDate`

---

## Ejemplos de Uso

### Flujo completo: Crear factura y registrar pago

1. **Crear factura:**
```http
POST /rents/invoices
Content-Type: application/json

{
  "buildingId": "73d77a52-ede7-4c96-87c0-2b95220a9c25",
  "unitId": "c7daa34b-1600-4cb4-8504-cb0381f8234d",
  "invoiceMonth": "2024-01-01",
  "rentAmount": 800,
  "additionalCharges": 50,
  "dueDate": "2024-02-05"
}
```

2. **Registrar pago:**
```http
PUT /rents/invoices/{invoiceId}
Content-Type: application/json

{
  "paymentDate": "2024-01-15",
  "paymentAmount": 850,
  "paymentMethod": "transfer",
  "paymentReferenceNumber": "TRF-123456"
}
```

3. **Obtener resumen mensual:**
```http
GET /rents/building/73d77a52-ede7-4c96-87c0-2b95220a9c25/summary/2024-01
```

---

## Errores Comunes

### Error 400: Formato de mes inválido
El parámetro `month` debe estar en formato `YYYY-MM` (ej: "2024-01", no "2024-1" o "01-2024").

### Error 404: Factura no encontrada
La factura con el ID proporcionado no existe o no pertenece al usuario autenticado.

### Error 401: Usuario no autenticado
Falta el token de autenticación o el token es inválido.

---

## Notas Técnicas

- Una factura y su pago están en la misma tabla (`rent_invoices`)
- El estado de la factura se calcula automáticamente mediante triggers de PostgreSQL
- El porcentaje de cobro está limitado a 100% máximo, incluso si hay sobrepagos
- No se pueden tener múltiples pagos por factura (un solo pago por factura)
- Al eliminar una factura, se elimina también su pago


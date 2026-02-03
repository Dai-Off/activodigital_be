# Document Expiration Alerts API

## Descripción

Sistema de alertas automático que monitorea documentos y facturas próximos a vencer. El sistema busca en 3 tablas de la base de datos aquellos registros que tienen un campo `expiration_date` configurado y que vencen en un rango de tiempo determinado.

## Tablas Monitoreadas

El sistema monitorea las siguientes tablas:

1. **building_documents** - Documentos de gestión de edificios
2. **unit_documents** - Documentos de gestión de unidades
3. **service_invoices** - Facturas de servicios (electricidad, agua, gas, IBI, basuras)

## Cronjob Automático

### Configuración

- **Frecuencia**: Diariamente a las 2:00 AM (hora de Madrid)
- **Librería**: `node-cron`
- **Zona horaria**: Europe/Madrid
- **Rango de búsqueda**: Próximos 7 días

### Funcionamiento

El cronjob se ejecuta automáticamente todos los días a las 2:00 AM y:

1. Busca documentos con `expiration_date` que vencen en los próximos 7 días
2. Genera logs con estadísticas de documentos encontrados
3. Reporta en logs:
   - Total de documentos próximos a vencer
   - Desglose por tipo (building_documents, unit_documents, service_invoices)

### Logs del Cronjob

Ejemplo de log cuando se ejecuta:

```
[INFO] Buscando documentos próximos a vencer (próximos 7 días)...
[INFO] Búsqueda completada en 245ms
  - total: 5
  - building_documents: 2
  - unit_documents: 1
  - service_invoices: 2
[WARN] Se encontraron 5 documentos próximos a vencer (próximos 7 días)
  - Documentos de edificios: 2
  - Documentos de unidades: 1
  - Facturas de servicios: 2
```

## Endpoints API

### GET /document-expiration-alerts

Obtiene documentos próximos a vencer con filtros opcionales.

**Autenticación**: Requerida (Bearer Token)

**Query Parameters** (todos opcionales):

- `days_ahead` (number): Días hacia adelante para buscar. Default: 90
- `include_expired` (boolean): Incluir documentos ya vencidos. Default: true
- `building_id` (string): Filtrar por ID de edificio
- `unit_id` (string): Filtrar por ID de unidad
- `category` (string): Filtrar por categoría
- `alert_level` (string): Filtrar por nivel de alerta: `critical`, `warning`, `info`

**Ejemplos de uso**:

```
GET /document-expiration-alerts
GET /document-expiration-alerts?days_ahead=7
GET /document-expiration-alerts?days_ahead=30&include_expired=false
GET /document-expiration-alerts?building_id=xxx&alert_level=critical
GET /document-expiration-alerts?days_ahead=7&category=financial
```

**Response**:

```json
{
  "alerts": [
    {
      "id": "building_xxx",
      "document_type": "building",
      "building_id": "xxx",
      "unit_id": null,
      "document_id": "xxx",
      "file_name": "documento.pdf",
      "title": "documento.pdf",
      "category": "financial",
      "expiration_date": "2026-02-09",
      "days_until_expiration": 7,
      "status": "activo",
      "alert_level": "critical",
      "building_name": "Edificio XYZ",
      "unit_name": null
    }
  ],
  "total": 1,
  "critical": 1,
  "warning": 0,
  "info": 0,
  "expired": 0
}
```

**Niveles de alerta**:

- `critical`: Documentos que vencen en menos de 7 días o ya vencieron
- `warning`: Documentos que vencen entre 7 y 30 días
- `info`: Documentos que vencen en más de 30 días

### POST /document-expiration-alerts/find-soon

Ejecuta manualmente la búsqueda de documentos próximos a vencer (próximos 7 días). Útil para testing o ejecución inmediata.

**Autenticación**: Requerida (Bearer Token)

**Request Body**: No requiere body

**Response**:

```json
{
  "message": "Búsqueda de documentos próximos a vencer completada",
  "total": 5,
  "building_documents": 2,
  "unit_documents": 1,
  "service_invoices": 2,
  "alerts": [
    {
      "id": "building_xxx",
      "document_type": "building",
      "building_id": "xxx",
      "document_id": "xxx",
      "file_name": "documento.pdf",
      "category": "financial",
      "expiration_date": "2026-02-09",
      "days_until_expiration": 7,
      "alert_level": "critical",
      "building_name": "Edificio XYZ"
    }
  ]
}
```

## Estructura de Datos

### DocumentExpirationAlert

```typescript
interface DocumentExpirationAlert {
  id: string;                    // ID único de la alerta (formato: "building_xxx", "unit_xxx", "service_invoice_xxx")
  document_type: 'building' | 'unit' | 'service_invoice';
  building_id: string;
  unit_id?: string | null;        // Solo para unit_documents
  document_id: string;            // ID del documento en su tabla original
  file_name: string;
  title?: string | null;
  category: string;
  expiration_date: string;        // ISO date YYYY-MM-DD
  days_until_expiration: number;  // Días hasta el vencimiento (negativo si ya venció)
  status: 'activo' | 'overdue';  // Status calculado dinámicamente
  alert_level: 'critical' | 'warning' | 'info';
  building_name?: string | null;
  unit_name?: string | null;
  
  // Campos adicionales para service_invoices
  service_type?: string | null;   // electricity, water, gas, ibi, waste
  invoice_number?: string | null;
  amount_eur?: number | null;
}
```

## Campos de Base de Datos

### Tablas Simplificadas

Las tablas `building_documents` y `unit_documents` han sido simplificadas y contienen solo los campos esenciales:

**building_documents**:
- `id`, `building_id`
- `file_name`, `file_size`, `mime_type`
- `storage_bucket`, `storage_path`, `storage_file_name`
- `category`
- `expiration_date` (campo principal para el cronjob)
- `uploaded_by`, `uploaded_at`, `created_at`, `updated_at`

**unit_documents**:
- `id`, `building_id`, `unit_id`
- `file_name`, `file_size`, `mime_type`
- `storage_bucket`, `storage_path`, `storage_file_name`
- `category`
- `expiration_date` (campo principal para el cronjob)
- `uploaded_by`, `uploaded_at`, `created_at`, `updated_at`

**service_invoices**:
- `id`, `building_id`
- `service_type`, `invoice_number`, `invoice_date`, `amount_eur`
- `expiration_date` (campo principal para el cronjob)
- `provider`, `created_at`, `updated_at`

## Flujo de Trabajo

### 1. Crear Documento con Vencimiento

Cuando se crea un documento desde el frontend o API, se puede especificar `expiration_date`:

```json
POST /building-documents
{
  "building_id": "xxx",
  "file_name": "documento.pdf",
  "file_size": 1024000,
  "mime_type": "application/pdf",
  "storage_path": "xxx/financial/documento.pdf",
  "storage_file_name": "documento.pdf",
  "category": "financial",
  "expiration_date": "2026-02-09"  // Opcional
}
```

### 2. Cronjob Automático

El cronjob se ejecuta diariamente y busca documentos con `expiration_date` que vencen en los próximos 7 días.

### 3. Consultar Alertas

El frontend puede consultar las alertas usando el endpoint GET:

```
GET /document-expiration-alerts?days_ahead=7
```

## Ejemplos de Uso

### Obtener todos los documentos próximos a vencer

```bash
curl -X GET "http://localhost:3000/document-expiration-alerts?days_ahead=7" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtener solo documentos críticos

```bash
curl -X GET "http://localhost:3000/document-expiration-alerts?days_ahead=7&alert_level=critical" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtener documentos de un edificio específico

```bash
curl -X GET "http://localhost:3000/document-expiration-alerts?building_id=xxx&days_ahead=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Ejecutar búsqueda manualmente

```bash
curl -X POST "http://localhost:3000/document-expiration-alerts/find-soon" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Implementación Técnica

### Archivos Principales

- **Servicio**: `src/domain/services/documentExpirationAlertService.ts`
- **Controlador**: `src/web/controllers/documentExpirationAlertController.ts`
- **Rutas**: `src/routes/documentExpirationAlerts.ts`
- **Cronjob**: `src/services/documentExpirationCronJob.ts`
- **Tipos**: `src/types/documentExpirationAlert.ts`

### Inicialización del Cronjob

El cronjob se inicializa automáticamente cuando el servidor arranca en `src/index.ts`:

```typescript
import { getDocumentExpirationCronJob } from "./services/documentExpirationCronJob";
const documentExpirationCronJob = getDocumentExpirationCronJob();
documentExpirationCronJob.start();
```

### Cálculo de Niveles de Alerta

```typescript
// Critical: < 7 días o ya venció
if (daysUntilExpiration < 0 || daysUntilExpiration <= 7) {
  return 'critical';
}
// Warning: 7-30 días
if (daysUntilExpiration <= 30) {
  return 'warning';
}
// Info: > 30 días
return 'info';
```

## Migraciones de Base de Datos

Las tablas fueron simplificadas mediante las siguientes migraciones:

- `043_simplify_building_documents_table.sql` - Elimina campos innecesarios de building_documents
- `044_simplify_unit_documents_table.sql` - Elimina campos innecesarios de unit_documents

**Campos eliminados**:
- `status` (se calcula dinámicamente)
- `category_label`, `subcategory`
- `title`, `notes`
- `contract_provider`, `contract_amount`, `contract_expiration`, `contract_renewal`
- `signed_url`, `signed_url_expires_at`

## Notas Importantes

1. El cronjob NO modifica la base de datos, solo busca y reporta
2. El campo `expiration_date` puede ser `NULL` - solo se buscan documentos con fecha configurada
3. El sistema es dinámico: puedes ajustar `days_ahead` según tus necesidades
4. Los niveles de alerta se calculan dinámicamente basados en `days_until_expiration`
5. El cronjob se ejecuta en horario de bajo tráfico (2:00 AM) para no afectar el rendimiento

## Troubleshooting

### El cronjob no encuentra documentos

- Verifica que los documentos tengan `expiration_date` configurado (no NULL)
- Verifica que la fecha de vencimiento esté dentro del rango buscado
- Revisa los logs del servidor para ver errores

### El endpoint retorna 404

- Verifica que el servidor esté corriendo
- Verifica que la ruta sea correcta: `/document-expiration-alerts` (sin `/api`)
- Verifica que el token de autenticación sea válido

### El cronjob no se ejecuta

- Verifica que el servidor esté corriendo
- Revisa los logs al iniciar el servidor - debe aparecer: "Cronjob de alertas de documentos próximos a vencer iniciado"
- El cronjob se ejecuta a las 2:00 AM, puedes probarlo manualmente con el endpoint POST


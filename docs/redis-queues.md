# Colas Redis (BullMQ) – Procesamiento asíncrono

## Resumen

El backend usa **Redis** + **BullMQ** para procesar trabajos pesados (facturas, certificados energéticos) sin bloquear la API. El usuario recibe una respuesta inmediata y una **notificación** cuando el job termina.

## Arquitectura

```
Cliente (FE)                Backend API                 Redis + Worker
     |                            |                            |
     |  POST /ai/extract-*-async  |                            |
     |  { document_url, ... }     |  INSERT job (BD)            |
     | ------------------------->|  addJob(jobId) ------------->| cola
     |  202 { job_id }            |                            |
     | <-------------------------|                            |
     |                            |                            | worker procesa
     |  (polling GET /ai/*-job/:id)                            | setStatus + notify
     |  o notificación socket    |                            |
     | <------------------------------------------ notificación
```

- **Tabla única**: `invoice_processing_jobs` guarda todos los jobs (facturas y certificados), diferenciados por `job_type` (`'invoice' | 'certificate'`).
- **Una conexión Redis** compartida (`lib/redis.ts`).
- **Una cola BullMQ por tipo de trabajo** (`invoice-processing`, `certificate-processing`), cada una con su worker.

## Configuración

### Variables de entorno

| Variable | Obligatorio | Descripción |
|--------|-------------|-------------|
| `REDIS_URL` | Sí | URL de Redis (ej: `redis://localhost:6379` o Redis Cloud). |
| `CERTIFICATE_EXTRACTOR_URL` | No | URL del extractor de certificados (default: Fly.dev). |

### Conexión Redis

- **Archivo**: `src/lib/redis.ts`
- **Función**: `getRedisConnection()` — singleton, usada por todas las colas.
- **Cierre**: `closeRedisConnection()` para graceful shutdown (opcional).

## Cómo está implementado hoy

### 1. Crear el job en BD

El controlador (ej: `aiInvoiceController`, `aiCertificateController`) recibe la petición, crea el registro en `invoice_processing_jobs` (con `job_type` correspondiente) y obtiene el `id` (UUID).

### 2. Encolar en Redis

Se llama a la función de la cola correspondiente:

- Facturas: `addInvoiceProcessingJob(jobId)` → cola `invoice-processing`
- Certificados: `addCertificateProcessingJob(jobId)` → cola `certificate-processing`

El payload del job en Redis es siempre `{ jobId }` (el UUID de la fila en BD).

### 3. Worker procesa

Cada worker:

1. Lee el registro por `jobId` (y, si aplica, filtra por `job_type`).
2. Si `status !== 'queued'`, sale sin hacer nada.
3. Pone `status = 'processing'`.
4. Ejecuta la lógica específica (descargar archivo, llamar a IA o API externa).
5. Si va bien: `setStatus('completed', { extracted_data })` y emite notificación.
6. Si falla: `setStatus('failed', { error_message })` y relanza el error (BullMQ reintenta según configuración).

### 4. Notificación

Se usa `NotificationBus` + `UserService.getAuthUserIdByAppId(record.user_id)` para obtener el `user_id` de auth y emitir al usuario correcto (y al socket por `socket_emit_user_id` = app user id).

## Fábrica reutilizable (`processingQueueFactory`)

Toda la lógica común de Redis/BullMQ está en **`src/lib/processingQueueFactory.ts`**:

- Una sola conexión Redis.
- Misma configuración de cola (reintentos, backoff, limpieza).
- Worker genérico que: carga el job de BD, filtra (opcional), marca `processing`, ejecuta tu `processJob(record)`, marca `completed` y emite notificación (con `UserService.getAuthUserIdByAppId` y `NotificationBus`).

Cada cola concreta solo define:

- **queueName**, **jobName**, **logLabel**
- **getJobService()** — servicio con `getById` y `setStatus`
- **filterRecord(record)** — opcional (ej: `job_type === 'invoice'`)
- **processJob(record)** — async, devuelve `{ extracted_data }` o lanza
- **buildNotificationContent(record, filename)** — `{ type, title, message, metadata }`

Las colas de facturas y certificados están implementadas así (ver `invoiceProcessingQueue.ts` y `certificateProcessingQueue.ts`).

## Añadir una nueva cola

1. **Servicio de BD**: si reutilizas `invoice_processing_jobs`, añade `job_type = 'nuevo_tipo'` y un servicio que haga `getById`/`setStatus` filtrando por ese tipo.
2. **processJob**: función `(record) => Promise<Record<string, unknown>>` que haga la descarga/IA/API y devuelva el resultado.
3. **buildNotificationContent**: devuelve `{ type, title, message, metadata }` (el factory añade user_id, building_id, etc.).
4. **createProcessingQueue**: llama a `createProcessingQueue({ ... })` y exporta `addJob`, `startWorker`, `close`.
5. **index.ts**: llama a `startTuColaWorker()` al arrancar.
6. **Rutas**: `POST /ai/tu-recurso-async` y `GET /ai/tu-recurso-job/:id`.

## Ejemplo: cola nueva con la fábrica

Supongamos que quieres una cola `report-processing` que descarga una URL, “procesa” y notifica. El registro en BD tiene al menos `id`, `user_id`, `building_id`, `status`, `document_url`, `document_filename` (tu tabla o mismo `invoice_processing_jobs` con `job_type = 'report'`).

**1. Servicio de BD** (ej. `reportProcessingJobService.ts`): `getById(id)`, `setStatus(id, status, { extracted_data?, error_message? })`, y al crear el job usar `job_type: 'report'`.

**2. Archivo de la cola** (`src/services/reportProcessingQueue.ts`):

```ts
import { ReportProcessingJobService } from '../domain/services/reportProcessingJobService';
import { NotificationType } from '../types/notification';
import type { ReportProcessingJob } from '../types/reportProcessingJob';
import { createProcessingQueue } from '../lib/processingQueueFactory';

const reportJobService = new ReportProcessingJobService();

const reportQueue = createProcessingQueue({
  queueName: 'report-processing',
  jobName: 'generate-report',
  logLabel: 'ReportQueue',
  getJobService: () => reportJobService,
  filterRecord: (record) => record.job_type === 'report', // si compartes tabla
  processJob: async (record) => {
    const res = await fetch(record.document_url, { method: 'GET' });
    if (!res.ok) throw new Error(`Descarga fallida: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    // ... tu lógica (ej. llamar a un servicio que genere el reporte)
    return { report_url: '...', summary: '...' } as Record<string, unknown>;
  },
  buildNotificationContent: (record, filename) => ({
    type: NotificationType.MAINTENANCE, // o un tipo específico
    title: 'Reporte listo',
    message: `El reporte ${filename} ya está disponible.`,
    metadata: { reportJobId: record.id, document_filename: filename },
  }),
  concurrency: 2,
});

export async function addReportProcessingJob(jobId: string): Promise<string> {
  return reportQueue.addJob(jobId);
}

export function startReportProcessingWorker(): void {
  reportQueue.startWorker();
}

export async function closeReportProcessingQueue(): Promise<void> {
  await reportQueue.close();
}
```

**3. Arranque** en `src/index.ts`:

```ts
import { startReportProcessingWorker } from './services/reportProcessingQueue';
try {
  startReportProcessingWorker();
} catch (e) {
  console.warn('[ReportQueue] No se pudo iniciar (¿REDIS_URL?):', (e as Error).message);
}
```

**4. Controlador y rutas**: `POST /ai/report-async` (crea job en BD, llama a `addReportProcessingJob(job.id)`, responde `202 { job_id }`) y `GET /ai/report-job/:id` (devuelve estado y `extracted_data` si está completado).

Con eso la cola queda integrada: misma Redis, misma configuración de reintentos y notificaciones que facturas y certificados.

## Archivos relevantes

| Archivo | Rol |
|---------|-----|
| `src/lib/redis.ts` | Conexión Redis compartida. |
| `src/lib/processingQueueFactory.ts` | Fábrica reutilizable para definir colas (queue + worker + notificación). |
| `src/services/invoiceProcessingQueue.ts` | Cola de facturas (usa la fábrica). |
| `src/services/certificateProcessingQueue.ts` | Cola de certificados (usa la fábrica). |
| `src/domain/services/invoiceProcessingJobService.ts` | CRUD jobs en BD (facturas). |
| `src/domain/services/certificateProcessingJobService.ts` | CRUD jobs en BD (certificados, misma tabla, `job_type = 'certificate'`). |
| `src/domain/events/notificationBus.ts` | Emisión de notificaciones al completar un job. |
| `database/migrations/045_*` | Creación tabla `invoice_processing_jobs`. |
| `database/migrations/046_*` | Añade `job_type` y columnas para certificados. |

## Opciones por defecto de BullMQ

- **Reintentos**: 2 intentos con backoff exponencial (5 s base).
- **Limpieza**: se mantienen los últimos 1000 jobs completados.
- **Concurrencia**: 2 jobs por worker (configurable por cola).

## Graceful shutdown

Si implementas cierre ordenado del servidor, conviene:

1. Dejar de aceptar nuevos jobs.
2. Cerrar workers y colas: `closeInvoiceProcessingQueue()`, `closeCertificateProcessingQueue()`.
3. Cerrar Redis: `closeRedisConnection()`.

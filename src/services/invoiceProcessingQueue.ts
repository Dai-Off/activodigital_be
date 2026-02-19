import { Queue, Worker, Job } from 'bullmq';
import { getRedisConnection } from '../lib/redis';
import { InvoiceProcessingJobService } from '../domain/services/invoiceProcessingJobService';
import { UserService } from '../domain/services/userService';
import { AIProcessingService } from '../domain/services/aiProcessingService';
import { NotificationBus } from '../domain/events/notificationBus';
import { NotificationEvents } from '../domain/events/notificationBus';
import { NotificationType } from '../types/notification';
import type { InvoiceJobPayload } from '../types/invoiceProcessingJob';

const QUEUE_NAME = 'invoice-processing';

let queue: Queue | null = null;
let worker: Worker | null = null;

function getQueue(): Queue {
  if (!queue) {
    queue = new Queue<InvoiceJobPayload>(QUEUE_NAME, {
      // BullMQ trae su propia versión de ioredis, así que usamos un cast
      // para evitar incompatibilidades de tipos entre ambas versiones.
      connection: getRedisConnection() as any,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 1000 },
      },
    });
  }
  return queue;
}

/**
 * Añade un job de procesamiento de factura a la cola.
 * Retorna el jobId de BullMQ (no el UUID de la tabla).
 */
export async function addInvoiceProcessingJob(jobId: string): Promise<string> {
  const q = getQueue();
  const job = await q.add('extract-invoice', { jobId });
  return job.id ?? '';
}

/**
 * Inicia el worker que procesa la cola (llamar al arrancar el servidor).
 * Requiere REDIS_URL en .env (ej: redis://localhost:6379).
 */
export function startInvoiceProcessingWorker(): void {
  if (worker) return;

  // Cast para evitar incompatibilidad de tipos entre ioredis directo y el que usa BullMQ internamente.
  const connection = getRedisConnection() as any;
  const jobService = new InvoiceProcessingJobService();
  const userService = new UserService();
  const aiService = new AIProcessingService();

  worker = new Worker<InvoiceJobPayload>(
    QUEUE_NAME,
    async (job: Job<InvoiceJobPayload>) => {
      const { jobId } = job.data;
      const record = await jobService.getById(jobId);
      if (!record) {
        throw new Error(`Job no encontrado: ${jobId}`);
      }
      if (record.job_type && record.job_type !== 'invoice') {
        return; // No es un job de factura (ej. certificado)
      }
      if (record.status !== 'queued') {
        return; // Ya procesado o en curso
      }

      await jobService.setStatus(jobId, 'processing');

      try {
        const response = await fetch(record.document_url, { method: 'GET' });
        if (!response.ok) {
          throw new Error(`Error al descargar documento: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const extractedData = await aiService.extractInvoiceData(buffer);
        await jobService.setStatus(jobId, 'completed', {
          extracted_data: extractedData as Record<string, unknown>,
        });

        const filename = record.document_filename || 'documento';
        const authUserId = await userService.getAuthUserIdByAppId(record.user_id);
        if (authUserId) {
          NotificationBus.getInstance().emit(NotificationEvents.NOTIFICATION_CREATED, {
            user_id: authUserId,
            socket_emit_user_id: record.user_id,
            building_id: record.building_id,
            type: NotificationType.FINANCIAL,
            title: 'Factura procesada',
            message: `El documento ${filename} ya ha sido procesado. Ve a Gestión de documentos para revisar y registrar la factura.`,
            expiration: null,
            priority: 0,
            metadata: { jobId, document_filename: filename },
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        await jobService.setStatus(jobId, 'failed', { error_message: message });
        throw err;
      }
    },
    {
      connection,
      concurrency: 2,
    }
  );

  worker.on('completed', (job: Job<InvoiceJobPayload>) => {
    const jobId = job?.data?.jobId ?? job?.id;
    console.log(`[InvoiceQueue] Job ${jobId} completado`);
  });
  worker.on('failed', (job: Job<InvoiceJobPayload> | undefined, err: unknown) => {
    const jobId = job?.data?.jobId ?? job?.id;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[InvoiceQueue] Job ${jobId} falló:`, message);
  });
  worker.on('error', (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[InvoiceQueue] Error en worker:', message);
  });

  console.log('[InvoiceQueue] Worker de facturas iniciado');
}

/**
 * Cierra la cola y el worker (graceful shutdown).
 */
export async function closeInvoiceProcessingQueue(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
}

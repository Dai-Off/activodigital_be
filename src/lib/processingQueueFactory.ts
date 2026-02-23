import { Queue, Worker, Job } from 'bullmq';
import { getRedisConnection } from './redis';
import { UserService } from '../domain/services/userService';
import { NotificationBus } from '../domain/events/notificationBus';
import { NotificationEvents } from '../domain/events/notificationBus';
import type { NotificationType } from '../types/notification';
import type { ProcessingJobRecord } from '../types/processing';

/** Servicio que lee/actualiza el job en BD (por tipo de job). */
export interface ProcessingJobService<R extends ProcessingJobRecord = ProcessingJobRecord> {
  getById(id: string): Promise<R | null>;
  setStatus(
    id: string,
    status: string,
    data?: { extracted_data?: Record<string, unknown>; error_message?: string }
  ): Promise<void>;
}

/** Contenido de la notificación al completar (el factory añade user_id, socket_emit_user_id, building_id, etc.). */
export interface NotificationContent {
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, string>;
}

export interface ProcessingQueueConfig<R extends ProcessingJobRecord = ProcessingJobRecord> {
  /** Nombre de la cola en Redis (ej: 'invoice-processing'). */
  queueName: string;
  /** Nombre del job al añadir (ej: 'extract-invoice'). */
  jobName: string;
  /** Etiqueta para logs (ej: 'InvoiceQueue'). */
  logLabel: string;
  /** Devuelve el servicio de BD para este tipo de job. */
  getJobService: () => ProcessingJobService<R>;
  /**
   * Si se devuelve false, el worker ignora este job (ej: job_type !== 'invoice').
   * Opcional.
   */
  filterRecord?: (record: R) => boolean;
  /**
   * Lógica de procesamiento. Debe devolver extracted_data o lanzar en caso de error.
   */
  processJob: (record: R) => Promise<Record<string, unknown>>;
  /**
   * Construye el contenido de la notificación al completar.
   * filename suele ser record.document_filename ?? 'documento'.
   */
  buildNotificationContent: (record: R, filename: string) => NotificationContent | null;
  /** Concurrencia del worker (default 2). */
  concurrency?: number;
}

const defaultJobOptions = {
  attempts: 2,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: { count: 1000 },
};

/**
 * Crea una cola BullMQ reutilizable: añadir jobs, arrancar worker y cerrar.
 * La conexión Redis es la compartida (getRedisConnection).
 * Al completar un job se emite notificación vía NotificationBus (user_id vía UserService.getAuthUserIdByAppId).
 */
export function createProcessingQueue<R extends ProcessingJobRecord = ProcessingJobRecord>(
  config: ProcessingQueueConfig<R>
): {
  addJob: (jobId: string) => Promise<string>;
  startWorker: () => void;
  close: () => Promise<void>;
} {
  const {
    queueName,
    jobName,
    logLabel,
    getJobService,
    filterRecord,
    processJob,
    buildNotificationContent,
    concurrency = 2,
  } = config;

  let queue: Queue<{ jobId: string }> | null = null;
  let worker: Worker<{ jobId: string }> | null = null;

  function getQueue(): Queue<{ jobId: string }> {
    if (!queue) {
      queue = new Queue<{ jobId: string }>(queueName, {
        connection: getRedisConnection() as any,
        defaultJobOptions,
      });
    }
    return queue;
  }

  async function addJob(jobId: string): Promise<string> {
    const q = getQueue();
    const job = await q.add(jobName, { jobId });
    return job.id ?? '';
  }

  function startWorker(): void {
    if (worker) return;

    const connection = getRedisConnection() as any;
    const jobService = getJobService();
    const userService = new UserService();

    worker = new Worker<{ jobId: string }>(
      queueName,
      async (job: Job<{ jobId: string }>) => {
        const { jobId } = job.data;
        const record = await jobService.getById(jobId) as R | null;
        if (!record) {
          throw new Error(`Job no encontrado: ${jobId}`);
        }
        if (filterRecord && !filterRecord(record)) {
          return;
        }
        if (record.status !== 'queued') {
          return;
        }

        await jobService.setStatus(jobId, 'processing');

        try {
          const extractedData = await processJob(record);
          await jobService.setStatus(jobId, 'completed', {
            extracted_data: extractedData,
          });

          const filename = record.document_filename ?? 'documento';
          const content = buildNotificationContent(record, filename);
          if (content) {
            const authUserId = await userService.getAuthUserIdByAppId(record.user_id);
            if (authUserId) {
              NotificationBus.getInstance().emit(NotificationEvents.NOTIFICATION_CREATED, {
                user_id: authUserId,
                socket_emit_user_id: record.user_id,
                building_id: record.building_id,
                type: content.type,
                title: content.title,
                message: content.message,
                expiration: null,
                priority: 0,
                metadata: content.metadata,
              });
            }
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error desconocido';
          await jobService.setStatus(jobId, 'failed', { error_message: message });
          throw err;
        }
      },
      { connection, concurrency }
    );

    worker.on('completed', (job: Job<{ jobId: string }>) => {
      const id = job?.data?.jobId ?? job?.id;
      console.log(`[${logLabel}] Job ${id} completado`);
    });
    worker.on('failed', (job: Job<{ jobId: string }> | undefined, err: unknown) => {
      const id = job?.data?.jobId ?? job?.id;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${logLabel}] Job ${id} falló:`, message);
    });
    worker.on('error', (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${logLabel}] Error en worker:`, message);
    });

    console.log(`[${logLabel}] Worker iniciado`);
  }

  async function close(): Promise<void> {
    if (worker) {
      await worker.close();
      worker = null;
    }
    if (queue) {
      await queue.close();
      queue = null;
    }
  }

  return { addJob, startWorker, close };
}

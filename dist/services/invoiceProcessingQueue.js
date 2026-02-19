"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addInvoiceProcessingJob = addInvoiceProcessingJob;
exports.startInvoiceProcessingWorker = startInvoiceProcessingWorker;
exports.closeInvoiceProcessingQueue = closeInvoiceProcessingQueue;
const bullmq_1 = require("bullmq");
const redis_1 = require("../lib/redis");
const invoiceProcessingJobService_1 = require("../domain/services/invoiceProcessingJobService");
const userService_1 = require("../domain/services/userService");
const aiProcessingService_1 = require("../domain/services/aiProcessingService");
const notificationBus_1 = require("../domain/events/notificationBus");
const notificationBus_2 = require("../domain/events/notificationBus");
const notification_1 = require("../types/notification");
const QUEUE_NAME = 'invoice-processing';
let queue = null;
let worker = null;
function getQueue() {
    if (!queue) {
        queue = new bullmq_1.Queue(QUEUE_NAME, {
            // BullMQ trae su propia versión de ioredis, así que usamos un cast
            // para evitar incompatibilidades de tipos entre ambas versiones.
            connection: (0, redis_1.getRedisConnection)(),
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
async function addInvoiceProcessingJob(jobId) {
    const q = getQueue();
    const job = await q.add('extract-invoice', { jobId });
    return job.id ?? '';
}
/**
 * Inicia el worker que procesa la cola (llamar al arrancar el servidor).
 * Requiere REDIS_URL en .env (ej: redis://localhost:6379).
 */
function startInvoiceProcessingWorker() {
    if (worker)
        return;
    // Cast para evitar incompatibilidad de tipos entre ioredis directo y el que usa BullMQ internamente.
    const connection = (0, redis_1.getRedisConnection)();
    const jobService = new invoiceProcessingJobService_1.InvoiceProcessingJobService();
    const userService = new userService_1.UserService();
    const aiService = new aiProcessingService_1.AIProcessingService();
    worker = new bullmq_1.Worker(QUEUE_NAME, async (job) => {
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
                extracted_data: extractedData,
            });
            const filename = record.document_filename || 'documento';
            const authUserId = await userService.getAuthUserIdByAppId(record.user_id);
            if (authUserId) {
                notificationBus_1.NotificationBus.getInstance().emit(notificationBus_2.NotificationEvents.NOTIFICATION_CREATED, {
                    user_id: authUserId,
                    socket_emit_user_id: record.user_id,
                    building_id: record.building_id,
                    type: notification_1.NotificationType.FINANCIAL,
                    title: 'Factura procesada',
                    message: `El documento ${filename} ya ha sido procesado. Ve a Gestión de documentos para revisar y registrar la factura.`,
                    expiration: null,
                    priority: 0,
                    metadata: { jobId, document_filename: filename },
                });
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            await jobService.setStatus(jobId, 'failed', { error_message: message });
            throw err;
        }
    }, {
        connection,
        concurrency: 2,
    });
    worker.on('completed', (job) => {
        const jobId = job?.data?.jobId ?? job?.id;
        console.log(`[InvoiceQueue] Job ${jobId} completado`);
    });
    worker.on('failed', (job, err) => {
        const jobId = job?.data?.jobId ?? job?.id;
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[InvoiceQueue] Job ${jobId} falló:`, message);
    });
    worker.on('error', (err) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[InvoiceQueue] Error en worker:', message);
    });
    console.log('[InvoiceQueue] Worker de facturas iniciado');
}
/**
 * Cierra la cola y el worker (graceful shutdown).
 */
async function closeInvoiceProcessingQueue() {
    if (worker) {
        await worker.close();
        worker = null;
    }
    if (queue) {
        await queue.close();
        queue = null;
    }
}
//# sourceMappingURL=invoiceProcessingQueue.js.map
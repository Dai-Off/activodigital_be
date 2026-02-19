"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCertificateProcessingJob = addCertificateProcessingJob;
exports.startCertificateProcessingWorker = startCertificateProcessingWorker;
exports.closeCertificateProcessingQueue = closeCertificateProcessingQueue;
const bullmq_1 = require("bullmq");
const redis_1 = require("../lib/redis");
const certificateProcessingJobService_1 = require("../domain/services/certificateProcessingJobService");
const userService_1 = require("../domain/services/userService");
const notificationBus_1 = require("../domain/events/notificationBus");
const notificationBus_2 = require("../domain/events/notificationBus");
const notification_1 = require("../types/notification");
const QUEUE_NAME = 'certificate-processing';
const CERTIFICATE_EXTRACTOR_URL = process.env.CERTIFICATE_EXTRACTOR_URL || 'https://energy-certificate-extractor.fly.dev';
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
 * Añade un job de procesamiento de certificado a la cola.
 * Retorna el jobId de BullMQ (no el UUID de la tabla).
 */
async function addCertificateProcessingJob(jobId) {
    const q = getQueue();
    const job = await q.add('extract-certificate', { jobId });
    return job.id ?? '';
}
/**
 * Inicia el worker que procesa la cola (llamar al arrancar el servidor).
 * Requiere REDIS_URL en .env. Opcional: CERTIFICATE_EXTRACTOR_URL.
 */
function startCertificateProcessingWorker() {
    if (worker)
        return;
    // Cast para evitar incompatibilidad de tipos entre ioredis directo y el que usa BullMQ internamente.
    const connection = (0, redis_1.getRedisConnection)();
    const jobService = new certificateProcessingJobService_1.CertificateProcessingJobService();
    const userService = new userService_1.UserService();
    worker = new bullmq_1.Worker(QUEUE_NAME, async (job) => {
        const { jobId } = job.data;
        const record = await jobService.getById(jobId);
        if (!record) {
            throw new Error(`Job no encontrado: ${jobId}`);
        }
        if (record.status !== 'queued') {
            return;
        }
        await jobService.setStatus(jobId, 'processing');
        try {
            const response = await fetch(record.image_url, { method: 'GET' });
            if (!response.ok) {
                throw new Error(`Error al descargar imagen: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const blob = new Blob([buffer]);
            const formData = new FormData();
            formData.append('file', blob, record.document_filename);
            const extractRes = await fetch(`${CERTIFICATE_EXTRACTOR_URL}/extract`, {
                method: 'POST',
                body: formData,
                signal: AbortSignal.timeout(90000),
            });
            if (!extractRes.ok) {
                const text = await extractRes.text();
                throw new Error(`Extractor respondió ${extractRes.status}: ${text.slice(0, 200)}`);
            }
            const json = await extractRes.json();
            const extractedData = json && typeof json === 'object' && json.success && json.data
                ? json.data
                : json;
            await jobService.setStatus(jobId, 'completed', {
                extracted_data: extractedData,
            });
            const filename = record.document_filename || 'certificado';
            const authUserId = await userService.getAuthUserIdByAppId(record.user_id);
            if (authUserId) {
                notificationBus_1.NotificationBus.getInstance().emit(notificationBus_2.NotificationEvents.NOTIFICATION_CREATED, {
                    user_id: authUserId,
                    socket_emit_user_id: record.user_id,
                    building_id: record.building_id,
                    type: notification_1.NotificationType.CERTIFICATE,
                    title: 'Certificado energético procesado',
                    message: `El certificado ${filename} ya ha sido procesado. Ve a Gestión de documentos para revisar y guardar.`,
                    expiration: null,
                    priority: 0,
                    metadata: { certificateJobId: jobId, document_filename: filename },
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
        console.log(`[CertificateQueue] Job ${jobId} completado`);
    });
    worker.on('failed', (job, err) => {
        const jobId = job?.data?.jobId ?? job?.id;
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[CertificateQueue] Job ${jobId} falló:`, message);
    });
    worker.on('error', (err) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[CertificateQueue] Error en worker:', message);
    });
    console.log('[CertificateQueue] Worker de certificados energéticos iniciado');
}
/**
 * Cierra la cola y el worker (graceful shutdown).
 */
async function closeCertificateProcessingQueue() {
    if (worker) {
        await worker.close();
        worker = null;
    }
    if (queue) {
        await queue.close();
        queue = null;
    }
}
//# sourceMappingURL=certificateProcessingQueue.js.map
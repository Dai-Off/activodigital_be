"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProcessingQueue = createProcessingQueue;
const bullmq_1 = require("bullmq");
const redis_1 = require("./redis");
const userService_1 = require("../domain/services/userService");
const notificationBus_1 = require("../domain/events/notificationBus");
const notificationBus_2 = require("../domain/events/notificationBus");
const defaultJobOptions = {
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 1000 },
};
/**
 * Crea una cola BullMQ reutilizable: añadir jobs, arrancar worker y cerrar.
 * La conexión Redis es la compartida (getRedisConnection).
 * Al completar un job se emite notificación vía NotificationBus (user_id vía UserService.getAuthUserIdByAppId).
 */
function createProcessingQueue(config) {
    const { queueName, jobName, logLabel, getJobService, filterRecord, processJob, buildNotificationContent, buildErrorNotificationContent, concurrency = 2, } = config;
    let queue = null;
    let worker = null;
    function getQueue() {
        if (!queue) {
            queue = new bullmq_1.Queue(queueName, {
                connection: (0, redis_1.getRedisConnection)(),
                defaultJobOptions,
            });
        }
        return queue;
    }
    async function addJob(jobId) {
        const q = getQueue();
        const job = await q.add(jobName, { jobId });
        return job.id ?? "";
    }
    function startWorker() {
        if (worker)
            return;
        const connection = (0, redis_1.getRedisConnection)();
        const jobService = getJobService();
        const userService = new userService_1.UserService();
        worker = new bullmq_1.Worker(queueName, async (job) => {
            const { jobId } = job.data;
            const record = (await jobService.getById(jobId));
            if (!record) {
                throw new Error(`Job no encontrado: ${jobId}`);
            }
            if (filterRecord && !filterRecord(record)) {
                return;
            }
            if (record.status !== "queued") {
                return;
            }
            await jobService.setStatus(jobId, "processing");
            try {
                const extractedData = await processJob(record);
                await jobService.setStatus(jobId, "completed", {
                    extracted_data: extractedData,
                });
                const filename = record.document_filename ?? "documento";
                const content = buildNotificationContent(record, filename);
                if (content) {
                    const authUserId = await userService.getAuthUserIdByAppId(record.user_id);
                    if (authUserId) {
                        notificationBus_1.NotificationBus.getInstance().emit(notificationBus_2.NotificationEvents.NOTIFICATION_CREATED, {
                            user_id: authUserId,
                            socket_emit_user_id: authUserId, // Pasamos el AuthId directamente para el socket
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
            }
            catch (err) {
                const message = err instanceof Error ? err.message : "Error desconocido";
                await jobService.setStatus(jobId, "failed", {
                    error_message: message,
                });
                // Notificar error si hay constructor de contenido para ello
                if (buildErrorNotificationContent) {
                    const filename = record.document_filename ?? "documento";
                    const content = buildErrorNotificationContent(record, filename, message);
                    if (content) {
                        const authUserId = await userService.getAuthUserIdByAppId(record.user_id);
                        if (authUserId) {
                            notificationBus_1.NotificationBus.getInstance().emit(notificationBus_2.NotificationEvents.NOTIFICATION_CREATED, {
                                user_id: authUserId,
                                socket_emit_user_id: authUserId, // Ahora pasamos el AuthId directamente
                                building_id: record.building_id,
                                type: content.type,
                                title: content.title,
                                message: content.message,
                                expiration: null,
                                priority: 0, // Se mantiene en 0 por requerimiento del usuario
                                metadata: content.metadata,
                            });
                        }
                    }
                }
                throw err;
            }
        }, { connection, concurrency });
        worker.on("completed", (job) => {
            const id = job?.data?.jobId ?? job?.id;
            console.log(`[${logLabel}] Job ${id} completado`);
        });
        worker.on("failed", (job, err) => {
            const id = job?.data?.jobId ?? job?.id;
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[${logLabel}] Job ${id} falló:`, message);
        });
        worker.on("error", (err) => {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[${logLabel}] Error en worker:`, message);
        });
        console.log(`[${logLabel}] Worker iniciado`);
    }
    async function close() {
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
//# sourceMappingURL=processingQueueFactory.js.map
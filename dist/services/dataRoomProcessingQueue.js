"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDataRoomProcessingJob = addDataRoomProcessingJob;
exports.startDataRoomProcessingWorker = startDataRoomProcessingWorker;
exports.closeDataRoomProcessingQueue = closeDataRoomProcessingQueue;
const dataRoomProcessingJobService_1 = require("../domain/services/dataRoomProcessingJobService");
const dataRoomService_1 = require("../domain/services/dataRoomService");
const notification_1 = require("../types/notification");
const processingQueueFactory_1 = require("../lib/processingQueueFactory");
const dataRoomLabels_1 = require("../utils/dataRoomLabels");
const dataRoomJobService = new dataRoomProcessingJobService_1.DataRoomProcessingJobService();
const dataRoomService = new dataRoomService_1.DataRoomService();
/**
 * Simulación de retraso para el procesamiento.
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const dataRoomQueue = (0, processingQueueFactory_1.createProcessingQueue)({
    queueName: 'data-room-processing',
    jobName: 'process-data-room-file',
    logLabel: 'DataRoomQueue',
    getJobService: () => dataRoomJobService,
    processJob: async (record) => {
        // 1. Marcar como procesamiento en la auditoría para que el front lo vea
        await dataRoomService.updateAuditStatus(record.building_id, record.checklist_id, 'processing');
        console.log(`[DataRoomQueue] Iniciando simulación de 5 segundos para job: ${record.id}`);
        // 2. Simular retraso de 5 segundos solicitado por el usuario
        await delay(5000);
        // 4. Marcar como verificado en la auditoría
        await dataRoomService.updateAuditStatus(record.building_id, record.checklist_id, 'verified');
        // 5. Confirmamos que el proceso ha terminado exitosamente
        console.log(`[DataRoomQueue] Simulación finalizada para job: ${record.id}`);
        return {
            success: true,
            message: 'Procesamiento simulado completado',
            file_name: record.file_name
        };
    },
    buildNotificationContent: (record, filename) => {
        const label = (0, dataRoomLabels_1.getDataRoomLabel)(record.checklist_id);
        return {
            type: notification_1.NotificationType.CERTIFICATE,
            title: 'Documento verificado',
            message: `El documento ${label} ha sido procesado y verificado correctamente.`,
            metadata: { building_id: record.building_id, checklist_id: record.checklist_id },
        };
    },
    buildErrorNotificationContent: (record, filename, error) => {
        const label = (0, dataRoomLabels_1.getDataRoomLabel)(record.checklist_id);
        return {
            type: notification_1.NotificationType.CERTIFICATE,
            title: 'Documento rechazado',
            message: `El documento ${label} no ha podido ser verificado y ha sido rechazado.`,
            metadata: { building_id: record.building_id, checklist_id: record.checklist_id, error },
        };
    },
    concurrency: 1, // Procesar uno por uno para mayor visibilidad de la cola
});
/**
 * Añade un job de procesamiento de Data Room a la cola.
 */
async function addDataRoomProcessingJob(jobId) {
    return dataRoomQueue.addJob(jobId);
}
/**
 * Inicia el worker de la cola Data Room.
 */
function startDataRoomProcessingWorker() {
    dataRoomQueue.startWorker();
}
/**
 * Cierra la cola y el worker (graceful shutdown).
 */
async function closeDataRoomProcessingQueue() {
    await dataRoomQueue.close();
}
//# sourceMappingURL=dataRoomProcessingQueue.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDataRoomProcessingJob = addDataRoomProcessingJob;
exports.startDataRoomProcessingWorker = startDataRoomProcessingWorker;
exports.closeDataRoomProcessingQueue = closeDataRoomProcessingQueue;
const dataRoomProcessingJobService_1 = require("../domain/services/dataRoomProcessingJobService");
const dataRoomService_1 = require("../domain/services/dataRoomService");
const notification_1 = require("../types/notification");
const processingQueueFactory_1 = require("../lib/processingQueueFactory");
const dataRoomJobService = new dataRoomProcessingJobService_1.DataRoomProcessingJobService();
const dataRoomService = new dataRoomService_1.DataRoomService();
/**
 * Simulación de retraso para el procesamiento.
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Contador global para simular el rechazo cada 3 documentos (testing).
 */
let uploadCounter = 0;
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
        // 3. Lógica de rechazo para testing (cada 3 cargas)
        uploadCounter++;
        if (uploadCounter % 3 === 0) {
            console.log(`[DataRoomQueue] Job ${record.id} RECHAZADO automáticamente por simulación.`);
            // Actualizar auditoría a rechazado
            await dataRoomService.updateAuditStatus(record.building_id, record.checklist_id, 'rejected');
            // Seteamos el estado del job manualmente a 'rejected' antes de lanzar el error
            await dataRoomJobService.setStatus(record.id, 'rejected', {
                error_message: 'El documento ha sido rechazado automáticamente para fines de test.'
            });
            throw new Error('REJECTED_SIMULATION');
        }
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
    buildNotificationContent: (record, filename) => ({
        type: notification_1.NotificationType.CERTIFICATE,
        title: 'Documento procesado',
        message: `El documento ${filename} del Data Room ha sido procesado exitosamente.`,
        metadata: { building_id: record.building_id, checklist_id: record.checklist_id },
    }),
    buildErrorNotificationContent: (record, filename, error) => ({
        type: notification_1.NotificationType.CERTIFICATE, // O un tipo específico de ERROR si existe
        title: 'Documento rechazado',
        message: `El documento ${filename} ha sido rechazado: ${error === 'REJECTED_SIMULATION' ? 'Revisión automática fallida' : error}`,
        metadata: { building_id: record.building_id, checklist_id: record.checklist_id, error },
    }),
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
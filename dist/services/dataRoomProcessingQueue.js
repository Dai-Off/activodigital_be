"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDataRoomQueue = exports.startDataRoomProcessingWorker = exports.addDataRoomProcessingJob = void 0;
const dataRoomProcessingJobService_1 = require("../domain/services/dataRoomProcessingJobService");
const dataRoomService_1 = require("../domain/services/dataRoomService");
const n8nDataRoomService_1 = require("../domain/services/n8nDataRoomService");
const notification_1 = require("../types/notification");
const processingQueueFactory_1 = require("../lib/processingQueueFactory");
const dataRoomLabels_1 = require("../utils/dataRoomLabels");
const AUTO_CHECKLIST_ID = "__auto__";
const dataRoomJobService = new dataRoomProcessingJobService_1.DataRoomProcessingJobService();
const dataRoomService = new dataRoomService_1.DataRoomService();
const n8nService = new n8nDataRoomService_1.N8nDataRoomService();
const dataRoomQueue = (0, processingQueueFactory_1.createProcessingQueue)({
    queueName: "data-room-processing",
    jobName: "process-data-room-file",
    logLabel: "DataRoomQueue",
    getJobService: () => dataRoomJobService,
    processJob: async (record) => {
        const isAuto = record.checklist_id === AUTO_CHECKLIST_ID;
        // 1. Marcar como procesamiento en auditoría (solo si ya existe registro)
        if (!isAuto) {
            await dataRoomService.updateAuditStatus(record.building_id, record.checklist_id, "processing");
        }
        console.log(`[DataRoomQueue] Enviando documento a n8n para validación IA: ${record.file_name} (job: ${record.id}, auto: ${isAuto})`);
        // 2. Enviar al webhook n8n para validación con IA
        let result;
        try {
            result = await n8nService.processDocument(record);
        }
        catch (err) {
            // Marcar auditoría como rechazada antes de relanzar (solo si tiene registro)
            if (!isAuto) {
                await dataRoomService.updateAuditStatus(record.building_id, record.checklist_id, "rejected");
            }
            throw err;
        }
        // 3. Determinar el checklistId final
        const finalChecklistId = isAuto
            ? result.detected_document_type || AUTO_CHECKLIST_ID
            : record.checklist_id;
        // 4. Crear/actualizar auditoría con datos extraídos
        if (isAuto) {
            // Flujo auto: crear registro de auditoría con el tipo detectado
            await dataRoomService.createOrUpdateAudit(record.building_id, finalChecklistId, record.temp_storage_path, record.file_name, "verified", result.datos_extraidos ?? null);
            // Actualizar el job con el checklistId real
            await dataRoomJobService.setChecklistId(record.id, finalChecklistId);
        }
        else {
            // Flujo normal: actualizar registro existente
            await dataRoomService.updateAuditStatus(record.building_id, record.checklist_id, "verified", result.datos_extraidos ?? null);
        }
        console.log(`[DataRoomQueue] Documento validado por n8n: ${record.file_name} (confidence: ${result.confidence}, tipo: ${finalChecklistId})`);
        return {
            success: true,
            message: "Documento validado por IA",
            file_name: record.file_name,
            confidence: result.confidence,
            detected_type: result.detected_document_type,
            datos_extraidos: result.datos_extraidos,
        };
    },
    buildNotificationContent: (record, filename) => {
        const checklistId = record.checklist_id;
        const label = checklistId === AUTO_CHECKLIST_ID
            ? record.file_name
            : (0, dataRoomLabels_1.getDataRoomLabel)(checklistId);
        return {
            type: notification_1.NotificationType.CERTIFICATE,
            title: `${label} ha sido verificado`,
            message: `El documento ${label} ha sido procesado y verificado correctamente.`,
            metadata: {
                building_id: record.building_id,
                checklist_id: checklistId,
            },
        };
    },
    buildErrorNotificationContent: (record, filename, error) => {
        const checklistId = record.checklist_id;
        const label = checklistId === AUTO_CHECKLIST_ID
            ? record.file_name
            : (0, dataRoomLabels_1.getDataRoomLabel)(checklistId);
        return {
            type: notification_1.NotificationType.CERTIFICATE,
            title: `${label} ha sido rechazado`,
            message: `El documento ${label} no ha podido ser verificado y ha sido rechazado.`,
            metadata: {
                building_id: record.building_id,
                checklist_id: checklistId,
                error,
            },
        };
    },
    concurrency: 1,
});
/**
 * Añade un job de procesamiento de Data Room a la cola.
 */
const addDataRoomProcessingJob = (jobId) => dataRoomQueue.addJob(jobId);
exports.addDataRoomProcessingJob = addDataRoomProcessingJob;
/**
 * Inicia el worker de procesamiento de Data Room.
 */
const startDataRoomProcessingWorker = () => dataRoomQueue.startWorker();
exports.startDataRoomProcessingWorker = startDataRoomProcessingWorker;
/**
 * Cierra la cola de procesamiento.
 */
const closeDataRoomQueue = () => dataRoomQueue.close();
exports.closeDataRoomQueue = closeDataRoomQueue;
//# sourceMappingURL=dataRoomProcessingQueue.js.map
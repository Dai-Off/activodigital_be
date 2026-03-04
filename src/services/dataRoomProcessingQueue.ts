import { DataRoomProcessingJobService } from "../domain/services/dataRoomProcessingJobService";
import { DataRoomService } from "../domain/services/dataRoomService";
import { N8nDataRoomService } from "../domain/services/n8nDataRoomService";
import { NotificationType } from "../types/notification";
import type { DataRoomProcessingJob } from "../types/dataRoomProcessingJob";
import { createProcessingQueue } from "../lib/processingQueueFactory";
import { getDataRoomLabel } from "../utils/dataRoomLabels";

const AUTO_CHECKLIST_ID = "__auto__";

const dataRoomJobService = new DataRoomProcessingJobService();
const dataRoomService = new DataRoomService();
const n8nService = new N8nDataRoomService();

const dataRoomQueue = createProcessingQueue<DataRoomProcessingJob>({
  queueName: "data-room-processing",
  jobName: "process-data-room-file",
  logLabel: "DataRoomQueue",
  getJobService: () => dataRoomJobService,
  processJob: async (record) => {
    const isAuto = record.checklist_id === AUTO_CHECKLIST_ID;

    // 1. Marcar como procesamiento en auditoría (solo si ya existe registro)
    if (!isAuto) {
      await dataRoomService.updateAuditStatus(
        record.building_id,
        record.checklist_id,
        "processing",
      );
    }

    console.log(
      `[DataRoomQueue] Enviando documento a n8n para validación IA: ${record.file_name} (job: ${record.id}, auto: ${isAuto})`,
    );

    // 2. Enviar al webhook n8n para validación con IA
    let result;
    try {
      result = await n8nService.processDocument(record);
    } catch (err) {
      // Marcar auditoría como rechazada antes de relanzar (solo si tiene registro)
      if (!isAuto) {
        await dataRoomService.updateAuditStatus(
          record.building_id,
          record.checklist_id,
          "rejected",
        );
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
      await dataRoomService.createOrUpdateAudit(
        record.building_id,
        finalChecklistId,
        record.temp_storage_path,
        record.file_name,
        "verified",
        result.datos_extraidos ?? null,
      );
      // Actualizar el job con el checklistId real
      await dataRoomJobService.setChecklistId(record.id, finalChecklistId);
    } else {
      // Flujo normal: actualizar registro existente
      await dataRoomService.updateAuditStatus(
        record.building_id,
        record.checklist_id,
        "verified",
        result.datos_extraidos ?? null,
      );
    }

    console.log(
      `[DataRoomQueue] Documento validado por n8n: ${record.file_name} (confidence: ${result.confidence}, tipo: ${finalChecklistId})`,
    );
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
    const label =
      checklistId === AUTO_CHECKLIST_ID
        ? record.file_name
        : getDataRoomLabel(checklistId);
    return {
      type: NotificationType.CERTIFICATE,
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
    const label =
      checklistId === AUTO_CHECKLIST_ID
        ? record.file_name
        : getDataRoomLabel(checklistId);
    return {
      type: NotificationType.CERTIFICATE,
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
export const addDataRoomProcessingJob = (jobId: string) =>
  dataRoomQueue.addJob(jobId);

/**
 * Inicia el worker de procesamiento de Data Room.
 */
export const startDataRoomProcessingWorker = () => dataRoomQueue.startWorker();

/**
 * Cierra la cola de procesamiento.
 */
export const closeDataRoomQueue = () => dataRoomQueue.close();

import { DataRoomProcessingJobService } from '../domain/services/dataRoomProcessingJobService';
import { DataRoomService } from '../domain/services/dataRoomService';
import { NotificationType } from '../types/notification';
import type { DataRoomProcessingJob } from '../types/dataRoomProcessingJob';
import { createProcessingQueue } from '../lib/processingQueueFactory';
import { getDataRoomLabel } from '../utils/dataRoomLabels';

const dataRoomJobService = new DataRoomProcessingJobService();
const dataRoomService = new DataRoomService();

/**
 * Simulación de retraso para el procesamiento.
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


const dataRoomQueue = createProcessingQueue<DataRoomProcessingJob>({
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
    const label = getDataRoomLabel(record.checklist_id);
    return {
      type: NotificationType.CERTIFICATE,
      title: `${label} ha sido verificado`,
      message: `El documento ${label} ha sido procesado y verificado correctamente.`,
      metadata: { building_id: record.building_id, checklist_id: record.checklist_id },
    };
  },
  buildErrorNotificationContent: (record, filename, error) => {
    const label = getDataRoomLabel(record.checklist_id);
    return {
      type: NotificationType.CERTIFICATE,
      title: `${label} ha sido rechazado`,
      message: `El documento ${label} no ha podido ser verificado y ha sido rechazado.`,
      metadata: { building_id: record.building_id, checklist_id: record.checklist_id, error },
    };
  },
  concurrency: 1, // Procesar uno por uno para mayor visibilidad de la cola
});

/**
 * Añade un job de procesamiento de Data Room a la cola.
 */
export const addDataRoomProcessingJob = (jobId: string) => dataRoomQueue.addJob(jobId);

/**
 * Inicia el worker de procesamiento de Data Room.
 */
export const startDataRoomProcessingWorker = () => dataRoomQueue.startWorker();

/**
 * Cierra la cola de procesamiento.
 */
export const closeDataRoomQueue = () => dataRoomQueue.close();

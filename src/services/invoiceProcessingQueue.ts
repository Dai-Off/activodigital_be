import { InvoiceProcessingJobService } from '../domain/services/invoiceProcessingJobService';
import { AIProcessingService } from '../domain/services/aiProcessingService';
import { NotificationType } from '../types/notification';
import type { InvoiceProcessingJob } from '../types/invoiceProcessingJob';
import { createProcessingQueue } from '../lib/processingQueueFactory';

const invoiceJobService = new InvoiceProcessingJobService();
const aiService = new AIProcessingService();

const invoiceQueue = createProcessingQueue<InvoiceProcessingJob>({
  queueName: 'invoice-processing',
  jobName: 'extract-invoice',
  logLabel: 'InvoiceQueue',
  getJobService: () => invoiceJobService,
  filterRecord: (record) => !record.job_type || record.job_type === 'invoice',
  processJob: async (record) => {
    const response = await fetch(record.document_url, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Error al descargar documento: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extractedData = await aiService.extractInvoiceData(buffer);
    return extractedData as Record<string, unknown>;
  },
  buildNotificationContent: (record, filename) => ({
    type: NotificationType.FINANCIAL,
    title: 'Factura procesada',
    message: `El documento ${filename} ya ha sido procesado. Ve a Gestión de documentos para revisar y registrar la factura.`,
    metadata: { jobId: record.id, document_filename: filename },
  }),
  concurrency: 2,
});

/**
 * Añade un job de procesamiento de factura a la cola.
 * Retorna el jobId de BullMQ (no el UUID de la tabla).
 */
export async function addInvoiceProcessingJob(jobId: string): Promise<string> {
  return invoiceQueue.addJob(jobId);
}

/**
 * Inicia el worker que procesa la cola (llamar al arrancar el servidor).
 * Requiere REDIS_URL en .env (ej: redis://localhost:6379).
 */
export function startInvoiceProcessingWorker(): void {
  invoiceQueue.startWorker();
}

/**
 * Cierra la cola y el worker (graceful shutdown).
 */
export async function closeInvoiceProcessingQueue(): Promise<void> {
  await invoiceQueue.close();
}

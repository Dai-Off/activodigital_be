"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addInvoiceProcessingJob = addInvoiceProcessingJob;
exports.startInvoiceProcessingWorker = startInvoiceProcessingWorker;
exports.closeInvoiceProcessingQueue = closeInvoiceProcessingQueue;
const invoiceProcessingJobService_1 = require("../domain/services/invoiceProcessingJobService");
const aiProcessingService_1 = require("../domain/services/aiProcessingService");
const notification_1 = require("../types/notification");
const processingQueueFactory_1 = require("../lib/processingQueueFactory");
const invoiceJobService = new invoiceProcessingJobService_1.InvoiceProcessingJobService();
const aiService = new aiProcessingService_1.AIProcessingService();
const invoiceQueue = (0, processingQueueFactory_1.createProcessingQueue)({
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
        return extractedData;
    },
    buildNotificationContent: (record, filename) => ({
        type: notification_1.NotificationType.FINANCIAL,
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
async function addInvoiceProcessingJob(jobId) {
    return invoiceQueue.addJob(jobId);
}
/**
 * Inicia el worker que procesa la cola (llamar al arrancar el servidor).
 * Requiere REDIS_URL en .env (ej: redis://localhost:6379).
 */
function startInvoiceProcessingWorker() {
    invoiceQueue.startWorker();
}
/**
 * Cierra la cola y el worker (graceful shutdown).
 */
async function closeInvoiceProcessingQueue() {
    await invoiceQueue.close();
}
//# sourceMappingURL=invoiceProcessingQueue.js.map
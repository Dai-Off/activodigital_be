"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCertificateProcessingJob = addCertificateProcessingJob;
exports.startCertificateProcessingWorker = startCertificateProcessingWorker;
exports.closeCertificateProcessingQueue = closeCertificateProcessingQueue;
const certificateProcessingJobService_1 = require("../domain/services/certificateProcessingJobService");
const notification_1 = require("../types/notification");
const processingQueueFactory_1 = require("../lib/processingQueueFactory");
const CERTIFICATE_EXTRACTOR_URL = process.env.CERTIFICATE_EXTRACTOR_URL || 'https://energy-certificate-extractor.fly.dev';
const certificateJobService = new certificateProcessingJobService_1.CertificateProcessingJobService();
const certificateQueue = (0, processingQueueFactory_1.createProcessingQueue)({
    queueName: 'certificate-processing',
    jobName: 'extract-certificate',
    logLabel: 'CertificateQueue',
    getJobService: () => certificateJobService,
    processJob: async (record) => {
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
        const extractedData = json && typeof json === 'object' && json.success && json.data ? json.data : json;
        return extractedData;
    },
    buildNotificationContent: (record, filename) => ({
        type: notification_1.NotificationType.CERTIFICATE,
        title: 'Certificado energético procesado',
        message: `El certificado ${filename} ya ha sido procesado. Ve a Gestión de documentos para revisar y guardar.`,
        metadata: { certificateJobId: record.id, document_filename: filename },
    }),
    concurrency: 2,
});
/**
 * Añade un job de procesamiento de certificado a la cola.
 * Retorna el jobId de BullMQ (no el UUID de la tabla).
 */
async function addCertificateProcessingJob(jobId) {
    return certificateQueue.addJob(jobId);
}
/**
 * Inicia el worker que procesa la cola (llamar al arrancar el servidor).
 * Requiere REDIS_URL en .env. Opcional: CERTIFICATE_EXTRACTOR_URL.
 */
function startCertificateProcessingWorker() {
    certificateQueue.startWorker();
}
/**
 * Cierra la cola y el worker (graceful shutdown).
 */
async function closeCertificateProcessingQueue() {
    await certificateQueue.close();
}
//# sourceMappingURL=certificateProcessingQueue.js.map
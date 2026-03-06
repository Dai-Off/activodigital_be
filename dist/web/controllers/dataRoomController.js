"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataRoomController = void 0;
const dataRoomService_1 = require("../../domain/services/dataRoomService");
const dataRoomProcessingJobService_1 = require("../../domain/services/dataRoomProcessingJobService");
const dataRoomProcessingQueue_1 = require("../../services/dataRoomProcessingQueue");
const userService_1 = require("../../domain/services/userService");
class DataRoomController {
    constructor() {
        this.service = new dataRoomService_1.DataRoomService();
        this.jobService = new dataRoomProcessingJobService_1.DataRoomProcessingJobService();
        this.userService = new userService_1.UserService();
        this.uploadFile = async (req, res) => {
            try {
                const { buildingId, checklistId } = req.body;
                if (!buildingId || !checklistId) {
                    return res.status(400).json({
                        error: "Faltan parámetros requeridos: buildingId o checklistId",
                    });
                }
                if (!req.file) {
                    return res
                        .status(400)
                        .json({ error: "No se ha proporcionado ningún archivo" });
                }
                const data = await this.service.uploadAndRecord(buildingId, checklistId, req.file);
                res.status(201).json({
                    success: true,
                    message: "Archivo subido y registrado exitosamente",
                    data,
                });
            }
            catch (error) {
                console.error("Error en uploadFile controller:", error);
                res.status(500).json({
                    error: "Error interno al procesar la subida",
                    details: error.message,
                });
            }
        };
        this.uploadFileAsync = async (req, res) => {
            try {
                const { buildingId, checklistId } = req.body;
                const authUserId = req.user?.id;
                if (!buildingId || !checklistId) {
                    return res.status(400).json({
                        error: "Faltan parámetros requeridos: buildingId o checklistId",
                    });
                }
                if (!req.file) {
                    return res
                        .status(400)
                        .json({ error: "No se ha proporcionado ningún archivo" });
                }
                if (!authUserId) {
                    return res.status(401).json({ error: "Usuario no autenticado" });
                }
                const user = await this.userService.getUserByAuthId(authUserId);
                if (!user) {
                    return res.status(401).json({ error: "Usuario no encontrado" });
                }
                const data = await this.service.uploadAndRecord(buildingId, checklistId, req.file);
                const job = await this.jobService.create({
                    user_id: user.id,
                    building_id: buildingId,
                    checklist_id: checklistId,
                    temp_storage_path: data.storage_path,
                    file_name: req.file.originalname,
                    mime_type: req.file.mimetype,
                });
                await (0, dataRoomProcessingQueue_1.addDataRoomProcessingJob)(job.id);
                res.status(202).json({
                    success: true,
                    message: "Archivo encolado para validación con IA",
                    jobId: job.id,
                    data,
                });
            }
            catch (error) {
                console.error("Error en uploadFileAsync controller:", error);
                res.status(500).json({
                    error: "Error interno al encolar la subida",
                    details: error.message,
                });
            }
        };
        this.getJobStatus = async (req, res) => {
            try {
                const { jobId } = req.params;
                const job = await this.jobService.getById(jobId);
                if (!job) {
                    return res.status(404).json({ error: "Job no encontrado" });
                }
                res.json({
                    success: true,
                    data: {
                        id: job.id,
                        status: job.status,
                        updated_at: job.updated_at,
                        error_message: job.error_message,
                    },
                });
            }
            catch (error) {
                console.error("Error en getJobStatus controller:", error);
                res.status(500).json({
                    error: "Error interno al obtener estado del job",
                    details: error.message,
                });
            }
        };
        this.getAuditStatus = async (req, res) => {
            try {
                const { buildingId } = req.params;
                if (!buildingId) {
                    return res.status(400).json({ error: "buildingId es requerido" });
                }
                const data = await this.service.getAuditStatus(buildingId);
                res.json({
                    success: true,
                    data,
                });
            }
            catch (error) {
                console.error("Error en getAuditStatus controller:", error);
                res.status(500).json({
                    error: "Error interno al obtener el estado de auditoría",
                    details: error.message,
                });
            }
        };
        this.getDossier = async (req, res) => {
            try {
                const { buildingId } = req.params;
                if (!buildingId) {
                    return res.status(400).json({ error: "buildingId es requerido" });
                }
                const pdfBuffer = await this.service.generateDossier(buildingId);
                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", `attachment; filename="dossier_${buildingId}.pdf"`);
                res.setHeader("Content-Length", pdfBuffer.length);
                res.send(pdfBuffer);
            }
            catch (error) {
                console.error("Error generando dossier PDF:", error);
                res.status(error.message.includes("No hay documentos") ? 404 : 500).json({
                    error: error.message || "Error interno al generar el dossier",
                });
            }
        };
        /**
         * Devuelve los jobs de procesamiento de un edificio (para la lista de batch uploads).
         */
        this.getBatchJobs = async (req, res) => {
            try {
                const { buildingId } = req.params;
                if (!buildingId) {
                    return res.status(400).json({ error: "buildingId es requerido" });
                }
                const jobs = await this.jobService.getByBuildingId(buildingId);
                res.json({
                    success: true,
                    data: jobs.map((j) => ({
                        id: j.id,
                        fileName: j.file_name,
                        status: j.status,
                        checklistId: j.checklist_id,
                        errorMessage: j.error_message,
                        createdAt: j.created_at,
                        updatedAt: j.updated_at,
                    })),
                });
            }
            catch (error) {
                console.error("Error en getBatchJobs controller:", error);
                res.status(500).json({
                    error: "Error al obtener jobs del edificio",
                    details: error.message,
                });
            }
        };
        /**
         * Sube hasta 5 archivos sin checklistId. La IA los clasifica automáticamente.
         */
        this.uploadFileBatch = async (req, res) => {
            try {
                const { buildingId } = req.body;
                const authUserId = req.user?.id;
                const files = req.files;
                if (!buildingId) {
                    return res
                        .status(400)
                        .json({ error: "Falta parámetro requerido: buildingId" });
                }
                if (!files || files.length === 0) {
                    return res
                        .status(400)
                        .json({ error: "No se han proporcionado archivos" });
                }
                if (files.length > 5) {
                    return res.status(400).json({ error: "Máximo 5 archivos por lote" });
                }
                if (!authUserId) {
                    return res.status(401).json({ error: "Usuario no autenticado" });
                }
                const user = await this.userService.getUserByAuthId(authUserId);
                if (!user) {
                    return res.status(401).json({ error: "Usuario no encontrado" });
                }
                const jobs = [];
                for (const file of files) {
                    // 1. Subir a Storage sin registro de auditoría
                    const storagePath = await this.service.uploadToStorageTemp(buildingId, file);
                    // 2. Crear job con checklist_id "__auto__" (la IA lo asignará)
                    const job = await this.jobService.create({
                        user_id: user.id,
                        building_id: buildingId,
                        checklist_id: "__auto__",
                        temp_storage_path: storagePath,
                        file_name: file.originalname,
                        mime_type: file.mimetype,
                    });
                    // 3. Encolar para procesamiento con IA
                    await (0, dataRoomProcessingQueue_1.addDataRoomProcessingJob)(job.id);
                    jobs.push({ jobId: job.id, fileName: file.originalname });
                }
                res.status(202).json({
                    success: true,
                    message: `${files.length} archivo(s) encolado(s) para clasificación con IA`,
                    jobs,
                });
            }
            catch (error) {
                console.error("Error en uploadFileBatch controller:", error);
                res.status(500).json({
                    error: "Error interno al encolar los archivos",
                    details: error.message,
                });
            }
        };
        /**
         * Clasifica manualmente un job asignándole un checklistId.
         */
        this.classifyJob = async (req, res) => {
            try {
                const { jobId, checklistId } = req.body;
                if (!jobId || !checklistId) {
                    return res.status(400).json({
                        error: "Faltan parámetros requeridos: jobId o checklistId",
                    });
                }
                const job = await this.jobService.getById(jobId);
                if (!job) {
                    return res.status(404).json({ error: "Job no encontrado" });
                }
                // IMPORTANTE: Si el job ya tenía un checklistId asignado (ya sea por IA o manual)
                // y lo estamos cambiando, debemos borrar el registro de auditoría previo para evitar duplicados.
                const oldChecklistId = job.checklist_id;
                if (oldChecklistId !== "__auto__" && oldChecklistId !== checklistId) {
                    await this.service.deleteAuditRecord(job.building_id, oldChecklistId);
                }
                // Actualizar el job con el checklistId manual
                await this.jobService.setChecklistId(jobId, checklistId);
                await this.jobService.setStatus(jobId, "completed");
                // Si el job original falló, el registro de auditoría debe reflejar que está rechazado/fallido
                // en la nueva categoría, no que está verificado automáticamente.
                const auditStatus = job.status === "failed" || job.status === "rejected"
                    ? "rejected"
                    : "verified";
                // Crear/actualizar registro de auditoría con el tipo asignado manualmente
                await this.service.createOrUpdateAudit(job.building_id, checklistId, job.temp_storage_path, job.file_name, auditStatus);
                res.json({
                    success: true,
                    message: "Documento clasificado manualmente",
                    data: { jobId, checklistId },
                });
            }
            catch (error) {
                console.error("Error en classifyJob controller:", error);
                res.status(500).json({
                    error: "Error al clasificar el documento",
                    details: error.message,
                });
            }
        };
    }
}
exports.DataRoomController = DataRoomController;
//# sourceMappingURL=dataRoomController.js.map
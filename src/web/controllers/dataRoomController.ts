import { Request, Response } from "express";
import { DataRoomService } from "../../domain/services/dataRoomService";
import { DataRoomProcessingJobService } from "../../domain/services/dataRoomProcessingJobService";
import { addDataRoomProcessingJob } from "../../services/dataRoomProcessingQueue";
import { UserService } from "../../domain/services/userService";

export class DataRoomController {
  private service = new DataRoomService();
  private jobService = new DataRoomProcessingJobService();
  private userService = new UserService();

  uploadFile = async (req: Request, res: Response) => {
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

      const data = await this.service.uploadAndRecord(
        buildingId,
        checklistId,
        req.file,
      );

      res.status(201).json({
        success: true,
        message: "Archivo subido y registrado exitosamente",
        data,
      });
    } catch (error: any) {
      console.error("Error en uploadFile controller:", error);
      res.status(500).json({
        error: "Error interno al procesar la subida",
        details: error.message,
      });
    }
  };

  uploadFileAsync = async (req: Request, res: Response) => {
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

      const data = await this.service.uploadAndRecord(
        buildingId,
        checklistId,
        req.file,
      );

      const job = await this.jobService.create({
        user_id: user.id,
        building_id: buildingId,
        checklist_id: checklistId,
        temp_storage_path: data.storage_path,
        file_name: req.file.originalname,
        mime_type: req.file.mimetype,
      });

      await addDataRoomProcessingJob(job.id);

      res.status(202).json({
        success: true,
        message: "Archivo encolado para validación con IA",
        jobId: job.id,
        data,
      });
    } catch (error: any) {
      console.error("Error en uploadFileAsync controller:", error);
      res.status(500).json({
        error: "Error interno al encolar la subida",
        details: error.message,
      });
    }
  };

  getJobStatus = async (req: Request, res: Response) => {
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
    } catch (error: any) {
      console.error("Error en getJobStatus controller:", error);
      res.status(500).json({
        error: "Error interno al obtener estado del job",
        details: error.message,
      });
    }
  };

  getAuditStatus = async (req: Request, res: Response) => {
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
    } catch (error: any) {
      console.error("Error en getAuditStatus controller:", error);
      res.status(500).json({
        error: "Error interno al obtener el estado de auditoría",
        details: error.message,
      });
    }
  };

  getDossier = async (req: Request, res: Response) => {
    try {
      const { buildingId } = req.params;

      if (!buildingId) {
        return res.status(400).json({ error: "buildingId es requerido" });
      }

      const pdfBuffer = await this.service.generateDossier(buildingId);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="dossier_${buildingId}.pdf"`,
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error generando dossier PDF:", error);
      res.status(error.message.includes("No hay documentos") ? 404 : 500).json({
        error: error.message || "Error interno al generar el dossier",
      });
    }
  };

  /**
   * Devuelve los jobs de procesamiento de un edificio (para la lista de batch uploads).
   */
  getBatchJobs = async (req: Request, res: Response) => {
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
    } catch (error: any) {
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
  uploadFileBatch = async (req: Request, res: Response) => {
    try {
      const { buildingId } = req.body;
      const authUserId = req.user?.id;
      const files = req.files as Express.Multer.File[] | undefined;

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
        const storagePath = await this.service.uploadToStorageTemp(
          buildingId,
          file,
        );

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
        await addDataRoomProcessingJob(job.id);
        jobs.push({ jobId: job.id, fileName: file.originalname });
      }

      res.status(202).json({
        success: true,
        message: `${files.length} archivo(s) encolado(s) para clasificación con IA`,
        jobs,
      });
    } catch (error: any) {
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
  classifyJob = async (req: Request, res: Response) => {
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

      // Actualizar el job con el checklistId manual
      await this.jobService.setChecklistId(jobId, checklistId);
      await this.jobService.setStatus(jobId, "completed");

      // Crear/actualizar registro de auditoría con el tipo asignado manualmente
      await this.service.createOrUpdateAudit(
        job.building_id,
        checklistId,
        job.temp_storage_path,
        job.file_name,
        "verified",
      );

      res.json({
        success: true,
        message: "Documento clasificado manualmente",
        data: { jobId, checklistId },
      });
    } catch (error: any) {
      console.error("Error en classifyJob controller:", error);
      res.status(500).json({
        error: "Error al clasificar el documento",
        details: error.message,
      });
    }
  };
}

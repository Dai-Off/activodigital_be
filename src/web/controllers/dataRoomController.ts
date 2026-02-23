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
        message: "Archivo encolado para procesamiento (simulando 5s)",
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
}

import { Request, Response } from "express";
import { AIProcessingService } from "../../domain/services/aiProcessingService";

export class AILicenciaDRController {
  private aiProcessingService = new AIProcessingService();

  extractLicenciaDRData = async (req: Request, res: Response): Promise<void> => {
    try {
      req.setTimeout(300_000); // 5 minutos de timeout
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No se ha proporcionado ningún archivo" });
        return;
      }

      if (req.file.mimetype !== "application/pdf") {
        res.status(400).json({
          error: "Formato de archivo no soportado. Debe ser un PDF.",
          supportedFormats: ["application/pdf"],
        });
        return;
      }

      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(req.file.buffer);
      const documentText = data?.text ?? "";

      if (!documentText) {
        res.status(400).json({ error: "El documento PDF está vacío o protegido." });
        return;
      }

      const extractedData = await this.aiProcessingService.extractLicenciaDRRequirements(documentText);
      res.status(200).json({ success: true, data: extractedData });
    } catch (error) {
      console.error("Error extractLicenciaDRData:", error);
      res.status(500).json({ error: "Error interno al extraer los requisitos" });
    }
  };

  extractLicenciaDRDoc = async (req: Request, res: Response): Promise<void> => {
    try {
      req.setTimeout(300_000); // 5 minutos de timeout
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No se ha proporcionado ningún archivo" });
        return;
      }

      const requirementName = req.body.requirementName || "Requisito general";

      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(req.file.buffer);
      const documentText = data?.text ?? "";

      if (!documentText) {
        res.status(400).json({ error: "El documento está vacío o protegido." });
        return;
      }

      const extractedData = await this.aiProcessingService.extractLicenciaDRDocData(documentText, requirementName);
      res.status(200).json({ success: true, data: extractedData });
    } catch (error) {
      console.error("Error extractLicenciaDRDoc:", error);
      res.status(500).json({ error: "Error interno al analizar el documento" });
    }
  };

  generateLicenciaDraft = async (req: Request, res: Response): Promise<void> => {
    try {
      req.setTimeout(300_000); // 5 minutos de timeout
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      const { buildingData, extractedData } = req.body;
      console.log(`[AILicenciaDRController] Generating draft. extractedData:`, JSON.stringify(extractedData));
      if (!buildingData) {
        res.status(400).json({ error: "Faltan datos del edificio" });
        return;
      }

      const pdfBuffer = await this.aiProcessingService.generateLicenciaDraft(buildingData, extractedData || {});

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=borrador_licencia_dr.pdf");
      res.setHeader("Content-Length", pdfBuffer.length.toString());
      
      res.status(200).send(pdfBuffer);
    } catch (error) {
      console.error("Error generateLicenciaDraft:", error);
      res.status(500).json({ error: "Error al generar el borrador en PDF" });
    }
  };
}

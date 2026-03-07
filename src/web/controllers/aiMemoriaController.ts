import { Request, Response } from "express";
import { AIProcessingService } from "../../domain/services/aiProcessingService";

export class AIMemoriaController {
  private aiProcessingService = new AIProcessingService();

  /**
   * Extrae datos de la Memoria de Calidades y devuelve el resultado.
   */
  extractMemoriaData = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      if (!req.file) {
        res
          .status(400)
          .json({ error: "No se ha proporcionado ningún archivo" });
        return;
      }

      if (req.file.mimetype !== "application/pdf") {
        res.status(400).json({
          error:
            "Formato de archivo no soportado. Para la Memoria de Calidades solo se acepta PDF.",
          supportedFormats: ["application/pdf"],
        });
        return;
      }

      // 1) Extraer texto del PDF
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(req.file.buffer);
      const documentText = data?.text ?? "";

      if (!documentText || documentText.trim().length < 100) {
        res.status(400).json({
          error:
            "El documento no contiene suficiente texto extraíble para ser analizado.",
        });
        return;
      }

      // 2) Procesar con IA
      const extractedData =
        await this.aiProcessingService.extractMemoriaCalidadesData(
          documentText,
        );

      res.status(200).json({
        success: true,
        data: extractedData,
      });
    } catch (error) {
      console.error("Error al extraer datos de memoria de calidades:", error);
      res.status(500).json({
        error: "Error al procesar la memoria de calidades",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };
}

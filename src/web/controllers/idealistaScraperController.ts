import { Request, Response } from "express";
import { ApifyService } from "../../domain/services/idealistaScraperService";
import { ScrapeIdealistaRequest } from "../../types/idealistaScraper";

export class ApifyController {
  private apifyService = new ApifyService();

  /**
   * Endpoint para iniciar un scraping de Idealista bajo demanda.
   * POST /api/apify/idealista
   */
  scrapeIdealista = async (req: Request, res: Response): Promise<void> => {
    try {
      // Casteamos el body
      const body = req.body as ScrapeIdealistaRequest;

      // Validación básica
      if (!body.searchUrl) {
        res.status(400).json({
          error: "Falta el campo obligatorio 'searchUrl'",
        });
        return;
      }

      // Validar que sea una URL de idealista (opcional pero recomendado)
      if (!body.searchUrl.includes("idealista.com")) {
        res.status(400).json({
          error: "La URL proporcionada no parece ser de Idealista",
        });
        return;
      }

      // Llamada al servicio
      const result = await this.apifyService.scrapeIdealistaProperties(body);

      res.status(200).json({
        message: "Scraping completado exitosamente",
        data: result,
      });
    } catch (error) {
      console.error("Error al ejecutar scraping:", error);
      res.status(500).json({
        error: "Error al procesar la solicitud de scraping",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };
}

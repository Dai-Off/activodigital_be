import { Request, Response } from "express";
import { ApifyService } from "../../domain/services/idealistaScraperService";
import { ScrapeIdealistaRequest } from "../../types/idealistaScraper";

export class ApifyController {
  private apifyService = new ApifyService();

  scrapeIdealista = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as ScrapeIdealistaRequest;

      if (!body.locationName) {
        res.status(400).json({
          error:
            "El campo 'locationName' es obligatorio para realizar la búsqueda.",
        });
        return;
      }

      const result = await this.apifyService.scrapeIdealistaProperties(body);

      res.status(200).json({
        message: "Scraping y análisis completado exitosamente",
        data: {
          location: body.locationName,
          totalItems: result.totalItems,
          averagePrice: result.averagePrice,
          averagePricePerSqm: result.averagePricePerSqm,
          items: result.items,
        },
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

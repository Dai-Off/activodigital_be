"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApifyController = void 0;
const idealistaScraperService_1 = require("../../domain/services/idealistaScraperService");
class ApifyController {
    constructor() {
        this.apifyService = new idealistaScraperService_1.ApifyService();
        this.scrapeIdealista = async (req, res) => {
            try {
                const body = req.body;
                if (!body.locationName) {
                    res.status(400).json({
                        error: "El campo 'locationName' es obligatorio para realizar la búsqueda.",
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
            }
            catch (error) {
                console.error("Error al ejecutar scraping:", error);
                res.status(500).json({
                    error: "Error al procesar la solicitud de scraping",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
    }
}
exports.ApifyController = ApifyController;
//# sourceMappingURL=idealistaScraperController.js.map
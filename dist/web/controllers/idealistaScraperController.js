"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApifyController = void 0;
const idealistaScraperService_1 = require("../../domain/services/idealistaScraperService");
class ApifyController {
    constructor() {
        this.apifyService = new idealistaScraperService_1.ApifyService();
        /**
         * Endpoint para iniciar un scraping de Idealista bajo demanda.
         * POST /api/apify/idealista
         */
        this.scrapeIdealista = async (req, res) => {
            try {
                // Casteamos el body
                const body = req.body;
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
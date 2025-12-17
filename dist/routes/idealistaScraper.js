"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const idealistaScraperController_1 = require("../web/controllers/idealistaScraperController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const apifyController = new idealistaScraperController_1.ApifyController();
// Aplicar middleware de autenticación a todas las rutas de este router
// (Opcional: Si quieres que sea público, quita esta línea)
router.use(authMiddleware_1.authenticateToken);
/**
 * @route POST /apify/idealista
 * @desc Iniciar el scraper de Idealista para obtener propiedades
 * @access Private
 */
router.post("/idealista", apifyController.scrapeIdealista);
exports.default = router;
//# sourceMappingURL=idealistaScraper.js.map
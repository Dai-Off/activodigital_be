"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const idealistaScraperController_1 = require("../web/controllers/idealistaScraperController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const requestLogger_1 = require("../web/middlewares/requestLogger");
const router = (0, express_1.Router)();
const apifyController = new idealistaScraperController_1.ApifyController();
router.use(authMiddleware_1.requireAuth);
router.use(requestLogger_1.requestLogger);
/**
 * @route POST /apify/idealista
 * @desc Iniciar el scraper de Idealista para obtener propiedades
 * @access Private
 */
router.post("/idealista", apifyController.scrapeIdealista);
exports.default = router;
//# sourceMappingURL=idealistaScraper.js.map
import { Router } from "express";
import { ApifyController } from "../web/controllers/idealistaScraperController";
import { authenticateToken } from "../web/middlewares/authMiddleware";
import { requestLogger } from "../web/middlewares/requestLogger";

const router = Router();
const apifyController = new ApifyController();

router.use(requestLogger);
router.use(authenticateToken);

/**
 * @route POST /apify/idealista
 * @desc Iniciar el scraper de Idealista para obtener propiedades
 * @access Private
 */
router.post("/idealista", apifyController.scrapeIdealista);

export default router;

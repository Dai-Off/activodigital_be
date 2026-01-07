import { Router } from "express";
import { ApifyController } from "../web/controllers/idealistaScraperController";
import { requireAuth } from "../web/middlewares/authMiddleware";
import { requestLogger } from "../web/middlewares/requestLogger";

const router = Router();
const apifyController = new ApifyController();

router.use(requireAuth);
router.use(requestLogger);

/**
 * @route POST /apify/idealista
 * @desc Iniciar el scraper de Idealista para obtener propiedades
 * @access Private
 */
router.post("/idealista", apifyController.scrapeIdealista);

export default router;

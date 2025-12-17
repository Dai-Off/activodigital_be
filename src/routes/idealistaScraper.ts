import { Router } from "express";
import { ApifyController } from "../web/controllers/idealistaScraperController";
import { authenticateToken } from "../web/middlewares/authMiddleware";

const router = Router();
const apifyController = new ApifyController();

// Aplicar middleware de autenticación a todas las rutas de este router
// (Opcional: Si quieres que sea público, quita esta línea)
router.use(authenticateToken);

/**
 * @route POST /apify/idealista
 * @desc Iniciar el scraper de Idealista para obtener propiedades
 * @access Private
 */
router.post("/idealista", apifyController.scrapeIdealista);

export default router;

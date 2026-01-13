import { Router } from "express";
import { SupportController } from "../web/controllers/supportController";
import { optionalAuth } from "../web/middlewares/authMiddleware";

const router = Router();
const supportController = new SupportController();

/**
 * @route POST /api/support
 * @desc Crear un ticket de soporte (envía email a soporte@empresa.com)
 * @access Public (autenticación opcional pero recomendada)
 */
router.post("/", optionalAuth, supportController.createSupportTicket);

export default router;


import { Router } from 'express';
import { DashboardController } from '../web/controllers/dashboardController';
import { requireAuth } from '../web/middlewares/authMiddleware';
import { requestLogger } from '../web/middlewares/requestLogger';

const router = Router();
const dashboardController = new DashboardController();

/**
 * GET /dashboard/stats
 * Obtiene las estadísticas del dashboard para el usuario autenticado
 * Requiere autenticación
 */
router.use(requireAuth);
router.use(requestLogger);
router.get('/stats', dashboardController.getStats);

export default router;

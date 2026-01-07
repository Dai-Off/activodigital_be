import { Router } from 'express';
import { DashboardController } from '../web/controllers/dashboardController';
import { authenticateToken } from '../web/middlewares/authMiddleware';
import { requestLogger } from '../web/middlewares/requestLogger';

const router = Router();
const dashboardController = new DashboardController();

/**
 * GET /dashboard/stats
 * Obtiene las estadísticas del dashboard para el usuario autenticado
 * Requiere autenticación
 */
router.use(requestLogger);
router.get('/stats', authenticateToken, dashboardController.getStats);

export default router;

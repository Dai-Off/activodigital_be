import { Router } from 'express';
import { DashboardController } from '../web/controllers/dashboardController';
import { authenticateToken } from '../web/middlewares/authMiddleware';

const router = Router();
const dashboardController = new DashboardController();

/**
 * GET /dashboard/stats
 * Obtiene las estadísticas del dashboard para el usuario autenticado
 * Requiere autenticación
 */
router.get('/stats', authenticateToken, dashboardController.getStats);

export default router;

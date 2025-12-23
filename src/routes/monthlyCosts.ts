import { Router } from 'express';
import { MonthlyCostsController } from '../web/controllers/monthlyCostsController';
import { authenticateToken } from '../web/middlewares/authMiddleware';

const router = Router();
const monthlyCostsController = new MonthlyCostsController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// NOTA: Los costes mensuales se calculan automáticamente desde las facturas de servicios
// Solo endpoints de lectura (GET)
router.get('/building/:buildingId', monthlyCostsController.getMonthlyCosts);
router.get('/building/:buildingId/summary', monthlyCostsController.getMonthlyCostsSummary);
router.get('/:id', monthlyCostsController.getMonthlyCost);

export default router;



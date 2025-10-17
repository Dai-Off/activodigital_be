import { Router } from 'express';
import { authenticateToken } from '../web/middlewares/authMiddleware';
import { EsgController } from '../web/controllers/esgController';

const router = Router();
const controller = new EsgController();

router.use(authenticateToken);

// POST /esg/calculate - Calcula y guarda el ESG
router.post('/calculate', controller.calculate);

// GET /esg/building/:buildingId - Obtiene el ESG guardado
router.get('/building/:buildingId', controller.getStored);

// NOTA: El promedio de ESG se calcula automáticamente en el dashboard (DashboardService)
// No requiere endpoint adicional ya que el dashboard obtiene los scores directamente de la tabla esg_scores

export default router;



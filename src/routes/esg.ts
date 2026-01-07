import { Router } from 'express';
import { requireAuth } from '../web/middlewares/authMiddleware';
import { EsgController } from '../web/controllers/esgController';
import { requestLogger } from '../web/middlewares/requestLogger';

const router = Router();
const controller = new EsgController();

router.use(requireAuth);
router.use(requestLogger);

// POST /esg/calculate - Calcula y guarda el ESG
router.post('/calculate', controller.calculate);

// GET /esg/building/:buildingId - Obtiene el ESG guardado
router.get('/building/:buildingId', controller.getStored);

// NOTA: El promedio de ESG se calcula automáticamente en el dashboard (DashboardService)
// No requiere endpoint adicional ya que el dashboard obtiene los scores directamente de la tabla esg_scores

export default router;



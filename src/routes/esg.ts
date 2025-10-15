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

export default router;



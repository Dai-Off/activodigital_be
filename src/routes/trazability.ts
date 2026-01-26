import { Router } from 'express';
import { requireAuth } from '../web/middlewares/authMiddleware';
import {
 listTrazabilityControler
} from '../web/controllers/trazabilityController';
import { requestLogger } from '../web/middlewares/requestLogger';

const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);
router.use(requestLogger);

router.get('/list/:buildingId?', listTrazabilityControler);

export default router;

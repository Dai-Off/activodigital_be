import { Router } from 'express';
import { authenticateToken } from '../web/middlewares/authMiddleware';
import {
 listTrazabilityControler
} from '../web/controllers/trazabilityController';
import { requestLogger } from '../web/middlewares/requestLogger';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);
router.use(requestLogger);

router.get('/list', listTrazabilityControler);

export default router;

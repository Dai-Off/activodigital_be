import { Router } from 'express';
import { authenticateToken } from '../web/middlewares/authMiddleware';
import {
 listTrazabilityControler
} from '../web/controllers/trazabilityController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/list', listTrazabilityControler);

export default router;

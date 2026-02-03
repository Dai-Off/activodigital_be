import { Router } from 'express';
import { DocumentExpirationAlertController } from '../web/controllers/documentExpirationAlertController';
import { requireAuth } from '../web/middlewares/authMiddleware';
import { requestLogger } from '../web/middlewares/requestLogger';

const router = Router();

const documentExpirationAlertController = new DocumentExpirationAlertController();

// Todas las rutas requieren autenticación
router.use(requireAuth);
router.use(requestLogger);

// Obtener documentos próximos a vencer
router.get('/', documentExpirationAlertController.getExpiringDocuments);

// Buscar documentos próximos a vencer (próximos 7 días)
router.post('/find-soon', documentExpirationAlertController.findDocumentsExpiringSoon);

export default router;


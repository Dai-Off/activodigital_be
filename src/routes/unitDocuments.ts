import { Router } from 'express';
import { UnitDocumentController } from '../web/controllers/unitDocumentController';
import { requireAuth } from '../web/middlewares/authMiddleware';
import { requestLogger } from '../web/middlewares/requestLogger';

const router = Router();
const unitDocumentController = new UnitDocumentController();

// Todas las rutas requieren autenticación
router.use(requireAuth);
router.use(requestLogger);

// CRUD de unit documents
router.post('/', unitDocumentController.createUnitDocument);
router.get('/building/:buildingId/unit/:unitId', unitDocumentController.getUnitDocuments);
router.get('/:id', unitDocumentController.getUnitDocument);
router.put('/:id', unitDocumentController.updateUnitDocument);
router.delete('/:id', unitDocumentController.deleteUnitDocument);

export default router;


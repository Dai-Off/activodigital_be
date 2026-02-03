import { Router } from 'express';
import { BuildingDocumentController } from '../web/controllers/buildingDocumentController';
import { requireAuth } from '../web/middlewares/authMiddleware';
import { requestLogger } from '../web/middlewares/requestLogger';

const router = Router();
const buildingDocumentController = new BuildingDocumentController();

// Todas las rutas requieren autenticación
router.use(requireAuth);
router.use(requestLogger);

// CRUD de building documents
router.post('/', buildingDocumentController.createBuildingDocument);
router.get('/building/:buildingId', buildingDocumentController.getBuildingDocuments);
router.get('/:id', buildingDocumentController.getBuildingDocument);
router.put('/:id', buildingDocumentController.updateBuildingDocument);
router.delete('/:id', buildingDocumentController.deleteBuildingDocument);

export default router;


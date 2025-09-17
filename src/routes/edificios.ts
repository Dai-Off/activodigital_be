import { Router } from 'express';
import { BuildingController } from '../web/controllers/edificioController';
import { authenticateToken } from '../web/middlewares/authMiddleware';

const router = Router();
const buildingController = new BuildingController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// CRUD básico de edificios
router.post('/', buildingController.createBuilding);
router.get('/', buildingController.getBuildings);
router.get('/:id', buildingController.getBuilding);
router.put('/:id', buildingController.updateBuilding);

export default router;

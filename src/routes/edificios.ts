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

// Endpoints para gestión de imágenes
router.post('/:id/images', buildingController.uploadImages);
router.delete('/:id/images/:imageId', buildingController.deleteImage);
router.put('/:id/images/main', buildingController.setMainImage);

export default router;

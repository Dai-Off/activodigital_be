import { Router } from 'express';
import { DigitalBookController } from '../web/controllers/libroDigitalController';
import { authenticateToken } from '../web/middlewares/authMiddleware';

const router = Router();
const digitalBookController = new DigitalBookController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear libro digital (por edificio)
router.post('/', digitalBookController.createDigitalBook);

// Operaciones centradas en edificio y secciones
router.get('/building/:buildingId', digitalBookController.getBookByBuilding);
router.put('/:id/sections/:sectionType', digitalBookController.updateSection);

export default router;

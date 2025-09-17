import { Router } from 'express';
import { DigitalBookController } from '../web/controllers/libroDigitalController';
import { authenticateToken } from '../web/middlewares/authMiddleware';

const router = Router();
const digitalBookController = new DigitalBookController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// CRUD básico de libros digitales
router.post('/', digitalBookController.createDigitalBook);
router.get('/', digitalBookController.getBooks);
router.get('/:id', digitalBookController.getBook);
router.put('/:id', digitalBookController.updateBook);

// Operaciones específicas
router.get('/building/:buildingId', digitalBookController.getBookByBuilding);
router.put('/:id/sections/:sectionType', digitalBookController.updateSection);

export default router;

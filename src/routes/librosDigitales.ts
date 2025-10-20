import { Router } from 'express';
import { DigitalBookController } from '../web/controllers/libroDigitalController';
import { AIDigitalBookController } from '../web/controllers/aiDigitalBookController';
import { authenticateToken } from '../web/middlewares/authMiddleware';
import { upload } from '../web/middlewares/uploadMiddleware';

const router = Router();
const digitalBookController = new DigitalBookController();
const aiDigitalBookController = new AIDigitalBookController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// NUEVO: Crear libro digital mediante IA procesando un documento
// Timeout extendido para procesamiento con IA (hasta 90 segundos)
router.post('/upload-ai', (req, res, next) => {
  // Establecer timeout de 90 segundos para procesamiento con IA
  req.setTimeout(90000);
  res.setTimeout(90000);
  next();
}, upload.single('document'), aiDigitalBookController.uploadAndProcessDocument);

// Crear libro digital (por edificio) - carga manual
router.post('/', digitalBookController.createDigitalBook);

// Operaciones centradas en edificio y secciones
router.get('/building/:buildingId', digitalBookController.getBookByBuilding);
router.put('/:id/sections/:sectionType', digitalBookController.updateSection);

export default router;

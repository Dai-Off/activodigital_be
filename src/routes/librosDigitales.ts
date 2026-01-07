import { Router } from 'express';
import { DigitalBookController } from '../web/controllers/libroDigitalController';
import { AIDigitalBookController } from '../web/controllers/aiDigitalBookController';
import { requireAuth } from '../web/middlewares/authMiddleware';
import { upload } from '../web/middlewares/uploadMiddleware';
import { requestLogger } from '../web/middlewares/requestLogger';

const router = Router();
const digitalBookController = new DigitalBookController();
const aiDigitalBookController = new AIDigitalBookController();

router.use(requireAuth);
router.use(requestLogger);

router.post('/upload-ai', (req, res, next) => {
  req.setTimeout(90000);
  res.setTimeout(90000);
  next();
}, upload.single('document'), aiDigitalBookController.uploadAndProcessDocument);

router.post('/', digitalBookController.createDigitalBook);

router.get('/building/:buildingId', digitalBookController.getBookByBuilding);
router.put('/:id/sections/:sectionType', digitalBookController.updateSection);

export default router;

import { Router } from 'express';
import { authenticateToken } from '../web/middlewares/authMiddleware';
import { EsgController } from '../web/controllers/esgController';

const router = Router();
const controller = new EsgController();

router.use(authenticateToken);

// POST /esg/calculate
router.post('/calculate', controller.calculate);

export default router;



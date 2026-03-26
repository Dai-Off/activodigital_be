import { Router } from 'express';
import { getRegulatoryAuditController } from '../web/controllers/regulatoryAuditController';
import { requireAuth } from '../web/middlewares/authMiddleware';
import { requestLogger } from '../web/middlewares/requestLogger';

const router = Router();

router.use(requestLogger);
router.use(requireAuth);

router.get('/building/:buildingId', getRegulatoryAuditController);

export default router;

import { Router } from 'express';
import { ReportController } from '../web/controllers/reportController';
import { requireAuth } from '../web/middlewares/authMiddleware';
import { requestLogger } from '../web/middlewares/requestLogger';

const router = Router();
const reportController = new ReportController();

router.use(requestLogger);
router.use(requireAuth);

router.get('/fields', reportController.getReportableFields.bind(reportController));
router.get('/', reportController.getReports.bind(reportController));
router.post('/', reportController.generateReport.bind(reportController));
router.delete('/:id', reportController.deleteReport.bind(reportController));

export default router;

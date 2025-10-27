import { Router } from 'express';
import { FinancialSnapshotController } from '../web/controllers/financialSnapshotController';
import { authenticateToken } from '../web/middlewares/authMiddleware';

const router = Router();
const financialSnapshotController = new FinancialSnapshotController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// CRUD de financial snapshots
router.post('/', financialSnapshotController.createFinancialSnapshot);
router.get('/building/:buildingId', financialSnapshotController.getFinancialSnapshots);
router.get('/:id', financialSnapshotController.getFinancialSnapshot);
router.put('/:id', financialSnapshotController.updateFinancialSnapshot);
router.delete('/:id', financialSnapshotController.deleteFinancialSnapshot);

export default router;


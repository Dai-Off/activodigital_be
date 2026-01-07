import { Router } from 'express';
import { ServiceInvoiceController } from '../web/controllers/serviceInvoiceController';
import { requireAuth } from '../web/middlewares/authMiddleware';
import { requestLogger } from '../web/middlewares/requestLogger';

const router = Router();
const serviceInvoiceController = new ServiceInvoiceController();

// Todas las rutas requieren autenticación
router.use(requireAuth);
router.use(requestLogger);

// CRUD de service invoices
router.post('/', serviceInvoiceController.createServiceInvoice);
router.get('/building/:buildingId', serviceInvoiceController.getServiceInvoices);
router.get('/:id', serviceInvoiceController.getServiceInvoice);
router.put('/:id', serviceInvoiceController.updateServiceInvoice);
router.delete('/:id', serviceInvoiceController.deleteServiceInvoice);

export default router;



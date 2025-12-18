import { Router } from 'express';
import { ServiceInvoiceController } from '../web/controllers/serviceInvoiceController';
import { authenticateToken } from '../web/middlewares/authMiddleware';

const router = Router();
const serviceInvoiceController = new ServiceInvoiceController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// CRUD de service invoices
router.post('/', serviceInvoiceController.createServiceInvoice);
router.get('/building/:buildingId', serviceInvoiceController.getServiceInvoices);
router.get('/:id', serviceInvoiceController.getServiceInvoice);
router.put('/:id', serviceInvoiceController.updateServiceInvoice);
router.delete('/:id', serviceInvoiceController.deleteServiceInvoice);

export default router;



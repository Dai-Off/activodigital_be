import { Router } from 'express';
import { RentController } from '../web/controllers/rentController';
import { authenticateToken } from '../web/middlewares/authMiddleware';

const router = Router();
const rentController = new RentController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ========== RESUMEN MENSUAL ==========
// GET /rents/building/:buildingId/summary/:month
// Obtiene el resumen de rentas del mes (facturado, cobrado, %, estados)
router.get('/building/:buildingId/summary/:month', rentController.getMonthlyRentSummary);

// ========== FACTURAS ==========
// GET /rents/building/:buildingId/invoices
// Obtiene todas las facturas de un edificio
router.get('/building/:buildingId/invoices', rentController.getRentInvoicesByBuilding);

// GET /rents/building/:buildingId/invoices/:month
// Obtiene las facturas de un mes específico
router.get('/building/:buildingId/invoices/:month', rentController.getRentInvoicesByMonth);

// POST /rents/invoices
// Crea una nueva factura
router.post('/invoices', rentController.createRentInvoice);

// GET /rents/invoices/:id
// Obtiene una factura específica con sus pagos
router.get('/invoices/:id', rentController.getRentInvoice);

// PUT /rents/invoices/:id
// Actualiza una factura
router.put('/invoices/:id', rentController.updateRentInvoice);

// DELETE /rents/invoices/:id
// Elimina una factura
router.delete('/invoices/:id', rentController.deleteRentInvoice);

export default router;


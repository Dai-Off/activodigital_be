"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rentController_1 = require("../web/controllers/rentController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const rentController = new rentController_1.RentController();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticateToken);
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
exports.default = router;
//# sourceMappingURL=rents.js.map
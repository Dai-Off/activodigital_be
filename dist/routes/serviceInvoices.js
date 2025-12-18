"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const serviceInvoiceController_1 = require("../web/controllers/serviceInvoiceController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const serviceInvoiceController = new serviceInvoiceController_1.ServiceInvoiceController();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticateToken);
// CRUD de service invoices
router.post('/', serviceInvoiceController.createServiceInvoice);
router.get('/building/:buildingId', serviceInvoiceController.getServiceInvoices);
router.get('/:id', serviceInvoiceController.getServiceInvoice);
router.put('/:id', serviceInvoiceController.updateServiceInvoice);
router.delete('/:id', serviceInvoiceController.deleteServiceInvoice);
exports.default = router;
//# sourceMappingURL=serviceInvoices.js.map
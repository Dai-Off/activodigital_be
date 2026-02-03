"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const financialSnapshotController_1 = require("../web/controllers/financialSnapshotController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const requestLogger_1 = require("../web/middlewares/requestLogger");
const router = (0, express_1.Router)();
const financialSnapshotController = new financialSnapshotController_1.FinancialSnapshotController();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.requireAuth);
router.use(requestLogger_1.requestLogger);
// CRUD de financial snapshots
router.post('/', financialSnapshotController.createFinancialSnapshot);
router.get('/', financialSnapshotController.getAllFinancialSnapshots);
router.get('/summary', financialSnapshotController.getAllFinancialSnapshotsSummary);
router.get('/building/:buildingId', financialSnapshotController.getFinancialSnapshots);
router.get('/:id', financialSnapshotController.getFinancialSnapshot);
router.put('/:id', financialSnapshotController.updateFinancialSnapshot);
router.delete('/:id', financialSnapshotController.deleteFinancialSnapshot);
exports.default = router;
//# sourceMappingURL=financialSnapshots.js.map
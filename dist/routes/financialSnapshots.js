"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const financialSnapshotController_1 = require("../web/controllers/financialSnapshotController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const financialSnapshotController = new financialSnapshotController_1.FinancialSnapshotController();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticateToken);
// CRUD de financial snapshots
router.post('/', financialSnapshotController.createFinancialSnapshot);
router.get('/building/:buildingId', financialSnapshotController.getFinancialSnapshots);
router.get('/:id', financialSnapshotController.getFinancialSnapshot);
router.put('/:id', financialSnapshotController.updateFinancialSnapshot);
router.delete('/:id', financialSnapshotController.deleteFinancialSnapshot);
exports.default = router;
//# sourceMappingURL=financialSnapshots.js.map
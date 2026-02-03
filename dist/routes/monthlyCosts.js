"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const monthlyCostsController_1 = require("../web/controllers/monthlyCostsController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const monthlyCostsController = new monthlyCostsController_1.MonthlyCostsController();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticateToken);
// NOTA: Los costes mensuales se calculan automáticamente desde las facturas de servicios
// Solo endpoints de lectura (GET)
router.get('/building/:buildingId', monthlyCostsController.getMonthlyCosts);
router.get('/building/:buildingId/summary', monthlyCostsController.getMonthlyCostsSummary);
router.get('/:id', monthlyCostsController.getMonthlyCost);
exports.default = router;
//# sourceMappingURL=monthlyCosts.js.map
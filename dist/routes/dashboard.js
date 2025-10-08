"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../web/controllers/dashboardController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const dashboardController = new dashboardController_1.DashboardController();
/**
 * GET /dashboard/stats
 * Obtiene las estadísticas del dashboard para el usuario autenticado
 * Requiere autenticación
 */
router.get('/stats', authMiddleware_1.authenticateToken, dashboardController.getStats);
exports.default = router;
//# sourceMappingURL=dashboard.js.map
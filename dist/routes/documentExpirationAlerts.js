"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentExpirationAlertController_1 = require("../web/controllers/documentExpirationAlertController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const requestLogger_1 = require("../web/middlewares/requestLogger");
const router = (0, express_1.Router)();
const documentExpirationAlertController = new documentExpirationAlertController_1.DocumentExpirationAlertController();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.requireAuth);
router.use(requestLogger_1.requestLogger);
// Obtener documentos próximos a vencer
router.get('/', documentExpirationAlertController.getExpiringDocuments);
// Buscar documentos próximos a vencer (próximos 7 días)
router.post('/find-soon', documentExpirationAlertController.findDocumentsExpiringSoon);
exports.default = router;
//# sourceMappingURL=documentExpirationAlerts.js.map
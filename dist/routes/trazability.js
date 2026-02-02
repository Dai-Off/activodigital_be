"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const trazabilityController_1 = require("../web/controllers/trazabilityController");
const requestLogger_1 = require("../web/middlewares/requestLogger");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.requireAuth);
router.use(requestLogger_1.requestLogger);
router.get('/list/:buildingId?', trazabilityController_1.listTrazabilityControler);
exports.default = router;
//# sourceMappingURL=trazability.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const trazabilityController_1 = require("../web/controllers/trazabilityController");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticateToken);
router.get('/list', trazabilityController_1.listTrazabilityControler);
exports.default = router;
//# sourceMappingURL=trazability.js.map
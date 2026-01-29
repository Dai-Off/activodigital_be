"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supportController_1 = require("../web/controllers/supportController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const supportController = new supportController_1.SupportController();
/**
 * @route POST /api/support
 * @desc Crear un ticket de soporte (envía email a soporte@empresa.com)
 * @access Public (autenticación opcional pero recomendada)
 */
router.post("/", authMiddleware_1.optionalAuth, supportController.createSupportTicket);
exports.default = router;
//# sourceMappingURL=support.js.map
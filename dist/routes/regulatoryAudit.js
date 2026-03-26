"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const regulatoryAuditController_1 = require("../web/controllers/regulatoryAuditController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const requestLogger_1 = require("../web/middlewares/requestLogger");
const router = (0, express_1.Router)();
router.use(requestLogger_1.requestLogger);
router.use(authMiddleware_1.requireAuth);
router.get('/building/:buildingId', regulatoryAuditController_1.getRegulatoryAuditController);
exports.default = router;
//# sourceMappingURL=regulatoryAudit.js.map
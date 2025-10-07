"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const esgController_1 = require("../web/controllers/esgController");
const router = (0, express_1.Router)();
const controller = new esgController_1.EsgController();
router.use(authMiddleware_1.authenticateToken);
// POST /esg/calculate
router.post('/calculate', controller.calculate);
exports.default = router;
//# sourceMappingURL=esg.js.map
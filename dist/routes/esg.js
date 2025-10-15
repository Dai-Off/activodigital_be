"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const esgController_1 = require("../web/controllers/esgController");
const router = (0, express_1.Router)();
const controller = new esgController_1.EsgController();
router.use(authMiddleware_1.authenticateToken);
// POST /esg/calculate - Calcula y guarda el ESG
router.post('/calculate', controller.calculate);
// GET /esg/building/:buildingId - Obtiene el ESG guardado
router.get('/building/:buildingId', controller.getStored);
exports.default = router;
//# sourceMappingURL=esg.js.map
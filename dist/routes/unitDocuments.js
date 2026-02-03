"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const unitDocumentController_1 = require("../web/controllers/unitDocumentController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const requestLogger_1 = require("../web/middlewares/requestLogger");
const router = (0, express_1.Router)();
const unitDocumentController = new unitDocumentController_1.UnitDocumentController();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.requireAuth);
router.use(requestLogger_1.requestLogger);
// CRUD de unit documents
router.post('/', unitDocumentController.createUnitDocument);
router.get('/building/:buildingId/unit/:unitId', unitDocumentController.getUnitDocuments);
router.get('/:id', unitDocumentController.getUnitDocument);
router.put('/:id', unitDocumentController.updateUnitDocument);
router.delete('/:id', unitDocumentController.deleteUnitDocument);
exports.default = router;
//# sourceMappingURL=unitDocuments.js.map
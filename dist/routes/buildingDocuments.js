"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const buildingDocumentController_1 = require("../web/controllers/buildingDocumentController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const requestLogger_1 = require("../web/middlewares/requestLogger");
const router = (0, express_1.Router)();
const buildingDocumentController = new buildingDocumentController_1.BuildingDocumentController();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.requireAuth);
router.use(requestLogger_1.requestLogger);
// CRUD de building documents
router.post('/', buildingDocumentController.createBuildingDocument);
router.get('/building/:buildingId', buildingDocumentController.getBuildingDocuments);
router.get('/:id', buildingDocumentController.getBuildingDocument);
router.put('/:id', buildingDocumentController.updateBuildingDocument);
router.delete('/:id', buildingDocumentController.deleteBuildingDocument);
exports.default = router;
//# sourceMappingURL=buildingDocuments.js.map
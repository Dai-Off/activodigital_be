"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const edificioController_1 = require("../web/controllers/edificioController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const buildingController = new edificioController_1.BuildingController();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticateToken);
// CRUD básico de edificios
router.post('/', buildingController.createBuilding);
router.get('/', buildingController.getBuildings);
router.get('/:id', buildingController.getBuilding);
router.put('/:id', buildingController.updateBuilding);
exports.default = router;
//# sourceMappingURL=edificios.js.map
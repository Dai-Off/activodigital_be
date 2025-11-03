"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const edificioController_1 = require("../web/controllers/edificioController");
const buildingMetricsController_1 = require("../web/controllers/buildingMetricsController");
const buildingScenariosController_1 = require("../web/controllers/buildingScenariosController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const buildingController = new edificioController_1.BuildingController();
const buildingMetricsController = new buildingMetricsController_1.BuildingMetricsController();
const buildingScenariosController = new buildingScenariosController_1.BuildingScenariosController();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticateToken);
// CRUD básico de edificios
router.post('/', buildingController.createBuilding);
router.get('/', buildingController.getBuildings);
// Endpoints de métricas financieras (GET) - deben ir antes de /:id para evitar conflictos
router.get('/:id/metrics', buildingMetricsController.getMetrics);
router.get('/:id/roi', buildingMetricsController.getROI);
router.get('/:id/cap-rate', buildingMetricsController.getCapRate);
router.get('/:id/noi', buildingMetricsController.getNOI);
router.get('/:id/dscr', buildingMetricsController.getDSCR);
router.get('/:id/opex-ratio', buildingMetricsController.getOpexRatio);
router.get('/:id/value-gap', buildingMetricsController.getValueGap);
// Endpoints de escenarios financieros (POST)
router.post('/:id/scenarios/rehab/simulate', buildingScenariosController.simulateRehab);
router.post('/:id/scenarios/cashflow/run', buildingScenariosController.runCashflow);
router.post('/:id/scenarios/npv', buildingScenariosController.calculateNPV);
router.post('/:id/scenarios/irr', buildingScenariosController.calculateIRR);
router.post('/:id/scenarios/sensitivity', buildingScenariosController.calculateSensitivity);
// CRUD básico de edificios (continuación)
router.get('/:id', buildingController.getBuilding);
router.put('/:id', buildingController.updateBuilding);
// Endpoints para gestión de imágenes
router.post('/:id/images', buildingController.uploadImages);
router.delete('/:id/images/:imageId', buildingController.deleteImage);
router.put('/:id/images/main', buildingController.setMainImage);
// Endpoint para validar asignaciones de usuarios
router.post('/validate-assignments', buildingController.validateUserAssignments);
exports.default = router;
//# sourceMappingURL=edificios.js.map
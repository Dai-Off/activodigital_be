"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const insuranceController_1 = require("../web/controllers/insuranceController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const insuranceController = new insuranceController_1.InsuranceController();
// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware_1.authenticateToken);
/**
 * @route GET /insurances
 * @desc Obtener seguros de un edificio (Requiere query param: ?buildingId=...)
 * @access Private
 */
router.get("/", insuranceController.getBuildingInsurances);
/**
 * @route GET /insurances/:id
 * @desc Obtener el detalle de una póliza específica
 * @access Private
 */
router.get("/:id", insuranceController.getInsuranceById);
/**
 * @route POST /insurances
 * @desc Crear una nueva póliza de seguro
 * @access Private
 */
router.post("/", insuranceController.createInsurance);
/**
 * @route PUT /insurances/:id
 * @desc Actualizar una póliza existente
 * @access Private
 */
router.put("/:id", insuranceController.updateInsurance);
/**
 * @route DELETE /insurances/:id
 * @desc Eliminar una póliza de seguro
 * @access Private
 */
router.delete("/:id", insuranceController.deleteInsurance);
exports.default = router;
//# sourceMappingURL=insurance.js.map
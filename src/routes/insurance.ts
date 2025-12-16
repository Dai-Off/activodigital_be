import { Router } from "express";
import { InsuranceController } from "../web/controllers/insuranceController";
import { authenticateToken } from "../web/middlewares/authMiddleware";

const router = Router();
const insuranceController = new InsuranceController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

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

export default router;

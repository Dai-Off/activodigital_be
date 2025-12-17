import { Router } from 'express';
import { BuildingController } from '../web/controllers/edificioController';
import { BuildingMetricsController } from '../web/controllers/buildingMetricsController';
import { BuildingScenariosController } from '../web/controllers/buildingScenariosController';
import { TechnicalAuditController } from '../web/controllers/technicalAuditController';
import { FinancialAuditController } from '../web/controllers/financialAuditController';
import {
  importUnitsFromCatastro,
  listUnits,
  upsertUnits,
  deleteUnit,
} from '../web/controllers/buildingUnitsController';
import { authenticateToken } from '../web/middlewares/authMiddleware';

const router = Router();
const buildingController = new BuildingController();
const buildingMetricsController = new BuildingMetricsController();
const buildingScenariosController = new BuildingScenariosController();
const technicalAuditController = new TechnicalAuditController();
const financialAuditController = new FinancialAuditController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

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

// Endpoints de auditoría (GET) - deben ir antes de /:id para evitar conflictos
router.get('/:id/audits/technical', technicalAuditController.getTechnicalAudit);
router.get('/:id/audits/financial', financialAuditController.getFinancialAudit);

// Endpoints de escenarios financieros (POST)
router.post('/:id/scenarios/rehab/simulate', buildingScenariosController.simulateRehab);
router.post('/:id/scenarios/cashflow/run', buildingScenariosController.runCashflow);
router.post('/:id/scenarios/npv', buildingScenariosController.calculateNPV);
router.post('/:id/scenarios/irr', buildingScenariosController.calculateIRR);
router.post('/:id/scenarios/sensitivity', buildingScenariosController.calculateSensitivity);

// CRUD básico de edificios (continuación)
router.get('/:id', buildingController.getBuilding);
router.put('/:id', buildingController.updateBuilding);

// Gestión de unidades
router.get('/:id/units', listUnits);
router.post('/:id/units', upsertUnits);
router.post('/:id/units/from-catastro', importUnitsFromCatastro);
router.delete('/:id/units/:unitId', deleteUnit);

// Endpoints para gestión de imágenes
router.post('/:id/images', buildingController.uploadImages);
router.delete('/:id/images/:imageId', buildingController.deleteImage);
router.put('/:id/images/main', buildingController.setMainImage);

// Endpoint para validar asignaciones de usuarios
router.post('/validate-assignments', buildingController.validateUserAssignments);

export default router;

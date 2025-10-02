import { Router } from 'express';
import { CertificateEnergeticoController } from '../web/controllers/certificateEnergeticoController';
import { authenticateToken } from '../web/middlewares/authMiddleware';

const router = Router();
const certificateController = new CertificateEnergeticoController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para certificados energéticos

/**
 * @route GET /api/certificados-energeticos
 * @desc Obtener todos los certificados energéticos del usuario
 * @access Private
 */
router.get('/', certificateController.getAll);

/**
 * @route GET /api/certificados-energeticos/building/:buildingId
 * @desc Obtener sesiones y certificados de un edificio específico
 * @access Private
 */
router.get('/building/:buildingId', certificateController.getByBuilding);

/**
 * @route POST /api/certificados-energeticos/sessions
 * @desc Crear nueva sessión de certificado energético con documentos
 * @access Private
 */
router.post('/sessions', certificateController.createSession);

/**
 * @route PUT /api/certificados-energeticos/sessions/:sessionId
 * @desc Actualizar sesión de certificado energético (datos de IA)
 * @access Private
 */
router.put('/sessions/:sessionId', certificateController.updateSession);

/**
 * @route POST /api/certificados-energeticos/sessions/:sessionId/confirm
 * @desc Confirmar certificado energético y guardarlo definitivamente
 * @access Private
 */
router.post('/sessions/:sessionId/confirm', certificateController.confirmCertificate);

/**
 * @route DELETE /api/certificados-energeticos/sessions/:sessionId
 * @desc Eliminar sesión de certificado energético
 * @access Private
 */
router.delete('/sessions/:sessionId', certificateController.deleteSession);

/**
 * @route DELETE /api/certificados-energeticos/:certificateId
 * @desc Eliminar certificado energético confirmado
 * @access Private
 */
router.delete('/:certificateId', certificateController.deleteCertificate);

/**
 * @route POST /api/certificados-energeticos/process-ai-data
 * @desc Procesar certificado con datos de IA desde el frontend
 * @access Private
 */
router.post('/process-ai-data', certificateController.processAIData);

/**
 * @route GET /api/certificados-energeticos/sessions/:sessionId/documents
 * @deprecated Obtener documentos de una sesión específica
 * @access Private
 */
router.get('/sessions/:sessionId/documents', certificateController.getSessionDocuments);

export default router;

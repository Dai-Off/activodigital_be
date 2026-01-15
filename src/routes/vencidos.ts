import { Router } from 'express';
import { VencidosController } from '../web/controllers/vencidosController';
import { authenticateToken } from '../web/middlewares/authMiddleware';

const router = Router();
const vencidosController = new VencidosController();

/**
 * GET /vencidos/kpis
 * Obtiene el resumen de KPIs de documentos vencidos
 * Requiere autenticación
 */
router.get('/kpis', authenticateToken, vencidosController.getKPIs);

/**
 * GET /vencidos/categorias
 * Obtiene los conteos por categoría de documentos vencidos
 * Requiere autenticación
 */
router.get('/categorias', authenticateToken, vencidosController.getCategorias);

/**
 * GET /vencidos/listado
 * Obtiene el listado paginado y filtrado de documentos vencidos
 * Query params:
 *   - building_id: ID del edificio (opcional)
 *   - unidad: Unidad (opcional)
 *   - prioridad: alta | media | baja | todas (opcional)
 *   - categoria: Categoría (opcional)
 *   - tipo_documento: Tipo de documento (opcional)
 *   - search: Búsqueda por texto (opcional)
 *   - page: Número de página (opcional, default: 1)
 *   - limit: Elementos por página (opcional, default: 10)
 *   - sort: mas_retrasado | menos_retrasado | mas_reciente | menos_reciente (opcional)
 * Requiere autenticación
 */
router.get('/listado', authenticateToken, vencidosController.getListado);

/**
 * GET /vencidos/filtros
 * Obtiene los valores únicos disponibles para los filtros
 * Requiere autenticación
 */
router.get('/filtros', authenticateToken, vencidosController.getFiltrosDisponibles);

/**
 * GET /vencidos/:id
 * Obtiene el detalle de un documento vencido por ID
 * Requiere autenticación
 */
router.get('/:id', authenticateToken, vencidosController.getDetalle);

export default router;


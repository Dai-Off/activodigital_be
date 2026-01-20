"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vencidosController_1 = require("../web/controllers/vencidosController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const vencidosController = new vencidosController_1.VencidosController();
/**
 * GET /vencidos/kpis
 * Obtiene el resumen de KPIs de documentos vencidos
 * Requiere autenticación
 */
router.get('/kpis', authMiddleware_1.authenticateToken, vencidosController.getKPIs);
/**
 * GET /vencidos/categorias
 * Obtiene los conteos por categoría de documentos vencidos
 * Requiere autenticación
 */
router.get('/categorias', authMiddleware_1.authenticateToken, vencidosController.getCategorias);
/**
 * GET /vencidos/listado
 * Obtiene el listado paginado y filtrado de documentos vencidos
 * Query params:
 *   - building_id: ID del edificio (opcional)
 *   - unidad: Unidad (opcional)
 *   - prioridad: alta | media | baja | todas (opcional)
 *   - categoria: Categoría (opcional)
 *   - search: Búsqueda por texto (opcional)
 *   - page: Número de página (opcional, default: 1)
 *   - limit: Elementos por página (opcional, default: 10)
 *   - sort: mas_retrasado | menos_retrasado | mas_reciente | menos_reciente (opcional)
 * Requiere autenticación
 */
router.get('/listado', authMiddleware_1.authenticateToken, vencidosController.getListado);
/**
 * GET /vencidos/:id
 * Obtiene el detalle de un documento vencido por ID
 * Requiere autenticación
 */
router.get('/:id', authMiddleware_1.authenticateToken, vencidosController.getDetalle);
exports.default = router;
//# sourceMappingURL=vencidos.js.map
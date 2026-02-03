"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VencidosController = void 0;
const vencidosService_1 = require("../../domain/services/vencidosService");
class VencidosController {
    constructor() {
        this.vencidosService = new vencidosService_1.VencidosService();
        /**
         * GET /vencidos/kpis
         * Obtiene el resumen de KPIs de documentos vencidos
         */
        this.getKPIs = async (req, res) => {
            try {
                const kpis = await this.vencidosService.getKPIsResumen();
                res.status(200).json({
                    kpis,
                    message: 'KPIs obtenidos exitosamente'
                });
            }
            catch (error) {
                console.error('Error en getKPIs:', error);
                res.status(500).json({
                    error: 'Error al obtener KPIs',
                    message: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
        /**
         * GET /vencidos/categorias
         * Obtiene los conteos por categoría
         */
        this.getCategorias = async (req, res) => {
            try {
                const categorias = await this.vencidosService.getConteosPorCategoria();
                res.status(200).json({
                    categorias,
                    message: 'Categorías obtenidas exitosamente'
                });
            }
            catch (error) {
                console.error('Error en getCategorias:', error);
                res.status(500).json({
                    error: 'Error al obtener categorías',
                    message: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
        /**
         * GET /vencidos/listado
         * Obtiene el listado paginado y filtrado de documentos vencidos
         */
        this.getListado = async (req, res) => {
            try {
                const filtros = {
                    building_id: req.query.building_id,
                    unidad: req.query.unidad,
                    prioridad: req.query.prioridad,
                    categoria: req.query.categoria,
                    tipo_documento: req.query.tipo_documento,
                    search: req.query.search,
                    page: req.query.page ? parseInt(req.query.page) : 1,
                    limit: req.query.limit ? parseInt(req.query.limit) : 10,
                    sort: req.query.sort
                };
                const resultado = await this.vencidosService.getListadoVencidos(filtros);
                res.status(200).json({
                    data: resultado,
                    message: 'Listado obtenido exitosamente'
                });
            }
            catch (error) {
                console.error('Error en getListado:', error);
                res.status(500).json({
                    error: 'Error al obtener listado',
                    message: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
        /**
         * GET /vencidos/:id
         * Obtiene el detalle de un documento vencido
         */
        this.getDetalle = async (req, res) => {
            try {
                const { id } = req.params;
                if (!id) {
                    res.status(400).json({
                        error: 'ID requerido',
                        message: 'Debe proporcionar un ID de documento'
                    });
                    return;
                }
                const documento = await this.vencidosService.getDetalleItem(id);
                if (!documento) {
                    res.status(404).json({
                        error: 'Documento no encontrado',
                        message: 'El documento no existe o no está vencido'
                    });
                    return;
                }
                res.status(200).json({
                    data: documento,
                    message: 'Detalle obtenido exitosamente'
                });
            }
            catch (error) {
                console.error('Error en getDetalle:', error);
                res.status(500).json({
                    error: 'Error al obtener detalle',
                    message: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
        /**
         * GET /vencidos/filtros
         * Obtiene los valores únicos disponibles para los filtros
         */
        this.getFiltrosDisponibles = async (req, res) => {
            try {
                const filtros = await this.vencidosService.getFiltrosDisponibles();
                res.status(200).json({
                    data: filtros,
                    message: 'Filtros disponibles obtenidos exitosamente'
                });
            }
            catch (error) {
                console.error('Error en getFiltrosDisponibles:', error);
                res.status(500).json({
                    error: 'Error al obtener filtros disponibles',
                    message: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
    }
}
exports.VencidosController = VencidosController;
//# sourceMappingURL=vencidosController.js.map
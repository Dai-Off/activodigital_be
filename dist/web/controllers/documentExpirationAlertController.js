"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentExpirationAlertController = void 0;
const documentExpirationAlertService_1 = require("../../domain/services/documentExpirationAlertService");
class DocumentExpirationAlertController {
    constructor() {
        /**
         * Obtiene documentos próximos a vencer
         * GET /document-expiration-alerts
         */
        this.getExpiringDocuments = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                // Parsear query parameters
                const filters = {
                    days_ahead: req.query.days_ahead
                        ? parseInt(req.query.days_ahead, 10)
                        : undefined,
                    include_expired: req.query.include_expired === 'true' || req.query.include_expired === undefined,
                    building_id: req.query.building_id,
                    unit_id: req.query.unit_id,
                    category: req.query.category,
                    alert_level: req.query.alert_level,
                };
                // Validar days_ahead
                if (filters.days_ahead !== undefined && (isNaN(filters.days_ahead) || filters.days_ahead < 0)) {
                    res.status(400).json({ error: 'days_ahead debe ser un número positivo' });
                    return;
                }
                const result = await this.getService().getExpiringDocuments(filters);
                res.json(result);
            }
            catch (error) {
                console.error('Error al obtener documentos próximos a vencer:', error);
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        };
        /**
         * Endpoint para buscar documentos próximos a vencer (próximos 7 días)
         * POST /document-expiration-alerts/find-soon
         * Este endpoint puede ser llamado manualmente o por el cronjob
         */
        this.findDocumentsExpiringSoon = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const result = await this.getService().findDocumentsExpiringSoon();
                res.json({
                    message: 'Búsqueda de documentos próximos a vencer completada',
                    ...result,
                });
            }
            catch (error) {
                console.error('Error al buscar documentos próximos a vencer:', error);
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        };
    }
    getService() {
        return new documentExpirationAlertService_1.DocumentExpirationAlertService();
    }
}
exports.DocumentExpirationAlertController = DocumentExpirationAlertController;
//# sourceMappingURL=documentExpirationAlertController.js.map
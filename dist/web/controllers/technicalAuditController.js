"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnicalAuditController = void 0;
const technicalAuditService_1 = require("../../domain/services/technicalAuditService");
class TechnicalAuditController {
    constructor() {
        /**
         * GET /buildings/:id/audits/technical
         * Obtiene la auditoría técnica del edificio
         */
        this.getTechnicalAudit = async (req, res) => {
            try {
                const userAuthId = req.user?.id;
                if (!userAuthId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id: buildingId } = req.params;
                const audit = await this.getService().getTechnicalAudit(buildingId, userAuthId);
                res.json({
                    data: audit,
                    message: 'Auditoría técnica obtenida exitosamente'
                });
            }
            catch (error) {
                console.error('Error al obtener auditoría técnica:', error);
                res.status(500).json({
                    error: 'Error interno del servidor',
                    message: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
    }
    getService() {
        return new technicalAuditService_1.TechnicalAuditService();
    }
}
exports.TechnicalAuditController = TechnicalAuditController;
//# sourceMappingURL=technicalAuditController.js.map
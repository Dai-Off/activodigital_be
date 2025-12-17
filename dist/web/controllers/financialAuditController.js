"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialAuditController = void 0;
const financialAuditService_1 = require("../../domain/services/financialAuditService");
class FinancialAuditController {
    constructor() {
        /**
         * GET /buildings/:id/audits/financial
         * Obtiene la auditoría financiera del edificio
         */
        this.getFinancialAudit = async (req, res) => {
            try {
                const userAuthId = req.user?.id;
                if (!userAuthId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id: buildingId } = req.params;
                const audit = await this.getService().getFinancialAudit(buildingId, userAuthId);
                res.json({
                    data: audit,
                    message: 'Auditoría financiera obtenida exitosamente'
                });
            }
            catch (error) {
                console.error('Error al obtener auditoría financiera:', error);
                // Manejar errores específicos
                if (error instanceof Error) {
                    if (error.message === 'Edificio no encontrado') {
                        res.status(404).json({
                            error: 'Edificio no encontrado',
                            message: error.message
                        });
                        return;
                    }
                }
                res.status(500).json({
                    error: 'Error interno del servidor',
                    message: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
    }
    getService() {
        return new financialAuditService_1.FinancialAuditService();
    }
}
exports.FinancialAuditController = FinancialAuditController;
//# sourceMappingURL=financialAuditController.js.map
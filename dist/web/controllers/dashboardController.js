"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboardService_1 = require("../../domain/services/dashboardService");
class DashboardController {
    constructor() {
        this.dashboardService = new dashboardService_1.DashboardService();
        /**
         * GET /dashboard/stats
         * Obtiene las estadísticas del dashboard para el usuario autenticado
         */
        this.getStats = async (req, res) => {
            try {
                const userAuthId = req.user?.id;
                if (!userAuthId) {
                    res.status(401).json({
                        error: 'No autorizado',
                        message: 'Token de autenticación inválido'
                    });
                    return;
                }
                const stats = await this.dashboardService.getDashboardStats(userAuthId);
                res.status(200).json({
                    data: stats,
                    message: 'Estadísticas obtenidas exitosamente'
                });
            }
            catch (error) {
                console.error('Error en getStats:', error);
                res.status(500).json({
                    error: 'Error al obtener estadísticas',
                    message: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=dashboardController.js.map
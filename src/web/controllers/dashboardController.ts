import { Request, Response } from 'express';
import { DashboardService } from '../../domain/services/dashboardService';

export class DashboardController {
  private dashboardService = new DashboardService();

  /**
   * GET /dashboard/stats
   * Obtiene las estadísticas del dashboard para el usuario autenticado
   */
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userAuthId = (req as any).user?.id;

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
    } catch (error) {
      console.error('Error en getStats:', error);
      res.status(500).json({
        error: 'Error al obtener estadísticas',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
}

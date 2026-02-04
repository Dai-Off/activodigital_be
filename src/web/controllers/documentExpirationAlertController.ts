import { Request, Response } from 'express';
import { DocumentExpirationAlertService } from '../../domain/services/documentExpirationAlertService';
import { ExpirationAlertFilters } from '../../types/documentExpirationAlert';

export class DocumentExpirationAlertController {
  private getService() {
    return new DocumentExpirationAlertService();
  }

  /**
   * Obtiene documentos próximos a vencer
   * GET /document-expiration-alerts
   */
  getExpiringDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      // Parsear query parameters
      const filters: ExpirationAlertFilters = {
        days_ahead: req.query.days_ahead 
          ? parseInt(req.query.days_ahead as string, 10) 
          : undefined,
        include_expired: req.query.include_expired === 'true' || req.query.include_expired === undefined,
        building_id: req.query.building_id as string | undefined,
        unit_id: req.query.unit_id as string | undefined,
        category: req.query.category as string | undefined,
        alert_level: req.query.alert_level as 'critical' | 'warning' | 'info' | undefined,
      };

      // Validar days_ahead
      if (filters.days_ahead !== undefined && (isNaN(filters.days_ahead) || filters.days_ahead < 0)) {
        res.status(400).json({ error: 'days_ahead debe ser un número positivo' });
        return;
      }

      const result = await this.getService().getExpiringDocuments(filters);
      res.json(result);
    } catch (error: any) {
      console.error('Error al obtener documentos próximos a vencer:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  };

  /**
   * Endpoint para buscar documentos próximos a vencer (próximos 7 días)
   * POST /document-expiration-alerts/find-soon
   * Este endpoint puede ser llamado manualmente o por el cronjob
   */
  findDocumentsExpiringSoon = async (req: Request, res: Response): Promise<void> => {
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
    } catch (error: any) {
      console.error('Error al buscar documentos próximos a vencer:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  };
}


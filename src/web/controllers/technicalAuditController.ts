import { Request, Response } from 'express';
import { TechnicalAuditService } from '../../domain/services/technicalAuditService';

export class TechnicalAuditController {
  private getService() {
    return new TechnicalAuditService();
  }

  /**
   * GET /buildings/:id/audits/technical
   * Obtiene la auditoría técnica del edificio
   */
  getTechnicalAudit = async (req: Request, res: Response): Promise<void> => {
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
    } catch (error) {
      console.error('Error al obtener auditoría técnica:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
}


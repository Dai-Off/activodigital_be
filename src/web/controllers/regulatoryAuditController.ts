import { Request, Response } from 'express';
import { RegulatoryAuditService } from '../../domain/services/regulatoryAuditService';

export const getRegulatoryAuditController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { buildingId } = req.params;
    const userId = req.user?.id;

    if (!buildingId) {
      res.status(400).json({ error: 'buildingId es requerido' });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const service = new RegulatoryAuditService();
    const result = await service.getRegulatoryAudit(buildingId, userId);

    res.status(200).json({ 
      data: result, 
      message: 'Auditoría regulatoria obtenida exitosamente' 
    });
  } catch (error: any) {
    console.error('Error al obtener la auditoría regulatoria:', error);
    if (error.message === 'Edificio no encontrado') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Error interno del servidor al obtener la auditoría regulatoria' });
    }
  }
};

import { Request, Response } from 'express';
import { TrazabilityService } from '../../domain/trazability/TrazabilityService';

const trazabilityService = new TrazabilityService();

export const listTrazabilityControler = async (req: Request, res: Response) => {
    try {
        const trazabilidad = await trazabilityService.listTrazability();
        if (!trazabilidad) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(trazabilidad);
      } catch (error) {
        console.error('Error al obtener la trazabilidad:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
      }
}
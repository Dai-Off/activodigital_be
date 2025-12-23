import { Request, Response } from 'express';
import { trazabilityService } from '../../domain/trazability/TrazabilityService';

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
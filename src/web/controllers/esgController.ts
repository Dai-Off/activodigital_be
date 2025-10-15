import { Request, Response } from 'express';
import { EsgService } from '../../domain/services/esgService';
import { getSupabaseClientForToken } from '../../lib/supabase';

export class EsgController {
  private getService() {
    return new EsgService();
  }

  calculate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const body = (req.body?.data ?? req.body);

      // Validar que se proporcione el building_id
      if (!body.building_id) {
        res.status(400).json({ error: 'El campo building_id es requerido' });
        return;
      }

      // Obtener el token del usuario para respetar RLS
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        res.status(401).json({ error: 'Token no encontrado' });
        return;
      }
      
      const supabaseClient = getSupabaseClientForToken(token);
      const result = await this.getService().calculateFromDatabase(
        body.building_id,
        supabaseClient
      );
      
      // El resultado ya viene con la estructura correcta desde el servicio
      res.json(result);
    } catch (error) {
      console.error('Error al calcular ESG:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  };

  getStored = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { buildingId } = req.params;
      if (!buildingId) {
        res.status(400).json({ error: 'El buildingId es requerido' });
        return;
      }

      // Obtener el token del usuario para respetar RLS
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        res.status(401).json({ error: 'Token no encontrado' });
        return;
      }
      
      const supabaseClient = getSupabaseClientForToken(token);
      const result = await this.getService().getStoredEsgScore(buildingId, supabaseClient);
      
      if (!result) {
        res.status(404).json({ error: 'No se encontró un cálculo ESG para este edificio' });
        return;
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error al obtener ESG guardado:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  };
}



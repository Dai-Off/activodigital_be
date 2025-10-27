import { Request, Response } from 'express';
import { FinancialSnapshotService } from '../../domain/services/financialSnapshotService';
import { CreateFinancialSnapshotRequest, UpdateFinancialSnapshotRequest } from '../../types/financialSnapshot';

export class FinancialSnapshotController {
  private getService() {
    return new FinancialSnapshotService();
  }

  createFinancialSnapshot = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const data: CreateFinancialSnapshotRequest = req.body;
      
      // Validación básica
      if (!data.building_id || !data.period_start || !data.period_end) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const snapshot = await this.getService().createFinancialSnapshot(data, userId);
      res.status(201).json({ data: snapshot });
    } catch (error) {
      console.error('Error al crear financial snapshot:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getFinancialSnapshots = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { buildingId } = req.params;
      
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (!buildingId) {
        res.status(400).json({ error: 'buildingId es requerido' });
        return;
      }

      const snapshots = await this.getService().getFinancialSnapshotsByBuilding(buildingId, userId);
      res.json({ data: snapshots });
    } catch (error) {
      console.error('Error al obtener financial snapshots:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getFinancialSnapshot = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const snapshot = await this.getService().getFinancialSnapshotById(id, userId);
      
      if (!snapshot) {
        res.status(404).json({ error: 'Financial snapshot no encontrado' });
        return;
      }

      res.json({ data: snapshot });
    } catch (error) {
      console.error('Error al obtener financial snapshot:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  updateFinancialSnapshot = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const data: UpdateFinancialSnapshotRequest = req.body;
      
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const snapshot = await this.getService().updateFinancialSnapshot(id, data, userId);
      
      if (!snapshot) {
        res.status(404).json({ error: 'Financial snapshot no encontrado' });
        return;
      }

      res.json({ data: snapshot });
    } catch (error) {
      console.error('Error al actualizar financial snapshot:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  deleteFinancialSnapshot = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      await this.getService().deleteFinancialSnapshot(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar financial snapshot:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}


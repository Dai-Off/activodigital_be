import { Request, Response } from 'express';
import { BuildingService } from '../../domain/services/edificioService';
import { CreateBuildingRequest, UpdateBuildingRequest, BuildingStatus } from '../../types/edificio';

export class BuildingController {
  private getBuildingService() {
    return new BuildingService();
  }

  createBuilding = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const data: CreateBuildingRequest = req.body;
      
      // Validación básica
      if (!data.name || !data.address || !data.typology) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const building = await this.getBuildingService().createBuilding(data, userId);
      res.status(201).json({ data: building });
    } catch (error) {
      console.error('Error al crear edificio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getBuildings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const buildings = await this.getBuildingService().getBuildingsByUser(userId);
      res.json({ data: buildings });
    } catch (error) {
      console.error('Error al obtener edificios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getBuilding = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { id } = req.params;
      const building = await this.getBuildingService().getBuildingById(id, userId);
      
      if (!building) {
        res.status(404).json({ error: 'Edificio no encontrado' });
        return;
      }

      res.json({ data: building });
    } catch (error) {
      console.error('Error al obtener edificio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  updateBuilding = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { id } = req.params;
      const data: UpdateBuildingRequest = req.body;

      const building = await this.getBuildingService().updateBuilding(id, data, userId);
      res.json({ data: building });
    } catch (error) {
      console.error('Error al actualizar edificio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

}

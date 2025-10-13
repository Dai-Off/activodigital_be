import { Request, Response } from 'express';
import { BuildingService } from '../../domain/services/edificioService';
import { CreateBuildingRequest, UpdateBuildingRequest, BuildingStatus, UploadImagesRequest, SetMainImageRequest, ValidateAssignmentsResponse } from '../../types/edificio';

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

  // Endpoints para gestión de imágenes
  uploadImages = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { id } = req.params;
      const { images }: UploadImagesRequest = req.body;

      if (!images || !Array.isArray(images)) {
        res.status(400).json({ error: 'Se requiere un array de imágenes' });
        return;
      }

      // Validar que todas las imágenes tengan los campos requeridos
      for (const image of images) {
        if (!image.id || !image.url || !image.title || !image.filename) {
          res.status(400).json({ error: 'Cada imagen debe tener id, url, title y filename' });
          return;
        }
      }

      // Agregar cada imagen al edificio
      let building = await this.getBuildingService().getBuildingById(id, userId);
      if (!building) {
        res.status(404).json({ error: 'Edificio no encontrado' });
        return;
      }

      for (const image of images) {
        building = await this.getBuildingService().addImage(id, image, userId);
      }

      res.json({ data: building });
    } catch (error) {
      console.error('Error al subir imágenes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { id, imageId } = req.params;

      const building = await this.getBuildingService().removeImage(id, imageId, userId);
      res.json({ data: building });
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  setMainImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { id } = req.params;
      const { imageId }: SetMainImageRequest = req.body;

      if (!imageId) {
        res.status(400).json({ error: 'Se requiere imageId' });
        return;
      }

      const building = await this.getBuildingService().setMainImage(id, imageId, userId);
      res.json({ data: building });
    } catch (error) {
      console.error('Error al establecer imagen principal:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Nuevo endpoint para validar emails de técnico y CFO
  validateUserAssignments = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { technicianEmail, cfoEmail } = req.body;

      if (!technicianEmail && !cfoEmail) {
        res.status(400).json({ error: 'Se requiere al menos un email para validar' });
        return;
      }

      const validationResults = await this.getBuildingService().validateUserAssignments(
        technicianEmail, 
        cfoEmail, 
        userId
      );

      res.json({ data: validationResults });
    } catch (error) {
      console.error('Error al validar asignaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

}

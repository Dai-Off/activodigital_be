import { Request, Response } from 'express';
import { BuildingDocumentService } from '../../domain/services/buildingDocumentService';
import { CreateBuildingDocumentRequest, UpdateBuildingDocumentRequest } from '../../types/buildingDocument';

export class BuildingDocumentController {
  private getService() {
    return new BuildingDocumentService();
  }

  createBuildingDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const data: CreateBuildingDocumentRequest = req.body;

      // Validación básica
      if (!data.building_id || !data.file_name || !data.storage_path || !data.storage_file_name || !data.category) {
        res.status(400).json({ error: 'Faltan campos requeridos: building_id, file_name, storage_path, storage_file_name, category' });
        return;
      }

      // Validar file_size
      if (data.file_size === undefined || data.file_size < 0) {
        res.status(400).json({ error: 'file_size debe ser >= 0' });
        return;
      }

      const document = await this.getService().createBuildingDocument(data, userId);
      res.status(201).json({ data: document });
    } catch (error: any) {
      console.error('Error al crear documento de edificio:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  };

  getBuildingDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { buildingId } = req.params;
      const category = req.query.category as string | undefined;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (!buildingId) {
        res.status(400).json({ error: 'buildingId es requerido' });
        return;
      }

      const documents = await this.getService().getBuildingDocumentsByBuilding(
        buildingId,
        category
      );
      res.json({ data: documents });
    } catch (error) {
      console.error('Error al obtener documentos de edificio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getBuildingDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const document = await this.getService().getBuildingDocumentById(id);

      if (!document) {
        res.status(404).json({ error: 'Documento no encontrado' });
        return;
      }

      res.json({ data: document });
    } catch (error) {
      console.error('Error al obtener documento:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  updateBuildingDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const data: UpdateBuildingDocumentRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const document = await this.getService().updateBuildingDocument(id, data, userId);
      res.json({ data: document });
    } catch (error: any) {
      console.error('Error al actualizar documento:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  };

  deleteBuildingDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      await this.getService().deleteBuildingDocument(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error al eliminar documento:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  };
}


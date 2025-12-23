import { Request, Response } from 'express';
import { DigitalBookService } from '../../domain/services/libroDigitalService';
import { CreateDigitalBookRequest, UpdateDigitalBookRequest, UpdateSectionRequest, SectionType } from '../../types/libroDigital';
import { trazabilityService } from '../../domain/trazability/TrazabilityService';
import { ActionsValues, ModuleValues } from '../../domain/trazability/interfaceTrazability';

export class DigitalBookController {
  private getDigitalBookService() {
    return new DigitalBookService();
  }

  createDigitalBook = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const data: CreateDigitalBookRequest = req.body;

      // Validación básica
      if (!data.buildingId || !data.source) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const book = await this.getDigitalBookService().createDigitalBook(data, userId);
      trazabilityService.registerTrazability({ authUserId: userId, buildingId: data.buildingId, action: ActionsValues['CREAR'], module: ModuleValues.EDIFICIOS, description: "Cargar libro digital (manualmente)" }).catch(err => console.error("Fallo trazabilidad:", err));
      res.status(201).json({ data: book });
    } catch (error) {
      console.error('Error al crear libro digital:', error);
      if (error instanceof Error && error.message.includes('no encontrado')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

  // Eliminado: listado por usuario y obtención por ID (libro ligado a edificio)

  getBookByBuilding = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { buildingId } = req.params;
      const book = await this.getDigitalBookService().getBookByBuildingId(buildingId, userId);

      if (!book) {
        res.status(404).json({ error: 'Libro digital no encontrado para este edificio' });
        return;
      }

      res.json({ data: book });
    } catch (error) {
      console.error('Error al obtener libro digital por edificio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  updateBook = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { id } = req.params;
      const data: UpdateDigitalBookRequest = req.body;

      const book = await this.getDigitalBookService().updateBook(id, data, userId);
      res.json({ data: book });
    } catch (error) {
      console.error('Error al actualizar libro digital:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  updateSection = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { id } = req.params;
      const sectionTypeParam = req.params.sectionType;
      const data: UpdateSectionRequest = req.body;

      // Validar tipo de sección (solo nombres en inglés)
      if (!Object.values(SectionType).includes(sectionTypeParam as SectionType)) {
        res.status(400).json({ error: 'Tipo de sección inválido' });
        return;
      }

      if (!data.content) {
        res.status(400).json({ error: 'Contenido es requerido' });
        return;
      }

      const book = await this.getDigitalBookService().updateSection(
        id,
        sectionTypeParam as SectionType,
        data,
        userId
      );
      trazabilityService.registerTrazability({ authUserId: userId, buildingId: book?.buildingId, action: ActionsValues['ACTUALIZAR LIBRO DEL EDIFICIO'], module: ModuleValues.EDIFICIOS, description: "Modificar libro digital" }).catch(err => console.error("Fallo trazabilidad:", err));
      res.json({ data: book });
    } catch (error) {
      console.error('Error al actualizar sección:', error);
      if (error instanceof Error && error.message.includes('no encontrado')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

}

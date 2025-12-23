import { Request, Response } from 'express';
import { MonthlyCostsService } from '../../domain/services/monthlyCostsService';

export class MonthlyCostsController {
  private getService() {
    return new MonthlyCostsService();
  }

  // NOTA: Los costes mensuales ahora se calculan automáticamente desde las facturas de servicios
  // No hay endpoints de creación/actualización/eliminación, solo lectura

  getMonthlyCosts = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { buildingId } = req.params;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (!buildingId) {
        res.status(400).json({ error: 'buildingId es requerido' });
        return;
      }

      if (month && (!year || month < 1 || month > 12)) {
        res.status(400).json({ error: 'month debe ser un número entre 1 y 12, y requiere year' });
        return;
      }

      const costs = await this.getService().getMonthlyCostsByBuilding(buildingId, userId, year, month);
      
      // Mejorar respuesta cuando no hay datos
      if (costs.length === 0) {
        const message = month 
          ? `No se encontraron gastos para el mes ${month} del año ${year || 'consultado'}`
          : year 
          ? `No se encontraron gastos para el año ${year}`
          : 'No se encontraron gastos de servicios';
        
        res.json({
          data: [],
          building_id: buildingId,
          year: year || null,
          month: month || null,
          months_count: 0,
          message
        });
        return;
      }
      
      res.json({
        data: costs,
        building_id: buildingId,
        year: year || null,
        month: month || null,
        months_count: costs.length
      });
    } catch (error) {
      console.error('Error al obtener monthly costs:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getMonthlyCostsSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { buildingId } = req.params;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (!buildingId) {
        res.status(400).json({ error: 'buildingId es requerido' });
        return;
      }

      const summary = await this.getService().getMonthlyCostsSummary(buildingId, userId, year);
      res.json({ data: summary });
    } catch (error) {
      console.error('Error al obtener monthly costs summary:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getMonthlyCost = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const monthlyCost = await this.getService().getMonthlyCostById(id, userId);

      if (!monthlyCost) {
        res.status(404).json({ error: 'Monthly cost no encontrado' });
        return;
      }

      res.json({ data: monthlyCost });
    } catch (error) {
      console.error('Error al obtener monthly cost:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

}



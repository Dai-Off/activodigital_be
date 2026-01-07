import { Request, Response } from 'express';
import { RentService } from '../../domain/services/rentService';
import {
  CreateRentInvoiceRequest,
  UpdateRentInvoiceRequest,
} from '../../types/rent';
import { trazabilityService } from '../../domain/trazability/TrazabilityService';
import { ActionsValues, ModuleValues } from '../../domain/trazability/interfaceTrazability';

export class RentController {
  private getService() {
    return new RentService();
  }

  // ========== FACTURAS (con pago incluido) ==========

  createRentInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const data: CreateRentInvoiceRequest = req.body;

      if (!data.buildingId || !data.unitId || !data.invoiceMonth || !data.dueDate) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const invoice = await this.getService().createRentInvoice(data, userId);
      trazabilityService.registerTrazability({ authUserId: userId, buildingId: data?.buildingId, action: ActionsValues['CREAR'], module: ModuleValues.DOCUMENTOS, description: "Subir factura de Renta" }).catch(err => console.error("Fallo trazabilidad:", err));
      res.status(201).json({ data: invoice });
    } catch (error: any) {
      console.error('Error al crear factura:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  };

  getRentInvoicesByBuilding = async (req: Request, res: Response): Promise<void> => {
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

      const invoices = await this.getService().getRentInvoicesByBuilding(buildingId, userId);
      res.json({ data: invoices });
    } catch (error: any) {
      console.error('Error al obtener facturas:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  };

  getRentInvoicesByMonth = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { buildingId, month } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (!buildingId || !month) {
        res.status(400).json({ error: 'buildingId y month son requeridos' });
        return;
      }

      // Validar formato de mes (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(month)) {
        res.status(400).json({ error: 'Formato de mes inválido. Debe ser YYYY-MM' });
        return;
      }

      const invoices = await this.getService().getRentInvoicesByMonth(buildingId, month, userId);
      res.json({ data: invoices });
    } catch (error: any) {
      console.error('Error al obtener facturas del mes:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  };

  getRentInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const invoice = await this.getService().getRentInvoiceById(id, userId);

      if (!invoice) {
        res.status(404).json({ error: 'Factura no encontrada' });
        return;
      }

      res.json({ data: invoice });
    } catch (error: any) {
      console.error('Error al obtener factura:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  };

  updateRentInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const data: UpdateRentInvoiceRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const invoice = await this.getService().updateRentInvoice(id, data, userId);

      if (!invoice) {
        res.status(404).json({ error: 'Factura no encontrada' });
        return;
      }
      trazabilityService.registerTrazability({ authUserId: userId, buildingId: invoice?.buildingId, action: ActionsValues['ACTUALIZAR DATOS FINANCIEROS'], module: ModuleValues.DOCUMENTOS, description: "Actualizar factura de Renta" }).catch(err => console.error("Fallo trazabilidad:", err));
      res.json({ data: invoice });
    } catch (error: any) {
      console.error('Error al actualizar factura:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  };

  deleteRentInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      await this.getService().deleteRentInvoice(id, userId);
      const invoice = await this.getService().getRentInvoiceById(id, userId);
      trazabilityService.registerTrazability({ authUserId: userId, buildingId: invoice?.buildingId || null, action: ActionsValues['ELIMINAR'], module: ModuleValues.DOCUMENTOS, description: "Eliminar factura de Renta" }).catch(err => console.error("Fallo trazabilidad:", err));
      res.status(200).json({ message: 'Factura eliminada correctamente' });
    } catch (error: any) {
      console.error('Error al eliminar factura:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  };

  // ========== RESUMEN MENSUAL ==========

  getMonthlyRentSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { buildingId, month } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (!buildingId || !month) {
        res.status(400).json({ error: 'buildingId y month son requeridos' });
        return;
      }

      // Validar formato de mes (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(month)) {
        res.status(400).json({ error: 'Formato de mes inválido. Debe ser YYYY-MM' });
        return;
      }

      const summary = await this.getService().getMonthlyRentSummary(buildingId, month, userId);
      res.json({ data: summary });
    } catch (error: any) {
      console.error('Error al obtener resumen mensual:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  };
}

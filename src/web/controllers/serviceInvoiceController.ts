import { Request, Response } from 'express';
import { ServiceInvoiceService } from '../../domain/services/serviceInvoiceService';
import { CreateServiceInvoiceRequest, UpdateServiceInvoiceRequest, ServiceType } from '../../types/serviceInvoice';

export class ServiceInvoiceController {
  private getService() {
    return new ServiceInvoiceService();
  }

  createServiceInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const data: CreateServiceInvoiceRequest = req.body;

      // Validación básica
      if (!data.building_id || !data.service_type || !data.invoice_date || data.amount_eur === undefined) {
        res.status(400).json({ error: 'Faltan campos requeridos: building_id, service_type, invoice_date, amount_eur' });
        return;
      }

      // Validar service_type
      const validServiceTypes: ServiceType[] = ['electricity', 'water', 'gas', 'ibi', 'waste'];
      if (!validServiceTypes.includes(data.service_type)) {
        res.status(400).json({ error: `service_type debe ser uno de: ${validServiceTypes.join(', ')}` });
        return;
      }

      // Validar amount_eur
      if (data.amount_eur < 0) {
        res.status(400).json({ error: 'amount_eur debe ser >= 0' });
        return;
      }

      const invoice = await this.getService().createServiceInvoice(data, userId);
      res.status(201).json({ data: invoice });
    } catch (error: any) {
      console.error('Error al crear factura de servicio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getServiceInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { buildingId } = req.params;
      const serviceType = req.query.serviceType as string | undefined;
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

      const invoices = await this.getService().getServiceInvoicesByBuilding(
        buildingId,
        userId,
        serviceType,
        year,
        month
      );
      res.json({ data: invoices });
    } catch (error) {
      console.error('Error al obtener facturas de servicio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getServiceInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const invoice = await this.getService().getServiceInvoiceById(id, userId);

      if (!invoice) {
        res.status(404).json({ error: 'Factura de servicio no encontrada' });
        return;
      }

      res.json({ data: invoice });
    } catch (error) {
      console.error('Error al obtener factura de servicio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  updateServiceInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const data: UpdateServiceInvoiceRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      // Validar service_type si se está actualizando
      if (data.service_type) {
        const validServiceTypes: ServiceType[] = ['electricity', 'water', 'gas', 'ibi', 'waste'];
        if (!validServiceTypes.includes(data.service_type)) {
          res.status(400).json({ error: `service_type debe ser uno de: ${validServiceTypes.join(', ')}` });
          return;
        }
      }

      // Validar amount_eur si se está actualizando
      if (data.amount_eur !== undefined && data.amount_eur < 0) {
        res.status(400).json({ error: 'amount_eur debe ser >= 0' });
        return;
      }

      const invoice = await this.getService().updateServiceInvoice(id, data, userId);

      if (!invoice) {
        res.status(404).json({ error: 'Factura de servicio no encontrada' });
        return;
      }

      res.json({ data: invoice });
    } catch (error) {
      console.error('Error al actualizar factura de servicio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  deleteServiceInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      await this.getService().deleteServiceInvoice(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar factura de servicio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}



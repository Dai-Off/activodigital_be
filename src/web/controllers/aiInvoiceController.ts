import { Request, Response } from 'express';
import { AIProcessingService } from '../../domain/services/aiProcessingService';
import { InvoiceProcessingJobService } from '../../domain/services/invoiceProcessingJobService';
import { UserService } from '../../domain/services/userService';
import { addInvoiceProcessingJob } from '../../services/invoiceProcessingQueue';

export class AIInvoiceController {
  private aiProcessingService = new AIProcessingService();
  private invoiceJobService = new InvoiceProcessingJobService();
  private userService = new UserService();

  /** Síncrono: extrae datos de la factura y devuelve el resultado (bloquea hasta terminar). */
  extractInvoiceData = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
        return;
      }

      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400).json({ 
          error: 'Formato de archivo no soportado. Solo se aceptan imágenes (JPEG, PNG) y PDF.',
          supportedFormats: allowedMimeTypes
        });
        return;
      }

      const extractedData = await this.aiProcessingService.extractInvoiceData(req.file.buffer);

      res.status(200).json({
        success: true,
        data: extractedData
      });
    } catch (error) {
      console.error('Error al extraer datos de factura:', error);
      res.status(500).json({
        error: 'Error al procesar la factura',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * Asíncrono: encola el procesamiento de la factura y devuelve job_id de inmediato.
   * Body: { document_url, document_filename, building_id }.
   * El usuario puede seguir usando la app; recibirá una notificación cuando esté listo.
   */
  extractInvoiceAsync = async (req: Request, res: Response): Promise<void> => {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const profile = await this.userService.getUserByAuthId(authUserId);
      if (!profile) {
        res.status(401).json({ error: 'Usuario no encontrado' });
        return;
      }
      const appUserId = profile.id;

      const { document_url, document_filename, building_id } = req.body as {
        document_url?: string;
        document_filename?: string;
        building_id?: string;
      };

      if (!document_url || !document_filename || !building_id) {
        res.status(400).json({
          error: 'Faltan campos: document_url, document_filename y building_id son obligatorios.',
        });
        return;
      }

      const job = await this.invoiceJobService.create({
        user_id: appUserId,
        building_id: building_id,
        document_url,
        document_filename,
      });

      await addInvoiceProcessingJob(job.id);

      res.status(202).json({
        success: true,
        job_id: job.id,
        message: 'El documento se ha encolado para procesamiento. Recibirás una notificación cuando esté listo.',
      });
    } catch (error) {
      console.error('Error al encolar factura:', error);
      res.status(500).json({
        error: 'Error al encolar el procesamiento de la factura',
        details: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /** Obtiene el estado de un job de factura (para polling). Solo el dueño del job puede consultarlo. */
  getInvoiceJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const profile = await this.userService.getUserByAuthId(authUserId);
      if (!profile) {
        res.status(401).json({ error: 'Usuario no encontrado' });
        return;
      }

      const { id } = req.params;
      const job = await this.invoiceJobService.getByIdForUser(id, profile.id);
      if (!job) {
        res.status(404).json({ error: 'Job no encontrado' });
        return;
      }

      res.status(200).json({
        job_id: job.id,
        status: job.status,
        document_url: job.document_url,
        document_filename: job.document_filename,
        extracted_data: job.status === 'completed' ? job.extracted_data : undefined,
        error_message: job.status === 'failed' ? job.error_message : undefined,
        created_at: job.created_at,
        updated_at: job.updated_at,
      });
    } catch (error) {
      console.error('Error al obtener job:', error);
      res.status(500).json({
        error: 'Error al obtener el estado del job',
        details: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };
}

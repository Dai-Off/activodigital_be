import { Request, Response } from 'express';
import { AIProcessingService } from '../../domain/services/aiProcessingService';

export class AIInvoiceController {
  private aiProcessingService = new AIProcessingService();

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
}

import { Request, Response } from 'express';
import { CertificateProcessingJobService } from '../../domain/services/certificateProcessingJobService';
import { UserService } from '../../domain/services/userService';
import { addCertificateProcessingJob } from '../../services/certificateProcessingQueue';

export class AICertificateController {
  private certificateJobService = new CertificateProcessingJobService();
  private userService = new UserService();

  /**
   * Asíncrono: encola el procesamiento del certificado energético y devuelve job_id de inmediato.
   * Body: { image_url, document_filename, building_id } y opcionalmente storage_path, storage_file_name, file_size, mime_type.
   */
  extractCertificateAsync = async (req: Request, res: Response): Promise<void> => {
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

      const {
        image_url,
        document_filename,
        building_id,
        storage_path,
        storage_file_name,
        file_size,
        mime_type,
      } = req.body as {
        image_url?: string;
        document_filename?: string;
        building_id?: string;
        storage_path?: string;
        storage_file_name?: string;
        file_size?: number;
        mime_type?: string;
      };

      if (!image_url || !document_filename || !building_id) {
        res.status(400).json({
          error: 'Faltan campos: image_url, document_filename y building_id son obligatorios.',
        });
        return;
      }

      const job = await this.certificateJobService.create({
        user_id: appUserId,
        building_id,
        image_url,
        document_filename,
        storage_path,
        storage_file_name,
        file_size,
        mime_type,
      });

      await addCertificateProcessingJob(job.id);

      res.status(202).json({
        success: true,
        job_id: job.id,
        message: 'El certificado se ha encolado para procesamiento. Recibirás una notificación cuando esté listo.',
      });
    } catch (error) {
      console.error('Error al encolar certificado:', error);
      res.status(500).json({
        error: 'Error al encolar el procesamiento del certificado',
        details: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /** Obtiene el estado de un job de certificado (para polling). Solo el dueño del job puede consultarlo. */
  getCertificateJob = async (req: Request, res: Response): Promise<void> => {
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
      const job = await this.certificateJobService.getByIdForUser(id, profile.id);
      if (!job) {
        res.status(404).json({ error: 'Job no encontrado' });
        return;
      }

      res.status(200).json({
        job_id: job.id,
        status: job.status,
        image_url: job.image_url,
        document_filename: job.document_filename,
        extracted_data: job.status === 'completed' ? job.extracted_data : undefined,
        error_message: job.status === 'failed' ? job.error_message : undefined,
        storage_path: job.storage_path ?? undefined,
        storage_file_name: job.storage_file_name ?? undefined,
        file_size: job.file_size ?? undefined,
        mime_type: job.mime_type ?? undefined,
        created_at: job.created_at,
        updated_at: job.updated_at,
      });
    } catch (error) {
      console.error('Error al obtener job de certificado:', error);
      res.status(500).json({
        error: 'Error al obtener el estado del job',
        details: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };
}

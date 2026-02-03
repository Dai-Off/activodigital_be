import * as cron from 'node-cron';
import { DocumentExpirationAlertService } from '../domain/services/documentExpirationAlertService';
import logger from '../utils/logger';

/**
 * Servicio de cronjob para buscar y reportar documentos próximos a vencer (próximos 7 días)
 * Se ejecuta diariamente a las 2:00 AM
 * NO modifica la base de datos, solo busca y reporta
 */
export class DocumentExpirationCronJob {
  private service: DocumentExpirationAlertService;
  private task: cron.ScheduledTask | null = null;

  constructor() {
    this.service = new DocumentExpirationAlertService();
  }

  /**
   * Inicia el cronjob
   * Se ejecuta diariamente a las 2:00 AM
   * Formato cron: "0 2 * * *" = minuto 0, hora 2, todos los días, todos los meses, todos los días de la semana
   */
  start(): void {
    // Ejecutar diariamente a las 2:00 AM
    // Formato: segundo minuto hora día mes día-semana
    // "0 2 * * *" = 2:00 AM todos los días
    this.task = cron.schedule('0 2 * * *', async () => {
      await this.execute();
    }, {
      scheduled: true,
      timezone: "Europe/Madrid" // Ajustar según tu zona horaria
    });

    logger.info('📅 Cronjob de alertas de documentos próximos a vencer iniciado. Se ejecutará diariamente a las 2:00 AM');

    // Ejecutar inmediatamente al iniciar (opcional, para testing)
    // Descomentar si quieres que se ejecute al iniciar el servidor
    // this.execute();
  }

  /**
   * Ejecuta la búsqueda de documentos próximos a vencer (próximos 7 días)
   * NO modifica la base de datos, solo busca y reporta
   */
  async execute(): Promise<void> {
    try {
      logger.info('🔄 Buscando documentos próximos a vencer (próximos 7 días)...');
      
      const startTime = Date.now();
      const result = await this.service.findDocumentsExpiringSoon();
      const duration = Date.now() - startTime;

      logger.info(`✅ Búsqueda completada en ${duration}ms`, {
        total: result.total,
        building_documents: result.building_documents,
        unit_documents: result.unit_documents,
        service_invoices: result.service_invoices,
      });

      // Si hay documentos próximos a vencer, log de alerta
      if (result.total > 0) {
        logger.warn(`⚠️ Se encontraron ${result.total} documentos próximos a vencer (próximos 7 días)`);
        logger.warn(`   - Documentos de edificios: ${result.building_documents}`);
        logger.warn(`   - Documentos de unidades: ${result.unit_documents}`);
        logger.warn(`   - Facturas de servicios: ${result.service_invoices}`);
      } else {
        logger.info('✅ No hay documentos próximos a vencer');
      }
    } catch (error: any) {
      logger.error('❌ Error al ejecutar cronjob de alertas de documentos:', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Detiene el cronjob
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('🛑 Cronjob de alertas de documentos detenido');
    }
  }

  /**
   * Obtiene información del cronjob
   */
  getStatus(): { running: boolean; schedule: string; description: string } {
    return {
      running: this.task !== null,
      schedule: '0 2 * * *',
      description: 'Diariamente a las 2:00 AM',
    };
  }
}

// Singleton para usar en toda la aplicación
let cronJobInstance: DocumentExpirationCronJob | null = null;

export function getDocumentExpirationCronJob(): DocumentExpirationCronJob {
  if (!cronJobInstance) {
    cronJobInstance = new DocumentExpirationCronJob();
  }
  return cronJobInstance;
}


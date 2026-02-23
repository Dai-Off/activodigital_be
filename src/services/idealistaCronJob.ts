import * as cron from 'node-cron';
import { getSupabaseClient } from '../lib/supabase';
import { ApifyService } from '../domain/services/idealistaScraperService';
import { getIdealistaPriceService } from '../domain/services/idealistaPriceService';
import { ScrapeIdealistaRequest } from '../types/idealistaScraper';
import logger from '../utils/logger';

/**
 * Servicio de cronjob para ejecutar el scraping de Idealista mensualmente
 * Se ejecuta el día 1 de cada mes a las 9:00 AM (Hora Madrid)
 */
export class IdealistaCronJob {
    private apifyService: ApifyService;
    private task: cron.ScheduledTask | null = null;

    constructor() {
        this.apifyService = new ApifyService();
    }

    /**
     * Inicia el cronjob
     * Horario: 9:00 AM del primer día de cada mes
     * Formato cron: "0 9 1 * *"
     */
    start(): void {
        // "0 9 1 * *" = minuto 0, hora 9, día 1 del mes, todos los meses, todos los días de la semana
        this.task = cron.schedule('0 9 1 * *', async () => {
            // this.task = cron.schedule('*/1 * * * *', async () => {
            await this.execute();
        }, {
            timezone: "Europe/Madrid"
        });

        logger.info('📅 Cronjob de Idealista iniciado. Se ejecutará el día 1 de cada mes a las 9:00 AM');
    }

    /**
     * Ejecuta el proceso de scraping
     * 1. Obtiene municipios de los edificios
     * 2. Delega la sincronización al IdealistaPriceService
     */
    async execute(): Promise<void> {
        try {
            logger.info('🔄 Iniciando cronjob de Idealista...');

            const supabase = getSupabaseClient();
            const priceService = new ApifyService(); // Debería usar el IdealistaPriceService para consistencia

            // 1. Obtener todos los edificios para extraer municipios
            const { data: buildings, error } = await supabase
                .from('buildings')
                .select('id, municipality');

            if (error) {
                throw new Error(`Error al obtener edificios: ${error.message}`);
            }

            if (!buildings || buildings.length === 0) {
                logger.info('⚠️ No se encontraron edificios para procesar.');
                return;
            }

            const idealistaPriceService = getIdealistaPriceService();

            // 2. Ejecutar sincronización para cada edificio que tenga municipio
            for (const building of buildings) {
                if (building.municipality) {
                    await idealistaPriceService.syncPriceForBuilding(building.id, building.municipality);
                }
            }

            logger.info('✅ Cronjob de Idealista finalizado.');

        } catch (error: any) {
            logger.error('❌ Error general en cronjob de Idealista:', error);
        }
    }

    /**
     * Detiene el cronjob
     */
    stop(): void {
        if (this.task) {
            this.task.stop();
            this.task = null;
            logger.info('🛑 Cronjob de Idealista detenido');
        }
    }
}

// Singleton
let cronJobInstance: IdealistaCronJob | null = null;

export function getIdealistaCronJob(): IdealistaCronJob {
    if (!cronJobInstance) {
        cronJobInstance = new IdealistaCronJob();
    }
    return cronJobInstance;
}

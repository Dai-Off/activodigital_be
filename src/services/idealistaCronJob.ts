import * as cron from 'node-cron';
import { getSupabaseClient } from '../lib/supabase';
import { ApifyService } from '../domain/services/idealistaScraperService';
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
     * 2. Ejecuta scraper para cada municipio
     * 3. Guarda los resultados en la base de datos
     */
    async execute(): Promise<void> {
        try {
            logger.info('🔄 Iniciando cronjob de Idealista...');

            const supabase = getSupabaseClient();

            // 1. Obtener todos los edificios para extraer municipios
            const { data: buildings, error } = await supabase
                .from('buildings')
                .select('id, address_data, municipality');

            if (error) {
                throw new Error(`Error al obtener edificios: ${error.message}`);
            }

            if (!buildings || buildings.length === 0) {
                logger.info('⚠️ No se encontraron edificios para procesar.');
                return;
            }

            // 2. Agrupar edificios por municipio
            const buildingsByMunicipality = new Map<string, string[]>();

            buildings.forEach((building: any) => {
                const municipality = building.municipality;
                if (municipality) {
                    if (!buildingsByMunicipality.has(municipality)) {
                        buildingsByMunicipality.set(municipality, []);
                    }
                    buildingsByMunicipality.get(municipality)?.push(building.id);
                }
            });

            const uniqueMunicipalities = Array.from(buildingsByMunicipality.keys());
            logger.info(`📍 Municipios encontrados: ${uniqueMunicipalities.length}`, uniqueMunicipalities);

            // 3. Ejecutar scraper para cada municipio
            for (const municipality of uniqueMunicipalities) {
                try {
                    logger.info(`🔎 Scraping Idealista para: ${municipality}`);

                    const request: ScrapeIdealistaRequest = {
                        locationName: municipality,
                        maxItems: 100 // Límite por defecto para no sobrecargar
                    };

                    const result = await this.apifyService.scrapeIdealistaProperties(request);

                    logger.info(`✅ Scraping completado para ${municipality}`, {
                        totalItems: result.totalItems,
                        averagePrice: result.averagePrice,
                        averagePricePerSqm: result.averagePricePerSqm
                    });

                    // 4. Guardar resultados para cada edificio en este municipio
                    const buildingIds = buildingsByMunicipality.get(municipality) || [];
                    const now = new Date();
                    const year = now.getFullYear();
                    // Obtener número del mes (1-12)
                    const mes = now.getMonth() + 1;

                    for (const buildingId of buildingIds) {
                        try {
                            // Insertar en la tabla price_average_building_idealist (Histórico)
                            const { error: insertError } = await supabase
                                .from('price_average_building_idealist')
                                .insert({
                                    building_id: buildingId,
                                    totalItems: result.totalItems,
                                    averagePrice: result.averagePrice,
                                    averagePricePerSqm: result.averagePricePerSqm,
                                    year: year,
                                    month: mes
                                });

                            if (insertError) {
                                logger.error(`❌ Error guardando datos para edificio ${buildingId}: ${insertError.message}`);
                            }
                        } catch (insertErr: any) {
                            logger.error(`❌ Error inesperado guardando datos para edificio ${buildingId}: ${insertErr.message}`);
                        }
                    }

                    logger.info(`💾 Datos guardados para ${buildingIds.length} edificios en ${municipality}`);

                } catch (err: any) {
                    logger.error(`❌ Error scraping ${municipality}: ${err.message}`);
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

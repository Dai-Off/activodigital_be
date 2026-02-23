import { getSupabaseClient } from '../../lib/supabase';
import { ApifyService } from './idealistaScraperService';
import { ScrapeIdealistaRequest } from '../../types/idealistaScraper';
import logger from '../../utils/logger';

export class IdealistaPriceService {
    private apifyService: ApifyService;

    constructor() {
        this.apifyService = new ApifyService();
    }

    /**
     * Sincroniza los datos de Idealista para un edificio específico.
     * Busca si ya existe información para esa municipalidad en el mes actual.
     * Si existe, copia los valores. Si no, realiza un scraping.
     */
    async syncPriceForBuilding(buildingId: string, municipality: string): Promise<void> {
        try {
            const supabase = getSupabaseClient();
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;

            logger.info(`🔄 Sincronizando precios Idealista para edificio ${buildingId} (${municipality}) - ${month}/${year}`);

            // 1. Buscar si ya existe un registro para esta municipalidad en este mes
            // Consultamos la tabla price_average_building_idealist haciendo join con la tabla buildings 
            // para filtrar por municipalidad.
            const { data: existingData, error: searchError } = await supabase
                .from('price_average_building_idealist')
                .select(`
          totalItems,
          averagePrice,
          averagePricePerSqm,
          buildings!inner(municipality)
        `)
                .eq('buildings.municipality', municipality)
                .eq('year', year)
                .eq('month', month)
                .limit(1);

            if (searchError) {
                logger.error(`❌ Error buscando datos existentes para ${municipality}: ${searchError.message}`);
            }

            if (existingData && existingData.length > 0) {
                const sourceData = existingData[0];
                logger.info(`✅ Datos encontrados para la municipalidad ${municipality}. Copiando al edificio ${buildingId}...`);

                const { error: insertError } = await supabase
                    .from('price_average_building_idealist')
                    .insert({
                        building_id: buildingId,
                        totalItems: sourceData.totalItems,
                        averagePrice: sourceData.averagePrice,
                        averagePricePerSqm: sourceData.averagePricePerSqm,
                        year: year,
                        month: month
                    });

                if (insertError) {
                    logger.error(`❌ Error al copiar datos existentes para edificio ${buildingId}: ${insertError.message}`);
                }
                return;
            }

            // 2. Si no existe, realizar scraping
            logger.info(`🔎 No hay datos previos para ${municipality} este mes. Iniciando scraping...`);

            const request: ScrapeIdealistaRequest = {
                locationName: municipality,
                maxItems: 100
            };

            const result = await this.apifyService.scrapeIdealistaProperties(request);

            logger.info(`✅ Scraping completado para ${municipality}`, {
                totalItems: result.totalItems,
                averagePrice: result.averagePrice,
                averagePricePerSqm: result.averagePricePerSqm
            });

            // 3. Guardar el nuevo registro
            const { error: finalInsertError } = await supabase
                .from('price_average_building_idealist')
                .insert({
                    building_id: buildingId,
                    totalItems: result.totalItems,
                    averagePrice: result.averagePrice,
                    averagePricePerSqm: result.averagePricePerSqm,
                    year: year,
                    month: month
                });

            if (finalInsertError) {
                logger.error(`❌ Error guardando nuevos datos de scraping para edificio ${buildingId}: ${finalInsertError.message}`);
            }

        } catch (error: any) {
            logger.error(`❌ Error crítico en syncPriceForBuilding para ${buildingId}:`, error);
        }
    }
}

// Singleton
let instance: IdealistaPriceService | null = null;
export function getIdealistaPriceService(): IdealistaPriceService {
    if (!instance) {
        instance = new IdealistaPriceService();
    }
    return instance;
}

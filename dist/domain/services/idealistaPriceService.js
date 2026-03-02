"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdealistaPriceService = void 0;
exports.getIdealistaPriceService = getIdealistaPriceService;
const supabase_1 = require("../../lib/supabase");
const idealistaScraperService_1 = require("./idealistaScraperService");
const logger_1 = __importDefault(require("../../utils/logger"));
class IdealistaPriceService {
    constructor() {
        this.apifyService = new idealistaScraperService_1.ApifyService();
    }
    /**
     * Sincroniza los datos de Idealista para un edificio específico.
     * Busca si ya existe información para esa municipalidad en el mes actual.
     * Si existe, copia los valores. Si no, realiza un scraping.
     */
    async syncPriceForBuilding(buildingId, municipality) {
        try {
            const supabase = (0, supabase_1.getSupabaseClient)();
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            logger_1.default.info(`🔄 Sincronizando precios Idealista para edificio ${buildingId} (${municipality}) - ${month}/${year}`);
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
                logger_1.default.error(`❌ Error buscando datos existentes para ${municipality}: ${searchError.message}`);
            }
            if (existingData && existingData.length > 0) {
                const sourceData = existingData[0];
                logger_1.default.info(`✅ Datos encontrados para la municipalidad ${municipality}. Copiando al edificio ${buildingId}...`);
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
                    logger_1.default.error(`❌ Error al copiar datos existentes para edificio ${buildingId}: ${insertError.message}`);
                }
                return;
            }
            // 2. Si no existe, realizar scraping
            logger_1.default.info(`🔎 No hay datos previos para ${municipality} este mes. Iniciando scraping...`);
            const request = {
                locationName: municipality,
                maxItems: 100
            };
            const result = await this.apifyService.scrapeIdealistaProperties(request);
            logger_1.default.info(`✅ Scraping completado para ${municipality}`, {
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
                logger_1.default.error(`❌ Error guardando nuevos datos de scraping para edificio ${buildingId}: ${finalInsertError.message}`);
            }
        }
        catch (error) {
            logger_1.default.error(`❌ Error crítico en syncPriceForBuilding para ${buildingId}:`, error);
        }
    }
}
exports.IdealistaPriceService = IdealistaPriceService;
// Singleton
let instance = null;
function getIdealistaPriceService() {
    if (!instance) {
        instance = new IdealistaPriceService();
    }
    return instance;
}
//# sourceMappingURL=idealistaPriceService.js.map
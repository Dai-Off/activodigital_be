"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdealistaCronJob = void 0;
exports.getIdealistaCronJob = getIdealistaCronJob;
const cron = __importStar(require("node-cron"));
const supabase_1 = require("../lib/supabase");
const idealistaScraperService_1 = require("../domain/services/idealistaScraperService");
const idealistaPriceService_1 = require("../domain/services/idealistaPriceService");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Servicio de cronjob para ejecutar el scraping de Idealista mensualmente
 * Se ejecuta el día 1 de cada mes a las 9:00 AM (Hora Madrid)
 */
class IdealistaCronJob {
    constructor() {
        this.task = null;
        this.apifyService = new idealistaScraperService_1.ApifyService();
    }
    /**
     * Inicia el cronjob
     * Horario: 9:00 AM del primer día de cada mes
     * Formato cron: "0 9 1 * *"
     */
    start() {
        // "0 9 1 * *" = minuto 0, hora 9, día 1 del mes, todos los meses, todos los días de la semana
        this.task = cron.schedule('0 9 1 * *', async () => {
            // this.task = cron.schedule('*/1 * * * *', async () => {
            await this.execute();
        }, {
            timezone: "Europe/Madrid"
        });
        logger_1.default.info('📅 Cronjob de Idealista iniciado. Se ejecutará el día 1 de cada mes a las 9:00 AM');
    }
    /**
     * Ejecuta el proceso de scraping
     * 1. Obtiene municipios de los edificios
     * 2. Delega la sincronización al IdealistaPriceService
     */
    async execute() {
        try {
            logger_1.default.info('🔄 Iniciando cronjob de Idealista...');
            const supabase = (0, supabase_1.getSupabaseClient)();
            const priceService = new idealistaScraperService_1.ApifyService(); // Debería usar el IdealistaPriceService para consistencia
            // 1. Obtener todos los edificios para extraer municipios
            const { data: buildings, error } = await supabase
                .from('buildings')
                .select('id, municipality');
            if (error) {
                throw new Error(`Error al obtener edificios: ${error.message}`);
            }
            if (!buildings || buildings.length === 0) {
                logger_1.default.info('⚠️ No se encontraron edificios para procesar.');
                return;
            }
            const idealistaPriceService = (0, idealistaPriceService_1.getIdealistaPriceService)();
            // 2. Ejecutar sincronización para cada edificio que tenga municipio
            for (const building of buildings) {
                if (building.municipality) {
                    await idealistaPriceService.syncPriceForBuilding(building.id, building.municipality);
                }
            }
            logger_1.default.info('✅ Cronjob de Idealista finalizado.');
        }
        catch (error) {
            logger_1.default.error('❌ Error general en cronjob de Idealista:', error);
        }
    }
    /**
     * Detiene el cronjob
     */
    stop() {
        if (this.task) {
            this.task.stop();
            this.task = null;
            logger_1.default.info('🛑 Cronjob de Idealista detenido');
        }
    }
}
exports.IdealistaCronJob = IdealistaCronJob;
// Singleton
let cronJobInstance = null;
function getIdealistaCronJob() {
    if (!cronJobInstance) {
        cronJobInstance = new IdealistaCronJob();
    }
    return cronJobInstance;
}
//# sourceMappingURL=idealistaCronJob.js.map
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
exports.DocumentExpirationCronJob = void 0;
exports.getDocumentExpirationCronJob = getDocumentExpirationCronJob;
const cron = __importStar(require("node-cron"));
const documentExpirationAlertService_1 = require("../domain/services/documentExpirationAlertService");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Servicio de cronjob para buscar y reportar documentos próximos a vencer (próximos 7 días)
 * Se ejecuta diariamente a las 2:00 AM
 * NO modifica la base de datos, solo busca y reporta
 */
class DocumentExpirationCronJob {
    constructor() {
        this.task = null;
        this.service = new documentExpirationAlertService_1.DocumentExpirationAlertService();
    }
    /**
     * Inicia el cronjob
     * Se ejecuta diariamente a las 2:00 AM
     * Formato cron: "0 2 * * *" = minuto 0, hora 2, todos los días, todos los meses, todos los días de la semana
     */
    start() {
        // Ejecutar diariamente a las 2:00 AM
        // Formato: segundo minuto hora día mes día-semana
        // "0 2 * * *" = 2:00 AM todos los días
        this.task = cron.schedule('0 2 * * *', async () => {
            await this.execute();
        }, {
            timezone: "Europe/Madrid" // Ajustar según tu zona horaria
        });
        logger_1.default.info('📅 Cronjob de alertas de documentos próximos a vencer iniciado. Se ejecutará diariamente a las 2:00 AM');
        // Ejecutar inmediatamente al iniciar (opcional, para testing)
        // Descomentar si quieres que se ejecute al iniciar el servidor
        // this.execute();
    }
    /**
     * Ejecuta la búsqueda de documentos próximos a vencer (próximos 7 días)
     * NO modifica la base de datos, solo busca y reporta
     */
    async execute() {
        try {
            logger_1.default.info('🔄 Buscando documentos próximos a vencer (próximos 7 días)...');
            const startTime = Date.now();
            const result = await this.service.findDocumentsExpiringSoon();
            const duration = Date.now() - startTime;
            logger_1.default.info(`✅ Búsqueda completada en ${duration}ms`, {
                total: result.total,
                building_documents: result.building_documents,
                unit_documents: result.unit_documents,
                service_invoices: result.service_invoices,
            });
            // Si hay documentos próximos a vencer, log de alerta
            if (result.total > 0) {
                logger_1.default.warn(`⚠️ Se encontraron ${result.total} documentos próximos a vencer (próximos 7 días)`);
                logger_1.default.warn(`   - Documentos de edificios: ${result.building_documents}`);
                logger_1.default.warn(`   - Documentos de unidades: ${result.unit_documents}`);
                logger_1.default.warn(`   - Facturas de servicios: ${result.service_invoices}`);
            }
            else {
                logger_1.default.info('✅ No hay documentos próximos a vencer');
            }
        }
        catch (error) {
            logger_1.default.error('❌ Error al ejecutar cronjob de alertas de documentos:', {
                error: error.message,
                stack: error.stack,
            });
        }
    }
    /**
     * Detiene el cronjob
     */
    stop() {
        if (this.task) {
            this.task.stop();
            this.task = null;
            logger_1.default.info('🛑 Cronjob de alertas de documentos detenido');
        }
    }
    /**
     * Obtiene información del cronjob
     */
    getStatus() {
        return {
            running: this.task !== null,
            schedule: '0 2 * * *',
            description: 'Diariamente a las 2:00 AM',
        };
    }
}
exports.DocumentExpirationCronJob = DocumentExpirationCronJob;
// Singleton para usar en toda la aplicación
let cronJobInstance = null;
function getDocumentExpirationCronJob() {
    if (!cronJobInstance) {
        cronJobInstance = new DocumentExpirationCronJob();
    }
    return cronJobInstance;
}
//# sourceMappingURL=documentExpirationCronJob.js.map
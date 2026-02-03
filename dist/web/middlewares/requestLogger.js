"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Middleware para registrar todas las peticiones entrantes.
 * Envía los datos tanto al log local como al transport de Supabase.
 */
const requestLogger = (req, res, next) => {
    res.on('finish', () => {
        const { method, originalUrl, ip, user } = req;
        const userAgent = req.get('user-agent') || 'unknown';
        const statusCode = res.statusCode;
        const logMessage = `${method} ${originalUrl} ${statusCode} - IP: ${ip} - UA: ${userAgent} ${user?.id ? `UserId: ${user?.id}` : 'Anonymous'} `;
        logger_1.default.info(logMessage, {
            ip,
            userId: user?.id || 'Anonymous',
            userAgent,
            statusCode,
            method,
            path: originalUrl
        });
    });
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=requestLogger.js.map
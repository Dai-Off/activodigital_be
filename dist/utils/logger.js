"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const SupabaseDatabaseTransport_1 = require("../lib/SupabaseDatabaseTransport");
const logDirectory = 'logs';
const logFilename = 'access.log';
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }), winston_1.default.format.printf((info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)),
    transports: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDirectory, logFilename),
            level: 'info'
        }),
        new winston_1.default.transports.Console({
            format: winston_1.default.format.simple()
        })
    ]
});
if (process.env.NODE_ENV === 'production') {
    logger.add(SupabaseDatabaseTransport_1.supabaseDatabaseTransport);
}
exports.default = logger;
//# sourceMappingURL=logger.js.map
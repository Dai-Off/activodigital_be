"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisConnection = getRedisConnection;
exports.closeRedisConnection = closeRedisConnection;
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient = null;
/**
 * Obtiene el cliente Redis para la cola de trabajos.
 * Usar REDIS_URL en .env (ej: redis://localhost:6379).
 */
function getRedisConnection() {
    if (!redisClient) {
        redisClient = new ioredis_1.default(REDIS_URL, {
            maxRetriesPerRequest: null, // Requerido por BullMQ para workers
            enableReadyCheck: true,
            retryStrategy(times) {
                const delay = Math.min(times * 500, 5000);
                return delay;
            },
        });
        redisClient.on('error', (err) => {
            const message = err instanceof Error ? err.message : String(err);
            console.error('[Redis] Error:', message);
        });
    }
    return redisClient;
}
/**
 * Cierra la conexión Redis (útil para graceful shutdown).
 */
async function closeRedisConnection() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
}
//# sourceMappingURL=redis.js.map
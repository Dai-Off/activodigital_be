import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: Redis | null = null;

/**
 * Obtiene el cliente Redis para la cola de trabajos.
 * Usar REDIS_URL en .env (ej: redis://localhost:6379).
 */
export function getRedisConnection(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null, // Requerido por BullMQ para workers
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 500, 5000);
        return delay;
      },
    });
    redisClient.on('error', (err) => {
      console.error('[Redis] Error:', err.message);
    });
  }
  return redisClient;
}

/**
 * Cierra la conexión Redis (útil para graceful shutdown).
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

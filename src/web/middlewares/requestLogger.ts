import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';

/**
 * Middleware para registrar todas las peticiones entrantes.
 * Envía los datos tanto al log local como al transport de Supabase.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    const { method, originalUrl, ip, user } = req;
    const userAgent = req.get('user-agent') || 'unknown';
    const statusCode = res.statusCode;

    const logMessage = `${method} ${originalUrl} ${statusCode} - IP: ${ip} - UA: ${userAgent} ${user?.id ? `UserId: ${user?.id}` : 'Anonymous'} `;

    logger.info(logMessage, {
      ip,
      userId: user?.id  || 'Anonymous',
      userAgent,
      statusCode,
      method,
      path: originalUrl
    });
  });

  next();
};
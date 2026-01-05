import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';

/**
 * Middleware para registrar todas las peticiones entrantes.
 * Guarda: Método, URL, IP y User-Agent.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Registrar la petición al inicio o al final. 
  // Al usar 'finish', podemos registrar el código de estado de la respuesta.
  res.on('finish', () => {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const statusCode = res.statusCode;

    const logMessage = `${method} ${originalUrl} ${statusCode} - IP: ${ip} - UA: ${userAgent}`;
    
    logger.info(logMessage);
  });

  next();
};

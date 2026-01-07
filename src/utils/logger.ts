import winston from 'winston';
import path from 'path';
import { supabaseDatabaseTransport } from '../lib/SupabaseDatabaseTransport';

const logDirectory = 'logs';
const logFilename = 'access.log';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf((info: any) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(logDirectory, logFilename),
      level: 'info' 
    }),
    new winston.transports.Console({
        format: winston.format.simple()
    })
  ]
});

if (process.env.NODE_ENV === 'production') {
  logger.add(supabaseDatabaseTransport);
}

export default logger;
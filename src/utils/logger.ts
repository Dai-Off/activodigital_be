import winston from 'winston';
import path from 'path';

// Definir la ruta del archivo de logs
// Se guardará en la carpeta 'logs' en la raíz del proyecto
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
    // Escribir todos los logs con nivel `info` y superior a `logs/access.log`
    new winston.transports.File({ 
      filename: path.join(logDirectory, logFilename),
      level: 'info' 
    }),
    // También mostrar en consola
    new winston.transports.Console({
        format: winston.format.simple()
    })
  ]
});

export default logger;

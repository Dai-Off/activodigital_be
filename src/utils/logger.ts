// import winston from 'winston';
// import path from 'path';

// // Definir la ruta del archivo de logs
// // Se guardará en la carpeta 'logs' en la raíz del proyecto
// const logDirectory = 'logs';
// const logFilename = 'access.log';

// const logger = winston.createLogger({
//   level: 'info',
//   format: winston.format.combine(
//     winston.format.timestamp({
//       format: 'YYYY-MM-DD HH:mm:ss'
//     }),
//     winston.format.printf((info: any) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
//   ),
//   transports: [
//     // Escribir todos los logs con nivel `info` y superior a `logs/access.log`
//     new winston.transports.File({ 
//       filename: path.join(logDirectory, logFilename),
//       level: 'info' 
//     }),
//     // También mostrar en consola
//     new winston.transports.Console({
//         format: winston.format.simple()
//     })
//   ]
// });

// export default logger;

import winston from 'winston';
import path from 'path';
import { supabaseStorageTransport } from '../lib/supabaseTransport';

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
    // Log local en archivo
    new winston.transports.File({ 
      filename: path.join(logDirectory, logFilename),
      level: 'info' 
    }),
    // Log en consola
    new winston.transports.Console({
        format: winston.format.simple()
    })
  ]
});

// Agregamos el transport de Supabase solo si estamos en producción
if (process.env.NODE_ENV === 'production') {
  logger.add(supabaseStorageTransport);
}

export default logger;
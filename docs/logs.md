# Implementación de Request Logging

Guía rápida para integrar el registro de peticiones HTTP en el sistema.

## 1. Propósito
Registrar automáticamente cada solicitud entrante para facilitar la trazabilidad, el monitoreo de errores y el análisis de rendimiento.

## 2. Integración
El `requestLogging` se implementa como un middleware global. Debe colocarse antes de la definición de las rutas para capturar todas las interacciones.

```javascript
// En el archivo principal (app.js o server.js)
const { requestLogger } = require('../web/middleware/requestLogger');

app.use(requestLogger);
```

## 3. Información Registrada
Cada entrada en el log contiene:
- **Timestamp**: Fecha y hora exacta de la petición.
- **Method**: Método HTTP (GET, POST, PUT, DELETE).
- **URL**: El endpoint solicitado.
- **
  Code**: Código de respuesta (200, 404, 500, etc.).
- **Response Time**: Tiempo que tardó el servidor en procesar la solicitud.

## 4. Ejemplo de Salida
`[2023-10-27 10:15:30] INFO: GET /api/v1/users - 200 (45ms)`


!NOTA: 
# Añadir archivo .env.test es obligatorio para que funcione el logging en el entorno de test




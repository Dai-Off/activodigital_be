"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
dotenv_1.default.config();
const port = Number(process.env.PORT) || 3000;
// Routes were moved to app.ts via routes/index
// Manejo de errores
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app_1.default.use((err, _req, res, _next) => {
    // Prefer console.error, avoids leaking internals to clients
    // In production consider structured logging
    // eslint-disable-next-line no-console
    console.error(err.stack);
    res.status(500).json({ error: "¡Algo salió mal en el servidor!" });
});
// Iniciar el servidor
const http_1 = __importDefault(require("http"));
const socketService_1 = require("./services/socketService");
// ... (imports)
// Crear servidor HTTP explícito para poder adjuntar Socket.io
const server = http_1.default.createServer(app_1.default);
// Inicializar Socket.io
socketService_1.SocketService.getInstance().initialize(server);
// Iniciar el servidor
server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Servidor corriendo en http://localhost:${port}`);
    console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`🎯 FRONTEND_URL: ${process.env.FRONTEND_URL || "NO CONFIGURADO"}`);
});
exports.default = app_1.default;
//# sourceMappingURL=index.js.map
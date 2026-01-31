"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const socket_io_1 = require("socket.io");
// Importación dinámica para evitar dependencias circulares en inicialización
const edificioService_1 = require("../domain/services/edificioService");
class SocketService {
    constructor() {
        this.io = null;
        // Mapa para trackear userId -> socketIds (un usuario puede tener múltiples pestañas)
        this.userSockets = new Map();
    }
    static getInstance() {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }
    initialize(httpServer) {
        const corsOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: corsOrigin,
                methods: ["GET", "POST"],
                credentials: true,
            },
            path: "/socket.io",
        });
        this.io.on("connection", (socket) => {
            // Log de conexión para debugging inicial
            // console.log(`[SocketService] New connection: ${socket.id}`);
            // Evento para que el usuario se identifique
            socket.on("join", async (userId) => {
                if (!userId)
                    return;
                if (!this.userSockets.has(userId)) {
                    this.userSockets.set(userId, new Set());
                }
                this.userSockets.get(userId)?.add(socket.id);
                // Unir al socket a una "room" con su userId para facilitar emisiones personales
                socket.join(userId);
                // Además, unir al usuario a las rooms de sus edificios
                try {
                    const buildingService = new edificioService_1.BuildingService();
                    // Nota: userAuthId suele ser el ID de auth (supbase), pero aquí asumimos que userId es el correcto para buscar
                    // Si userId es el UUID de la tabla users, necesitamos asegurarnos de qué ID espera getBuildingsByUser.
                    // getBuildingsByUser espera userAuthId (string).
                    const buildings = await buildingService.getBuildingsByUser(userId);
                    for (const building of buildings) {
                        const roomName = `building:${building.id}`;
                        socket.join(roomName);
                        // console.log(`[SocketService] Socket ${socket.id} joined room ${roomName}`);
                    }
                }
                catch (error) {
                    console.error(`[SocketService] Error joining building rooms for user ${userId}:`, error);
                }
            });
            socket.on("disconnect", () => {
                console.log(`[SocketService] Disconnect: ${socket.id}`);
                this.handleDisconnect(socket.id);
            });
        });
        console.log(`[SocketService] Initialized with CORS origin: ${corsOrigin}`);
    }
    emitToUser(userId, event, payload) {
        if (!this.io) {
            console.warn("[SocketService] IO not initialized. Cannot emit event.");
            return;
        }
        // Emitir a la room del usuario
        this.io.to(userId).emit(event, payload);
        console.log(`[SocketService] Emitted ${event} to user ${userId}`);
    }
    emitToRoom(room, event, payload) {
        if (!this.io) {
            console.warn("[SocketService] IO not initialized. Cannot emit event.");
            return;
        }
        this.io.to(room).emit(event, payload);
        console.log(`[SocketService] Emitted ${event} to room ${room}`);
    }
    handleDisconnect(socketId) {
        // Limpiar el socketId de los registros
        for (const [userId, sockets] of this.userSockets.entries()) {
            if (sockets.has(socketId)) {
                sockets.delete(socketId);
                if (sockets.size === 0) {
                    this.userSockets.delete(userId);
                }
                break;
            }
        }
    }
}
exports.SocketService = SocketService;
//# sourceMappingURL=socketService.js.map
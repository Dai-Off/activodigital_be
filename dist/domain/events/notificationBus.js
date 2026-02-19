"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationBus = exports.NotificationEvents = void 0;
const events_1 = require("events");
const socketService_1 = require("../../services/socketService");
// Definimos los tipos de eventos soportados
var NotificationEvents;
(function (NotificationEvents) {
    NotificationEvents["NOTIFICATION_CREATED"] = "NOTIFICATION_CREATED";
    // Se pueden agregar más tipos aquí, ej: DOCUMENT_UPLOADED, etc.
})(NotificationEvents || (exports.NotificationEvents = NotificationEvents = {}));
/**
 * NotificationBus (Singleton)
 *
 * Centraliza la emisión de eventos de notificación para desacoplar
 * la lógica de negocio del envío/persistencia de notificaciones.
 *
 * Uso:
 * NotificationBus.getInstance().emit(NotificationEvents.NOTIFICATION_CREATED, data);
 */
class NotificationBus extends events_1.EventEmitter {
    constructor() {
        super();
        this.initializeListeners();
    }
    static getInstance() {
        if (!NotificationBus.instance) {
            NotificationBus.instance = new NotificationBus();
        }
        return NotificationBus.instance;
    }
    /**
     * Inicializa los listeners por defecto.
     * Aquí es donde conectaremos con el servicio para persistir la data.
     * Al ser asíncrono, los errores deben manejarse aquí para no crashear el proceso principal.
     */
    initializeListeners() {
        this.on(NotificationEvents.NOTIFICATION_CREATED, async (payload) => {
            try {
                // Importación dinámica para evitar dependencias circulares si las hubiera
                // En este caso, importamos el servicio para persistir la notificación
                const { NotificationService } = await Promise.resolve().then(() => __importStar(require("../services/notificationService")));
                const service = new NotificationService();
                // Llamada interna para guardar en BD
                const createdNotification = await service.internalCreateNotification(payload);
                // Emitir evento via Socket.io en tiempo real (socket_emit_user_id = a quién enviar; user_id = para BD)
                const emitToUserId = payload.socket_emit_user_id ?? payload.user_id;
                if (emitToUserId) {
                    socketService_1.SocketService.getInstance().emitToUser(emitToUserId, "notification:new", createdNotification);
                }
                else if (payload.building_id) {
                    // Notificación general del edificio
                    socketService_1.SocketService.getInstance().emitToRoom(`building:${payload.building_id}`, "notification:new", createdNotification);
                }
                // Opcional: Aquí se podría integrar Supabase Realtime explícito si fuera necesario,
                // pero Supabase ya emite eventos Postgres Changes automáticamente si está configurado.
            }
            catch (error) {
                console.error(`[NotificationBus] Error processing ${NotificationEvents.NOTIFICATION_CREATED}:`, error);
                // Aquí podríamos implementar una lógica de reintentos o cola de errores muerta (DLQ)
            }
        });
        console.log("[NotificationBus] Listeners initialized");
    }
    /**
     * Wrapper tipado para emitir eventos
     */
    emit(event, payload) {
        return super.emit(event, payload);
    }
}
exports.NotificationBus = NotificationBus;
//# sourceMappingURL=notificationBus.js.map
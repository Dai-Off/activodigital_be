"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notificationService_1 = require("../../domain/services/notificationService");
class NotificationController {
    constructor() {
        this.notificationService = new notificationService_1.NotificationService();
        /**
         * Obtiene las notificaciones NO LEÍDAS de un edificio para el usuario autenticado.
         * Requiere 'buildingId' como query param.
         */
        this.getUnreadNotifications = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: "Usuario no autenticado" });
                    return;
                }
                const buildingId = req.query.buildingId;
                if (!buildingId) {
                    res.status(400).json({ error: "buildingId es requerido" });
                    return;
                }
                const limit = req.query.limit ? parseInt(req.query.limit) : 50;
                // Llama al método del servicio que filtra las leídas
                const notifications = await this.notificationService.getUnreadBuildingNotificationsForUser(userId, buildingId, limit);
                res.status(200).json({
                    data: notifications,
                    count: notifications.length,
                });
            }
            catch (error) {
                console.error("Error al obtener notificaciones no leídas:", error);
                res.status(500).json({
                    error: "Error al obtener notificaciones",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        /**
         * Obtiene todas las notificaciones de un edificio (Feed completo, leídas y no leídas).
         */
        this.getBuildingNotifications = async (req, res) => {
            try {
                const buildingId = req.query.buildingId;
                if (!buildingId) {
                    res.status(400).json({ error: "buildingId es requerido" });
                    return;
                }
                const filters = {
                    type: req.query.type,
                    limit: req.query.limit ? parseInt(req.query.limit) : 50,
                    offset: req.query.offset ? parseInt(req.query.offset) : 0,
                };
                const notifications = await this.notificationService.getBuildingNotifications(buildingId, filters);
                res.status(200).json({
                    data: notifications,
                    count: notifications.length,
                });
            }
            catch (error) {
                console.error("Error al obtener historial de notificaciones:", error);
                res.status(500).json({
                    error: "Error al obtener historial",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        /**
         * Crea notificaciones
         */
        this.createUserNotifications = async (req, res) => {
            try {
                const { building_id, type, title } = req.body;
                if (!building_id || !type || !title) {
                    res.status(400).json({ error: "Faltan campos obligatorios" });
                    return;
                }
                const notificationData = {
                    building_id: building_id,
                    type: type,
                    title: title,
                    expiration: null,
                    priority: 0,
                };
                if (req.body.expiration) {
                    notificationData.expiration = req.body.expiration;
                }
                if (req.body.priority) {
                    notificationData.priority = req.body.priority;
                }
                await this.notificationService.createNotification(notificationData);
                res.status(200).json({
                    message: "La notificación se ha creado con éxito",
                });
            }
            catch (error) {
                console.error("Error al crear notificación:", error);
                res.status(500).json({
                    error: "Error al crear la notificación",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        /**
         * Marca TODAS las notificaciones pendientes de un usuario como leídas.
         */
        this.markAllAsRead = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: "Usuario no autenticado" });
                    return;
                }
                const result = await this.notificationService.markAllAsReadForUser(userId);
                if (result.count > 0) {
                    res.status(200).json({
                        message: result.message,
                        count: result.count,
                    });
                }
                else {
                    // Si count es 0, no es un error, es que no había pendientes
                    res.status(200).json({
                        message: result.message,
                        count: 0,
                    });
                }
            }
            catch (error) {
                console.error("Error al marcar todas las notificaciones como leídas:", error);
                res.status(500).json({
                    error: "Error al marcar todas las notificaciones como leídas",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        /**
         * Obtiene todas las notificaciones asociadas a TODOS los edificios
         * administrados o relacionados con el usuario.
         */
        this.getUserNotificationsByBuilding = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: "Usuario no autenticado" });
                    return;
                }
                const filters = {
                    type: req.query.type,
                    limit: req.query.limit ? parseInt(req.query.limit) : 50,
                    offset: req.query.offset ? parseInt(req.query.offset) : 0,
                };
                // Llama al método del servicio que obtiene notificaciones por edificios del usuario
                const notifications = await this.notificationService.getUserNotifications(userId, filters);
                res.status(200).json({
                    data: notifications,
                    count: notifications.length,
                    message: `Notificaciones obtenidas para ${notifications.length} registros`,
                });
            }
            catch (error) {
                console.error("Error al obtener notificaciones por edificio de usuario:", error);
                res.status(500).json({
                    error: "Error al obtener notificaciones del usuario",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        /**
         * Marca una notificación como leída
         */
        this.markAsRead = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: "Usuario no autenticado" });
                    return;
                }
                const { id } = req.params; // Notification ID
                if (!id) {
                    res.status(400).json({ error: "ID de notificación requerido" });
                    return;
                }
                const result = await this.notificationService.markNotificationAsRead(userId, id);
                if (result.success) {
                    res.status(200).json({
                        message: result.message,
                        success: true,
                    });
                }
                else {
                    res.status(500).json({
                        error: result.message,
                        success: false,
                    });
                }
            }
            catch (error) {
                console.error("Error al marcar notificación como leída:", error);
                res.status(500).json({
                    error: "Error al marcar notificación como leída",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        /**
         * Elimina una notificación
         * Nota: Requiere buildingId para confirmar permisos sobre el edificio
         */
        this.deleteNotification = async (req, res) => {
            try {
                const { id } = req.params;
                const buildingId = req.query.buildingId || req.body.buildingId;
                if (!id || !buildingId) {
                    res
                        .status(400)
                        .json({ error: "ID de notificación y buildingId requeridos" });
                    return;
                }
                const success = await this.notificationService.deleteNotification(id, buildingId);
                if (success) {
                    res.status(200).json({
                        message: "Notificación eliminada exitosamente",
                        success: true,
                    });
                }
                else {
                    res.status(404).json({
                        error: "Notificación no encontrada",
                        success: false,
                    });
                }
            }
            catch (error) {
                console.error("Error al eliminar notificación:", error);
                res.status(500).json({
                    error: "Error al eliminar notificación",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        /**
         * Elimina notificaciones antiguas por edificio.
         * Requiere buildingId y opcionalmente days (query param).
         */
        this.deleteOldNotifications = async (req, res) => {
            try {
                // 1. Validación de buildingId
                const buildingId = req.query.buildingId;
                if (!buildingId) {
                    res
                        .status(400)
                        .json({ error: "buildingId es requerido para la limpieza" });
                    return;
                }
                // 2. Obtención de días (por defecto 30)
                const daysOld = req.query.days ? parseInt(req.query.days) : 30;
                // 3. Llamada al servicio
                const count = await this.notificationService.deleteOldNotifications(buildingId, daysOld);
                // 4. Respuesta exitosa
                res.status(200).json({
                    message: `${count} notificaciones antiguas eliminadas del edificio ${buildingId}`,
                    count,
                    daysOld,
                });
            }
            catch (error) {
                console.error("Error al eliminar notificaciones antiguas:", error);
                res.status(500).json({
                    error: "Error al eliminar notificaciones antiguas",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
    }
}
exports.NotificationController = NotificationController;
//# sourceMappingURL=notificationController.js.map
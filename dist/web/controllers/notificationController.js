"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notificationService_1 = require("../../domain/services/notificationService");
class NotificationController {
    constructor() {
        this.notificationService = new notificationService_1.NotificationService();
        /**
         * Obtiene las notificaciones del usuario autenticado
         */
        this.getUserNotifications = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                // Obtener filtros de query parameters
                const filters = {
                    status: req.query.status,
                    type: req.query.type,
                    limit: req.query.limit ? parseInt(req.query.limit) : 50,
                    offset: req.query.offset ? parseInt(req.query.offset) : 0
                };
                const notifications = await this.notificationService.getUserNotifications(userId, filters);
                res.status(200).json({
                    data: notifications,
                    count: notifications.length,
                    filters
                });
            }
            catch (error) {
                console.error('Error al obtener notificaciones:', error);
                res.status(500).json({
                    error: 'Error al obtener notificaciones',
                    details: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
        /**
         * Obtiene el conteo de notificaciones no leídas
         */
        this.getUnreadCount = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const count = await this.notificationService.getUnreadCount(userId);
                res.status(200).json({
                    unreadCount: count
                });
            }
            catch (error) {
                console.error('Error al obtener conteo de notificaciones:', error);
                res.status(500).json({
                    error: 'Error al obtener conteo de notificaciones',
                    details: error instanceof Error ? error.message : 'Error desconocido'
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
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id } = req.params;
                if (!id) {
                    res.status(400).json({ error: 'ID de notificación requerido' });
                    return;
                }
                const success = await this.notificationService.markAsRead(id, userId);
                if (success) {
                    res.status(200).json({
                        message: 'Notificación marcada como leída',
                        success: true
                    });
                }
                else {
                    res.status(404).json({
                        error: 'Notificación no encontrada o ya estaba marcada como leída',
                        success: false
                    });
                }
            }
            catch (error) {
                console.error('Error al marcar notificación como leída:', error);
                res.status(500).json({
                    error: 'Error al marcar notificación como leída',
                    details: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
        /**
         * Marca todas las notificaciones como leídas
         */
        this.markAllAsRead = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const count = await this.notificationService.markAllAsRead(userId);
                res.status(200).json({
                    message: `${count} notificaciones marcadas como leídas`,
                    count
                });
            }
            catch (error) {
                console.error('Error al marcar todas las notificaciones como leídas:', error);
                res.status(500).json({
                    error: 'Error al marcar todas las notificaciones como leídas',
                    details: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
        /**
         * Elimina una notificación
         */
        this.deleteNotification = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id } = req.params;
                if (!id) {
                    res.status(400).json({ error: 'ID de notificación requerido' });
                    return;
                }
                const success = await this.notificationService.deleteNotification(id, userId);
                if (success) {
                    res.status(200).json({
                        message: 'Notificación eliminada exitosamente',
                        success: true
                    });
                }
                else {
                    res.status(404).json({
                        error: 'Notificación no encontrada',
                        success: false
                    });
                }
            }
            catch (error) {
                console.error('Error al eliminar notificación:', error);
                res.status(500).json({
                    error: 'Error al eliminar notificación',
                    details: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
        /**
         * Elimina notificaciones antiguas
         */
        this.deleteOldNotifications = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const daysOld = req.query.days ? parseInt(req.query.days) : 30;
                const count = await this.notificationService.deleteOldNotifications(userId, daysOld);
                res.status(200).json({
                    message: `${count} notificaciones antiguas eliminadas`,
                    count,
                    daysOld
                });
            }
            catch (error) {
                console.error('Error al eliminar notificaciones antiguas:', error);
                res.status(500).json({
                    error: 'Error al eliminar notificaciones antiguas',
                    details: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
    }
}
exports.NotificationController = NotificationController;
//# sourceMappingURL=notificationController.js.map
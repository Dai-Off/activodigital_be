"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../web/controllers/notificationController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const notificationController = new notificationController_1.NotificationController();
// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware_1.authenticateToken);
/**
 * @route GET /api/notifications
 * @desc Obtener notificaciones del usuario autenticado
 * @access Private
 */
router.get('/', notificationController.getUserNotifications);
/**
 * @route GET /api/notifications/unread-count
 * @desc Obtener conteo de notificaciones no leídas
 * @access Private
 */
router.get('/unread-count', notificationController.getUnreadCount);
/**
 * @route PUT /api/notifications/:id/read
 * @desc Marcar una notificación como leída
 * @access Private
 */
router.put('/:id/read', notificationController.markAsRead);
/**
 * @route PUT /api/notifications/mark-all-read
 * @desc Marcar todas las notificaciones como leídas
 * @access Private
 */
router.put('/mark-all-read', notificationController.markAllAsRead);
/**
 * @route DELETE /api/notifications/:id
 * @desc Eliminar una notificación
 * @access Private
 */
router.delete('/:id', notificationController.deleteNotification);
/**
 * @route DELETE /api/notifications/cleanup
 * @desc Eliminar notificaciones antiguas (más de 30 días)
 * @access Private
 */
router.delete('/cleanup', notificationController.deleteOldNotifications);
exports.default = router;
//# sourceMappingURL=notifications.js.map
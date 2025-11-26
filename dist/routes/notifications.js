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
 * @route GET /notifications/unread
 * @desc Obtener notificaciones NO LEÍDAS del usuario autenticado (Requiere buildingId)
 * @access Private
 */
router.get("/unread", notificationController.getUnreadNotifications);
/**
 * @route GET /notifications
 * @desc Obtener notificaciones de un listado de edificios
 * @access Private
 */
router.get("/", notificationController.getUserNotificationsByBuilding);
/**
 * @route GET /notifications
 * @desc Obtener TODAS las notificaciones de un edificio (Feed completo, Requiere buildingId)
 * @access Private
 */
router.get("/building", notificationController.getBuildingNotifications);
/**
 * @route POST /notifications
 * @desc Crear una nueva notificación
 * @access Private
 */
router.post("/", notificationController.createUserNotifications);
/**
 * @route PUT /notifications/:id/read
 * @desc Marcar una notificación como leída
 * @access Private
 */
router.put("/:id/read", notificationController.markAsRead);
/**
 * @route PUT /notifications/markAll
 * @desc Marcar todas la notificaciones de un usuario como leídas
 * @access Private
 */
router.put("/markAll", notificationController.markAllAsRead);
/**
 * @route DELETE /notifications/cleanup
 * @desc Eliminar notificaciones antiguas (más de 30 días o lo especificado por query param 'days')
 * @access Private
 */
router.delete("/cleanup", notificationController.deleteOldNotifications);
/**
 * @route DELETE /notifications/:id
 * @desc Eliminar una notificación específica
 * @access Private
 */
router.delete("/:id", notificationController.deleteNotification);
exports.default = router;
//# sourceMappingURL=notifications.js.map
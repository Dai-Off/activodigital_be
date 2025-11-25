import { Router } from "express";
import { NotificationController } from "../web/controllers/notificationController";
import { authenticateToken } from "../web/middlewares/authMiddleware";

const router = Router();
const notificationController = new NotificationController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route GET /api/notifications
 * @desc Obtener notificaciones del usuario autenticado
 * @access Private
 */
//router.get("/", notificationController.getUserNotifications);
router.post("/");

/**
 * @route GET /api/notifications/unread-count
 * @desc Obtener conteo de notificaciones no leídas
 * @access Private
 */
//router.get("/unread-count", notificationController.getUnreadCount);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Marcar una notificación como leída
 * @access Private
 */
//router.put("/:id/read", notificationController.markAsRead);

/**
 * @route PUT /api/notifications/mark-all-read
 * @desc Marcar todas las notificaciones como leídas
 * @access Private
 */
//router.put("/mark-all-read", notificationController.markAllAsRead);

/**
 * @route DELETE /api/notifications/:id
 * @desc Eliminar una notificación
 * @access Private
 */
router.delete("/:id", notificationController.deleteNotification);

/**
 * @route DELETE /api/notifications/cleanup
 * @desc Eliminar notificaciones antiguas (más de 30 días)
 * @access Private
 */
router.delete("/cleanup", notificationController.deleteOldNotifications);

export default router;

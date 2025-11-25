import { Router } from "express";
import { NotificationController } from "../web/controllers/notificationController";
import { authenticateToken } from "../web/middlewares/authMiddleware";

const router = Router();
const notificationController = new NotificationController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route GET /api/notifications/unread
 * @desc Obtener notificaciones NO LEÍDAS del usuario autenticado (Requiere buildingId)
 * @access Private
 */
router.get("/unread", notificationController.getUnreadNotifications);

/**
 * @route GET /api/notifications
 * @desc Obtener TODAS las notificaciones de un edificio (Feed completo, Requiere buildingId)
 * @access Private
 */
router.get("/", notificationController.getBuildingNotifications);

/**
 * @route POST /api/notifications
 * @desc Crear una nueva notificación
 * @access Private
 */
router.post("/", notificationController.createUserNotifications);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Marcar una notificación como leída
 * @access Private
 */
router.put("/:id/read", notificationController.markAsRead);

/**
 * @route DELETE /api/notifications/:id
 * @desc Eliminar una notificación específica
 * @access Private
 */
router.delete("/:id", notificationController.deleteNotification);

/**
 * @route DELETE /api/notifications/cleanup
 * @desc Eliminar notificaciones antiguas (más de 30 días o lo especificado por query param 'days')
 * @access Private
 */
router.delete("/cleanup", notificationController.deleteOldNotifications);

export default router;

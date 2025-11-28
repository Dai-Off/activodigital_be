import { Router } from "express";
import { NotificationController } from "../web/controllers/notificationController";
import { authenticateToken } from "../web/middlewares/authMiddleware";

const router = Router();
const notificationController = new NotificationController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

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

export default router;

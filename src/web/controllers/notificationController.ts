import { Request, Response } from "express";
import { NotificationService } from "../../domain/services/notificationService";
import {
  NotificationFilters,
  NotificationType,
} from "../../types/notification";

export class NotificationController {
  private notificationService = new NotificationService();

  /**
   * Obtiene las notificaciones del usuario autenticado
   */
  // getUserNotifications = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const userId = req.user?.id;
  //     if (!userId) {
  //       res.status(401).json({ error: "Usuario no autenticado" });
  //       return;
  //     }

  //     // Obtener filtros de query parameters
  //     const filters: NotificationFilters = {
  //       status: req.query.status as NotificationStatus,
  //       type: req.query.type as any,
  //       limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
  //       offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  //     };

  //     const notifications = await this.notificationService.getUserNotifications(
  //       userId,
  //       filters
  //     );

  //     res.status(200).json({
  //       data: notifications,
  //       count: notifications.length,
  //       filters,
  //     });
  //   } catch (error) {
  //     console.error("Error al obtener notificaciones:", error);
  //     res.status(500).json({
  //       error: "Error al obtener notificaciones",
  //       details: error instanceof Error ? error.message : "Error desconocido",
  //     });
  //   }
  // };

  /**
   * Obtiene el conteo de notificaciones no leídas
   */
  // getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const userId = req.user?.id;
  //     if (!userId) {
  //       res.status(401).json({ error: "Usuario no autenticado" });
  //       return;
  //     }

  //     const count = await this.notificationService.getUnreadCount(userId);

  //     res.status(200).json({
  //       unreadCount: count,
  //     });
  //   } catch (error) {
  //     console.error("Error al obtener conteo de notificaciones:", error);
  //     res.status(500).json({
  //       error: "Error al obtener conteo de notificaciones",
  //       details: error instanceof Error ? error.message : "Error desconocido",
  //     });
  //   }
  // };

  /**
   * Crea notificaciones
   */
  createUserNotifications = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const {} = req.body;
      const notificationData = {
        building_id: "0007a31b-98fa-4dba-a05e-b62fad1d2e87",
        type: NotificationType.FINANCIAL,
        title: "El certificado eléctrico está por vencer",
      };
      await this.notificationService.createNotification(notificationData);
      res.status(200).json({
        message: "La notificación se ha creado con éxito",
      });
    } catch (error) {
      console.error("Error al obtener conteo de notificaciones:", error);
      res.status(500).json({
        error: "Error al crear la notificación",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  /**
   * Marca una notificación como leída
   */
  // markAsRead = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const userId = req.user?.id;
  //     if (!userId) {
  //       res.status(401).json({ error: "Usuario no autenticado" });
  //       return;
  //     }

  //     const { id } = req.params;
  //     if (!id) {
  //       res.status(400).json({ error: "ID de notificación requerido" });
  //       return;
  //     }

  //     const success = await this.notificationService.markAsRead(id, userId);

  //     if (success) {
  //       res.status(200).json({
  //         message: "Notificación marcada como leída",
  //         success: true,
  //       });
  //     } else {
  //       res.status(404).json({
  //         error: "Notificación no encontrada o ya estaba marcada como leída",
  //         success: false,
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error al marcar notificación como leída:", error);
  //     res.status(500).json({
  //       error: "Error al marcar notificación como leída",
  //       details: error instanceof Error ? error.message : "Error desconocido",
  //     });
  //   }
  // };

  /**
   * Marca todas las notificaciones como leídas
   */
  // markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const userId = req.user?.id;
  //     if (!userId) {
  //       res.status(401).json({ error: "Usuario no autenticado" });
  //       return;
  //     }

  //     const count = await this.notificationService.markAllAsRead(userId);

  //     res.status(200).json({
  //       message: `${count} notificaciones marcadas como leídas`,
  //       count,
  //     });
  //   } catch (error) {
  //     console.error(
  //       "Error al marcar todas las notificaciones como leídas:",
  //       error
  //     );
  //     res.status(500).json({
  //       error: "Error al marcar todas las notificaciones como leídas",
  //       details: error instanceof Error ? error.message : "Error desconocido",
  //     });
  //   }
  // };

  /**
   * Elimina una notificación
   */
  deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "ID de notificación requerido" });
        return;
      }

      const success = await this.notificationService.deleteNotification(
        id,
        userId
      );

      if (success) {
        res.status(200).json({
          message: "Notificación eliminada exitosamente",
          success: true,
        });
      } else {
        res.status(404).json({
          error: "Notificación no encontrada",
          success: false,
        });
      }
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
      res.status(500).json({
        error: "Error al eliminar notificación",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  /**
   * Elimina notificaciones antiguas
   */
  deleteOldNotifications = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      const daysOld = req.query.days ? parseInt(req.query.days as string) : 30;

      const count = await this.notificationService.deleteOldNotifications(
        userId,
        daysOld
      );

      res.status(200).json({
        message: `${count} notificaciones antiguas eliminadas`,
        count,
        daysOld,
      });
    } catch (error) {
      console.error("Error al eliminar notificaciones antiguas:", error);
      res.status(500).json({
        error: "Error al eliminar notificaciones antiguas",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };
}

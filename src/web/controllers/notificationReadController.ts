import { notificationReadService } from "../../domain/services/notificationReadService";
import { Request, Response } from "express";

const NotificationReadService = new notificationReadService();

export const markNotificationAsRead = async (req: Request, res: Response) => {
  const { userId, notificationId } = req.body;
  try {
    await NotificationReadService.markNotificationAsRead(
      userId,
      notificationId
    );
    res.json({ message: "La notificación se ha marcado como leída" });
  } catch (error) {
    console.log(error);
  }
};

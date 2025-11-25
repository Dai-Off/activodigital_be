import { Router } from "express";
import { markNotificationAsRead } from "../web/controllers/notificationReadController";

const router = Router();

router.get("/unread");
router.get("/read");

router.post("/", markNotificationAsRead);

router.put("/:id");

router.delete("/:id");

export default router;

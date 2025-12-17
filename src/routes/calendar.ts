import { Router } from "express";
import { CalendarController } from "../web/controllers/calendarController";
import { authenticateToken } from "../web/middlewares/authMiddleware";

const router = Router();
const calendarController = new CalendarController();

router.use(authenticateToken);

/**
 * @route GET /calendar
 * @desc Obtener eventos del calendario de un edificio
 * query: buildingId (required), startDate, endDate, category
 */
router.get("/", calendarController.getEvents);

/**
 * @route POST /calendar
 * @desc Crear un nuevo evento
 */
router.post("/", calendarController.createEvent);

/**
 * @route PUT /calendar/:id
 * @desc Actualizar evento (cambiar estado, fecha, etc)
 */
router.put("/:id", calendarController.updateEvent);

/**
 * @route DELETE /calendar/:id
 * @desc Eliminar evento
 */
router.delete("/:id", calendarController.deleteEvent);

export default router;

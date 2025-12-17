"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calendarController_1 = require("../web/controllers/calendarController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const calendarController = new calendarController_1.CalendarController();
router.use(authMiddleware_1.authenticateToken);
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
exports.default = router;
//# sourceMappingURL=calendar.js.map